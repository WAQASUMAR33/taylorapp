import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getOrCreateCashAccount(tx) {
    let acc = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
    if (!acc) {
        acc = await tx.customer.create({
            data: { name: 'Cash Account', code: 'CASH-SYS-001', notes: 'System cash ledger account' }
        });
    }
    return acc;
}

async function getOrCreateBankAccount(tx, bankId) {
    const bank = await tx.bank.findUnique({ where: { id: bankId } });
    if (!bank) throw new Error(`Bank with ID ${bankId} not found`);
    const accountName = `Bank Account - ${bank.name}`;
    let acc = await tx.customer.findFirst({ where: { name: accountName } });
    if (!acc) {
        acc = await tx.customer.create({
            data: { name: accountName, code: `BANK-${bankId}`, notes: `System receiving account for ${bank.name}` }
        });
    }
    return { acc, bank };
}

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
                    receiving: true,
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
            receiving: entry.receiving ? {
                ...entry.receiving,
                amount: entry.receiving.amount.toString()
            } : null,
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
            { error: "Failed to fetch ledger entries", details: error.message },
            { status: 500 }
        );
    }
}

// POST - Create a new ledger entry
export async function POST(req) {
    try {
        const body = await req.json();
        const { customerId, type, amount, description, purchaseId, bookingId, paymentMethod, bankId, entryDate } = body;

        if (!customerId || !type || !amount) {
            return NextResponse.json(
                { error: "Customer ID, type, and amount are required" },
                { status: 400 }
            );
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json(
                { error: "Amount must be a positive number" },
                { status: 400 }
            );
        }

        const resolvedDate = entryDate ? new Date(entryDate) : new Date();

        // Run only the atomic writes inside the transaction.
        const { id: newEntryId } = await prisma.$transaction(async (tx) => {
            let receivingId = null;

            // If entry is CREDIT (money received from customer), record in the new receiving model
            if (type === 'CREDIT') {
                const today = new Date();
                const datePrefix = `REC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
                const countToday = await tx.receiving.count({
                    where: { receiptNo: { startsWith: datePrefix } }
                });
                const receiptNo = `${datePrefix}-${String(countToday + 1).padStart(4, '0')}`;

                const isBank = (paymentMethod === 'BANK') || (/bank/i.test(description || ''));
                const paymentMode = isBank ? 'BANK' : 'CASH';

                const receiving = await tx.receiving.create({
                    data: {
                        receiptNo,
                        customerId: parseInt(customerId),
                        bookingId: bookingId ? parseInt(bookingId) : null,
                        amount: parsedAmount,
                        paymentMode,
                        bankId: (isBank && bankId) ? parseInt(bankId) : null,
                        receivingDate: resolvedDate,
                        description: description || 'Ledger Receiving Entry'
                    }
                });
                receivingId = receiving.id;
            }

            // 1. Create the customer ledger entry
            const ledgerEntry = await tx.ledgerentry.create({
                data: {
                    customerId: parseInt(customerId),
                    type,
                    amount: parsedAmount,
                    description,
                    purchaseId: purchaseId ? parseInt(purchaseId) : null,
                    bookingId: bookingId ? parseInt(bookingId) : null,
                    receivingId: receivingId || null,
                    entryDate: resolvedDate,
                },
            });

            // 2. Update customer balance
            const balanceAdjustment = type === 'DEBIT' ? parsedAmount : -parsedAmount;
            await tx.customer.update({
                where: { id: parseInt(customerId) },
                data: { balance: { increment: balanceAdjustment } },
            });

            // 3. If CREDIT (receiving) and not Cash/Bank account itself, sync double-entry to Cash Account or Bank Account
            if (type === 'CREDIT') {
                const cust = await tx.customer.findUnique({ where: { id: parseInt(customerId) } });
                if (cust && cust.name !== 'Cash Account' && !cust.name.startsWith('Bank Account')) {
                    const isBank = (paymentMethod === 'BANK') || (/bank/i.test(description || ''));
                    if (isBank && bankId) {
                        const { acc: bankAcc, bank } = await getOrCreateBankAccount(tx, parseInt(bankId));
                        await tx.ledgerentry.create({
                            data: {
                                customerId: bankAcc.id,
                                type: 'DEBIT',
                                amount: parsedAmount,
                                description: `Bank Received from ${cust.name} - ${description || 'Ledger Entry'}`,
                                bookingId: bookingId ? parseInt(bookingId) : null,
                                receivingId: receivingId || null,
                                entryDate: resolvedDate
                            }
                        });
                        await tx.customer.update({ where: { id: bankAcc.id }, data: { balance: { increment: parsedAmount } } });
                        await tx.bank.update({ where: { id: parseInt(bankId) }, data: { balance: { increment: parsedAmount } } });
                    } else {
                        const cashAcc = await getOrCreateCashAccount(tx);
                        await tx.ledgerentry.create({
                            data: {
                                customerId: cashAcc.id,
                                type: 'DEBIT',
                                amount: parsedAmount,
                                description: `Cash Received from ${cust.name} - ${description || 'Ledger Entry'}`,
                                bookingId: bookingId ? parseInt(bookingId) : null,
                                receivingId: receivingId || null,
                                entryDate: resolvedDate
                            }
                        });
                        await tx.customer.update({ where: { id: cashAcc.id }, data: { balance: { increment: parsedAmount } } });
                    }
                }
            }

            return ledgerEntry;
        }, { timeout: 25000, maxWait: 15000 });

        // Fetch the full entry with relations OUTSIDE the transaction
        const result = await prisma.ledgerentry.findUnique({
            where: { id: newEntryId },
            include: { customer: true, purchase: true, booking: true, receiving: true },
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

// DELETE - Delete a ledger entry (Disabled: ledger entries cannot be deleted)
export async function DELETE(req) {
    return NextResponse.json(
        { error: "Ledger entries cannot be deleted." },
        { status: 403 }
    );
}
