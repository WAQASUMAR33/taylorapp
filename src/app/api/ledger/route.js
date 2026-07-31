import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch paginated and filtered ledger entries
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page") || "1";
        const limit = searchParams.get("limit") || "50";
        const search = searchParams.get("search") || "";
        const searchName = searchParams.get("searchName") || "";
        const searchFatherName = searchParams.get("searchFatherName") || "";
        const searchPhone = searchParams.get("searchPhone") || "";
        const customerId = searchParams.get("customerId") || "";
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        // Base where filter
        const where = {
            customer: {
                name: { not: "Cash Account" }
            }
        };

        if (customerId) {
            where.customerId = parseInt(customerId);
        }

        if (dateFrom || dateTo) {
            where.entryDate = {};
            if (dateFrom) {
                where.entryDate.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                where.entryDate.lte = toDate;
            }
        }

        if (search) {
            const searchOr = [
                { description: { contains: search } },
                {
                    customer: {
                        OR: [
                            { name: { contains: search } },
                            { fatherName: { contains: search } },
                            { phone: { contains: search } },
                            { address: { contains: search } },
                            { measurementNo: { contains: search } }
                        ]
                    }
                }
            ];

            const searchId = parseInt(search);
            if (!isNaN(searchId)) {
                searchOr.push({ id: searchId });
            }

            where.AND = where.AND || [];
            where.AND.push({ OR: searchOr });
        }

        if (searchName) {
            where.AND = where.AND || [];
            where.AND.push({ customer: { name: { contains: searchName } } });
        }

        if (searchFatherName) {
            where.AND = where.AND || [];
            where.AND.push({ customer: { fatherName: { contains: searchFatherName } } });
        }

        if (searchPhone) {
            where.AND = where.AND || [];
            where.AND.push({ customer: { phone: { contains: searchPhone } } });
        }

        // Fetch paginated entries and total count
        const [entries, totalCount] = await Promise.all([
            prisma.ledgerentry.findMany({
                where,
                include: {
                    customer: true,
                    purchase: true,
                    booking: {
                        include: {
                            customer: true,
                            items: {
                                include: {
                                    product: true,
                                    selectedOptions: {
                                        include: {
                                            stitchingOption: true
                                        }
                                    }
                                }
                            },
                            staff: {
                                include: {
                                    customer: true
                                }
                            }
                        }
                    },
                    saleReturn: {
                        include: {
                            customer: true,
                            items: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    }
                },
                orderBy: [
                    { entryDate: "asc" },
                    { id: "asc" }
                ],
                skip,
                take: limitNum,
            }),
            prisma.ledgerentry.count({ where })
        ]);

        // Calculate total debit and credit matching current filter, plus today's received and payments
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const [debitSum, creditSum, todayReceivedSum, todayPaymentsSum] = await Promise.all([
            prisma.ledgerentry.aggregate({
                where: { ...where, type: "DEBIT" },
                _sum: { amount: true }
            }),
            prisma.ledgerentry.aggregate({
                where: { ...where, type: "CREDIT" },
                _sum: { amount: true }
            }),
            prisma.ledgerentry.aggregate({
                where: {
                    customer: { name: { not: "Cash Account" } },
                    type: "CREDIT",
                    entryDate: { gte: todayStart, lte: todayEnd }
                },
                _sum: { amount: true }
            }),
            prisma.ledgerentry.aggregate({
                where: {
                    OR: [
                        {
                            customer: { name: "Cash Account" },
                            type: "CREDIT",
                            entryDate: { gte: todayStart, lte: todayEnd }
                        },
                        {
                            customer: {
                                OR: [
                                    { accountCategory: { name: { contains: "supplier" } } },
                                    { accountCategory: { name: { contains: "vendor" } } },
                                    { accountCategory: { name: { contains: "expense" } } },
                                    { accountCategory: { name: { contains: "employee" } } },
                                    { accountCategory: { name: { contains: "tailor" } } },
                                    { accountCategory: { name: { contains: "cutter" } } }
                                ]
                            },
                            type: "DEBIT",
                            entryDate: { gte: todayStart, lte: todayEnd }
                        }
                    ]
                },
                _sum: { amount: true }
            })
        ]);

        const totals = {
            debit: parseFloat(debitSum._sum.amount || 0),
            credit: parseFloat(creditSum._sum.amount || 0),
            todayReceived: parseFloat(todayReceivedSum._sum.amount || 0),
            todayPayments: parseFloat(todayPaymentsSum._sum.amount || 0)
        };

        // Calculate initial balance (running balance of all matching entries before current page)
        let initialBalance = 0;
        if (entries.length > 0) {
            const firstEntry = entries[0];
            const priorWhere = {
                customer: {
                    name: { not: "Cash Account" }
                }
            };

            if (customerId) {
                priorWhere.customerId = parseInt(customerId);
            }

            if (search) {
                const searchOr = [
                    { description: { contains: search } },
                    {
                        customer: {
                            OR: [
                                { name: { contains: search } },
                                { fatherName: { contains: search } },
                                { phone: { contains: search } },
                                { address: { contains: search } },
                                { measurementNo: { contains: search } }
                            ]
                        }
                    }
                ];

                const searchId = parseInt(search);
                if (!isNaN(searchId)) {
                    searchOr.push({ id: searchId });
                }

                priorWhere.AND = priorWhere.AND || [];
                priorWhere.AND.push({ OR: searchOr });
            }

            if (searchName) {
                priorWhere.AND = priorWhere.AND || [];
                priorWhere.AND.push({ customer: { name: { contains: searchName } } });
            }

            if (searchFatherName) {
                priorWhere.AND = priorWhere.AND || [];
                priorWhere.AND.push({ customer: { fatherName: { contains: searchFatherName } } });
            }

            if (searchPhone) {
                priorWhere.AND = priorWhere.AND || [];
                priorWhere.AND.push({ customer: { phone: { contains: searchPhone } } });
            }

            priorWhere.AND = priorWhere.AND || [];
            priorWhere.AND.push({
                OR: [
                    { entryDate: { lt: firstEntry.entryDate } },
                    {
                        AND: [
                            { entryDate: firstEntry.entryDate },
                            { id: { lt: firstEntry.id } }
                        ]
                    }
                ]
            });

            const [priorDebit, priorCredit] = await Promise.all([
                prisma.ledgerentry.aggregate({
                    where: { ...priorWhere, type: "DEBIT" },
                    _sum: { amount: true }
                }),
                prisma.ledgerentry.aggregate({
                    where: { ...priorWhere, type: "CREDIT" },
                    _sum: { amount: true }
                })
            ]);

            initialBalance = parseFloat(priorDebit._sum.amount || 0) - parseFloat(priorCredit._sum.amount || 0);
        }

        // Serialize decimal values for clean delivery
        const serializedEntries = entries.map(entry => ({
            ...entry,
            amount: entry.amount.toString(),
            customer: entry.customer ? {
                ...entry.customer,
                balance: entry.customer.balance ? parseFloat(entry.customer.balance.toString()) : 0
            } : null,
            purchase: entry.purchase ? {
                ...entry.purchase,
                totalAmount: entry.purchase.totalAmount.toString()
            } : null,
            booking: entry.booking ? {
                ...entry.booking,
                totalAmount: entry.booking.totalAmount.toString(),
                advanceAmount: entry.booking.advanceAmount.toString(),
                remainingAmount: entry.booking.remainingAmount.toString(),
                items: (entry.booking.items || []).map(i => ({
                    ...i,
                    unitPrice: i.unitPrice.toString(),
                    totalPrice: i.totalPrice.toString(),
                    discount: i.discount.toString()
                }))
            } : null
        }));

        return NextResponse.json({
            entries: serializedEntries,
            totalCount,
            totals,
            initialBalance
        });
    } catch (error) {
        console.error("Failed to fetch ledger entries:", error);
        return NextResponse.json(
            { error: "Failed to fetch ledger entries" },
            { status: 500 }
        );
    }
}

