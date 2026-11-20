import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeBranchId } from "@/lib/branchScope";
import { getNextMeasurementNo } from "@/lib/measurementHelper";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = String(session?.user?.role || "").trim().toUpperCase() === "ADMIN" || Boolean(session?.user?.isAdmin);
        const body = await req.json();
        const {
            name, fatherName, measurementNo, phone, email, address, notes, code,
            accountCategoryId, balance, image, measurementMode,
            customId, id: bodyId, idMode
        } = body;
        const branchId = writeBranchId(session, body.branchId) || 1;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        // Check if category is a tailor or cutter
        let isStaffCategory = false;
        if (accountCategoryId) {
            const cat = await prisma.accountCategory.findUnique({
                where: { id: parseInt(accountCategoryId) },
                select: { name: true }
            });
            const catName = cat?.name?.toLowerCase() || "";
            if (catName.includes("tailor") || catName.includes("cutter")) {
                isStaffCategory = true;
            }
        }

        let trimmedMeasurementNo = measurementNo ? measurementNo.trim() : null;

        if (isStaffCategory) {
            // Tailors and cutters are staff and do not take customer measurement numbers
            trimmedMeasurementNo = null;
        } else if (measurementMode === "auto") {
            trimmedMeasurementNo = await getNextMeasurementNo(prisma);
        } else if (trimmedMeasurementNo) {
            const existingMeasurementNo = await prisma.customer.findFirst({
                where: {
                    measurementNo: trimmedMeasurementNo,
                }
            });
            if (existingMeasurementNo) {
                return NextResponse.json(
                    { error: `M# ${trimmedMeasurementNo} is already assigned to customer '${existingMeasurementNo.name}', please use another number` },
                    { status: 400 }
                );
            }
        }

        const customer = await prisma.$transaction(async (tx) => {
            const customerData = {
                name,
                fatherName,
                measurementNo: trimmedMeasurementNo,
                phone,
                email,
                address,
                notes,
                image: image || null,
                balance: 0, // Start at 0, ledger will update it
                code: code || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
                accountCategoryId: accountCategoryId ? parseInt(accountCategoryId) : null,
                branchId: branchId || null,
            };

            const newCustomer = await tx.customer.create({
                data: customerData,
            });

            // Only admin account can set an initial opening balance
            const openingBalance = (isAdmin && balance) ? parseFloat(balance) : 0;
            if (openingBalance !== 0) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: newCustomer.id,
                        type: openingBalance > 0 ? "DEBIT" : "CREDIT",
                        amount: Math.abs(openingBalance),
                        description: "Opening Balance",
                        entryDate: new Date(),
                        branchId: branchId || null,
                    }
                });

                // Update the customer balance
                return await tx.customer.update({
                    where: { id: newCustomer.id },
                    data: {
                        balance: openingBalance
                    },
                    include: {
                        accountCategory: true,
                        branch: true,
                    }
                });
            }

            return await tx.customer.findUnique({
                where: { id: newCustomer.id },
                include: {
                    accountCategory: true,
                    branch: true,
                }
            });
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error("Failed to create customer:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 400 }
        );
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page") || "1";
        const limit = searchParams.get("limit") || "50";
        const search = searchParams.get("search") || "";
        const nameFilter = searchParams.get("name") || "";
        const fatherNameFilter = searchParams.get("fatherName") || "";
        const phoneFilter = searchParams.get("phone") || "";
        const addressFilter = searchParams.get("address") || "";
        const categoryId = searchParams.get("categoryId") || "";
        const measurementNo = searchParams.get("measurementNo") || "";
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        // Validate sortBy
        const allowedSortFields = ["name", "fatherName", "measurementNo", "balance", "phone", "address", "createdAt"];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const orderDirection = sortOrder === "asc" ? "asc" : "desc";

        const orderBy = {};
        orderBy[orderField] = orderDirection;

        // Base where condition: exclude cutters and tailors by default unless searching by measurementNo or specific categoryId
        const where = { AND: [] };

        if (!measurementNo && !categoryId) {
            where.AND.push(
                {
                    OR: [
                        { accountCategory: null },
                        {
                            accountCategory: {
                                name: {
                                    not: { contains: "cutter" }
                                }
                            }
                        }
                    ]
                },
                {
                    OR: [
                        { accountCategory: null },
                        {
                            accountCategory: {
                                name: {
                                    not: { contains: "tailor" }
                                }
                            }
                        }
                    ]
                }
            );
        }

        if (search) {
            where.AND.push({
                OR: [
                    { name: { contains: search } },
                    { fatherName: { contains: search } },
                    { phone: { contains: search } },
                    { address: { contains: search } },
                    { measurementNo: { contains: search } },
                    { code: { contains: search } }
                ]
            });
        }

        // Customers are shared across all branches for all user roles.
        // If an explicit branchId filter is passed, filter by that branch.
        const branchParam = searchParams.get("branchId");
        if (branchParam && branchParam !== "ALL") {
            where.AND.push({ branchId: parseInt(branchParam) });
        }

        if (nameFilter) {
            where.AND.push({ name: { contains: nameFilter } });
        }

        if (fatherNameFilter) {
            where.AND.push({ fatherName: { contains: fatherNameFilter } });
        }

        if (phoneFilter) {
            where.AND.push({ phone: { contains: phoneFilter } });
        }

        if (addressFilter) {
            where.AND.push({ address: { contains: addressFilter } });
        }

        if (categoryId) {
            where.AND.push({
                accountCategoryId: parseInt(categoryId)
            });
        }

        if (measurementNo) {
            where.AND.push({
                measurementNo: { contains: measurementNo }
            });
        }

        const [customers, totalCount, maxMeasResult] = await Promise.all([
            prisma.customer.findMany({
                where,
                include: {
                    accountCategory: true,
                    branch: true,
                    measurements: {
                        orderBy: { takenAt: "desc" },
                        take: 1
                    }
                },
                orderBy,
                skip,
                take: limitNum,
            }),
            prisma.customer.count({ where }),
            prisma.$queryRawUnsafe(`
                SELECT MAX(CAST(c.measurementNo AS UNSIGNED)) AS maxNo 
                FROM customer c
                LEFT JOIN accountcategory ac ON c.accountCategoryId = ac.id
                WHERE c.measurementNo IS NOT NULL 
                  AND c.measurementNo REGEXP '^[0-9]+$' 
                  AND CAST(c.measurementNo AS UNSIGNED) < 1000000000
                  AND (ac.name IS NULL OR (LOWER(ac.name) NOT LIKE '%tailor%' AND LOWER(ac.name) NOT LIKE '%cutter%'))
            `)
        ]);

        const maxMeasurementNo = maxMeasResult[0]?.maxNo != null ? Number(maxMeasResult[0].maxNo) : 0;

        return NextResponse.json({ customers, totalCount, maxMeasurementNo });
    } catch (error) {
        console.error("Failed to fetch customers:", error);
        return NextResponse.json(
            { error: "Failed to fetch customers" },
            { status: 500 }
        );
    }
}


export async function DELETE(req) {
    try {
        return NextResponse.json({ error: "Method not allowed here" }, { status: 405 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
