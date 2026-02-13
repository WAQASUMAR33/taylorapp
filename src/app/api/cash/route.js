import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper to get or create Cash Account
async function getCashAccount() {
    let cashAccount = await prisma.customer.findFirst({
        where: { name: 'Cash Account' }
    });

    if (!cashAccount) {
        cashAccount = await prisma.customer.create({
            data: {
                name: 'Cash Account',
                code: 'CASH-001',
                notes: 'System account for tracking cash transactions'
            }
        });
    }
    return cashAccount;
}

// GET - Fetch all cash ledger entries
export async function GET(req) {
    try {
        const cashAccount = await getCashAccount();

        const ledgerEntries = await prisma.ledgerentry.findMany({
            where: { customerId: cashAccount.id },
            include: {
                customer: true,
                purchase: true,
                booking: true,
            },
            orderBy: { entryDate: "desc" },
        });

        // Serialize Decimal fields
        const serializedEntries = ledgerEntries.map(entry => ({
            ...entry,
            amount: entry.amount.toString(),
            customer: entry.customer ? {
                ...entry.customer,
                balance: entry.customer.balance.toString()
            } : null,
            purchase: entry.purchase ? {
                ...entry.purchase,
                totalAmount: entry.purchase.totalAmount.toString()
            } : null
        }));

        return NextResponse.json(serializedEntries);
    } catch (error) {
        console.error("Failed to fetch cash entries:", error);
        return NextResponse.json(
            { error: "Failed to fetch cash entries" },
            { status: 500 }
        );
    }
}

// POST - Create a new cash entry
export async function POST(req) {
    try {
        const body = await req.json();
        const { type, amount, description, bookingId } = body;

        if (!type || !amount) {
            return NextResponse.json(
                { error: "Type and amount are required" },
                { status: 400 }
            );
        }

        const cashAccount = await getCashAccount();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the ledger entry for Cash Account
            const ledgerEntry = await tx.ledgerentry.create({
                data: {
                    customerId: cashAccount.id,
                    type,
                    amount: parseFloat(amount),
                    description: description || "Cash Transaction",
                    bookingId: bookingId ? parseInt(bookingId) : null,
                },
                include: {
                    customer: true,
                },
            });

            // 2. Update Cash Account Balance
            const balanceAdjustment = type === 'DEBIT' ? parseFloat(amount) : -parseFloat(amount);
            await tx.customer.update({
                where: { id: cashAccount.id },
                data: {
                    balance: { increment: balanceAdjustment }
                }
            });

            return ledgerEntry;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Failed to create cash entry:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
