import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch paginated and filtered ledger entries
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page") || "1";
        const limit = searchParams.get("limit") || "50";
        const search = searchParams.get("search") || "";
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

            where.AND = [
                { OR: searchOr }
            ];
        }

        // Fetch paginated entries and total count
        const [entries, totalCount] = await Promise.all([
            prisma.ledgerentry.findMany({
                where,
                include: {
                    customer: true,
                    purchase: true,
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

        // Calculate total debit and credit matching current filter (across all pages)
        const [debitSum, creditSum] = await Promise.all([
            prisma.ledgerentry.aggregate({
                where: { ...where, type: "DEBIT" },
                _sum: { amount: true }
            }),
            prisma.ledgerentry.aggregate({
                where: { ...where, type: "CREDIT" },
                _sum: { amount: true }
            })
        ]);

        const totals = {
            debit: parseFloat(debitSum._sum.amount || 0),
            credit: parseFloat(creditSum._sum.amount || 0)
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

                priorWhere.AND = [
                    { OR: searchOr }
                ];
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
