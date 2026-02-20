import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all ledger entries
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get("customerId");

        let ledgerEntries;

        if (customerId) {
            // Fetch ledger entries for a specific customer
            ledgerEntries = await prisma.ledgerentry.findMany({
                where: { customerId: parseInt(customerId) },
                include: {
                    customer: true,
                    purchase: true,
                },
                orderBy: [
                    { entryDate: "asc" },
                    { id: "asc" }
                ],
            });
        } else {
            // Fetch all ledger entries
            ledgerEntries = await prisma.ledgerentry.findMany({
                include: {
                    customer: true,
                    purchase: true,
                },
                orderBy: [
                    { entryDate: "asc" },
                    { id: "asc" }
                ],
            });
        }

        return NextResponse.json(ledgerEntries);
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
