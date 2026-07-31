import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, fatherName, measurementNo, phone, email, address, notes, code, accountCategoryId, balance, image } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const trimmedMeasurementNo = measurementNo ? measurementNo.trim() : null;
        if (trimmedMeasurementNo) {
            const existingMeasurementNo = await prisma.customer.findFirst({
                where: {
                    measurementNo: trimmedMeasurementNo,
                }
            });
            if (existingMeasurementNo) {
                return NextResponse.json(
                    { error: `Measurement Number '${trimmedMeasurementNo}' is already assigned to customer '${existingMeasurementNo.name}'` },
                    { status: 400 }
                );
            }
        }

        const customer = await prisma.$transaction(async (tx) => {
            const newCustomer = await tx.customer.create({
                data: {
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
                },
            });

            const openingBalance = balance ? parseFloat(balance) : 0;
            if (openingBalance !== 0) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: newCustomer.id,
                        type: openingBalance > 0 ? "DEBIT" : "CREDIT",
                        amount: Math.abs(openingBalance),
                        description: "Opening Balance",
                        entryDate: new Date(),
                    }
                });

                // Update the customer balance
                return await tx.customer.update({
                    where: { id: newCustomer.id },
                    data: {
                        balance: openingBalance
                    },
                    include: {
                        accountCategory: true
                    }
                });
            }

            return await tx.customer.findUnique({
                where: { id: newCustomer.id },
                include: { accountCategory: true }
            });
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error("Failed to create customer:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
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

        // Base where condition to exclude cutters and tailors
        const where = {
            AND: [
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
            ]
        };

        if (search) {
            where.AND.push({
                OR: [
                    { name: { contains: search } },
                    { fatherName: { contains: search } },
                    { phone: { contains: search } },
                    { address: { contains: search } },
                    { measurementNo: { contains: search } }
                ]
            });
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

        const [customers, totalCount] = await Promise.all([
            prisma.customer.findMany({
                where,
                include: {
                    accountCategory: true
                },
                orderBy,
                skip,
                take: limitNum,
            }),
            prisma.customer.count({ where })
        ]);

        return NextResponse.json({ customers, totalCount });
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
        const { searchParams } = new URL(req.url); // Use URL API to extract ID
        // Note: In Next.js App Router, dynamic routes like [customerId]/route.js might be better,
        // but here we seem to be using query params or a different pattern?
        // Wait, the client calls `/api/customers/${customerId}`.
        // This means we should probably use a dynamic route file: src/app/api/customers/[id]/route.js
        // BUT the existing GET/POST are in src/app/api/customers/route.js
        // Let's check if there is a separate file for [id].
        // If not, we can't handle DELETE /api/customers/123 here easily unless we parse the URL path manually or change the client.
        // However, looking at CustomerManagementClient: `fetch(/api/customers/${customerId}, ...)`
        // This implies likely a separate route structure for ID-based operations or this file handles it if it's a catch-all?
        // Let's check if `src/app/api/customers/[id]/route.js` exists.
        // If it doesn't, this `route.js` probably only handles collection-level ops.
        // I will assume for now I need to create/edit the dynamic route file.
        // Let me abort this specific change and check the directory structure first.
        return NextResponse.json({ error: "Method not allowed here" }, { status: 405 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