// POST - Create a new ledger entry
export async function POST(req) {
    try {
        const body = await req.json();
        const { customerId, type, amount, description, purchaseId } = body;

        if (!customerId || !type || !amount) {
            return NextResponse.json(
                { error: "Customer ID, type, and amount are required" },
                { status: 400 }
            );
        }

        // Run only the two atomic writes inside the transaction.
        // Avoid any `include` inside tx — nested queries cause P2028 timeout.
        const { id: newEntryId } = await prisma.$transaction(async (tx) => {
            // 1. Create the ledger entry (no include)
            const ledgerEntry = await tx.ledgerentry.create({
                data: {
                    customerId: parseInt(customerId),
                    type,
                    amount: parseFloat(amount),
                    description,
                    purchaseId: purchaseId ? parseInt(purchaseId) : null,
                },
            });

            // 2. Update customer balance
            const balanceAdjustment = type === 'DEBIT' ? parseFloat(amount) : -parseFloat(amount);
            await tx.customer.update({
                where: { id: parseInt(customerId) },
                data: { balance: { increment: balanceAdjustment } },
            });

            return ledgerEntry;
        });

        // Fetch the full entry with relations OUTSIDE the transaction (safe, no timeout risk)
        const result = await prisma.ledgerentry.findUnique({
            where: { id: newEntryId },
            include: { customer: true, purchase: true },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Failed to create ledger entry:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a ledger entry
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            const entry = await tx.ledgerentry.findUnique({
                where: { id: parseInt(id) },
            });

            if (!entry) {
                throw new Error("Entry not found");
            }

            // Reverse balance adjustment
            const balanceAdjustment = entry.type === 'DEBIT' ? -parseFloat(entry.amount || 0) : parseFloat(entry.amount || 0);
            await tx.customer.update({
                where: { id: entry.customerId },
                data: {
                    balance: { increment: balanceAdjustment }
                }
            });

            await tx.ledgerentry.delete({
                where: { id: parseInt(id) },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete ledger entry:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete" },
            { status: 500 }
        );
    }
}
