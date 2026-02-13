import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Customer ID is required" },
                { status: 400 }
            );
        }

        // Check for related records that prevent deletion
        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: {
                        bookings: true,
                        measurements: true,
                        ledgerEntries: true,
                        orders: true,
                        bill: true,
                        purchases: true,
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const counts = customer._count;
        const dependencies = [];
        if (counts.bookings > 0) dependencies.push(`${counts.bookings} booking(s)`);
        if (counts.measurements > 0) dependencies.push(`${counts.measurements} measurement(s)`);
        if (counts.ledgerEntries > 0) dependencies.push(`${counts.ledgerEntries} ledger entry(entries)`);
        if (counts.orders > 0) dependencies.push(`${counts.orders} order(s)`);
        if (counts.bill > 0) dependencies.push(`${counts.bill} bill(s)`);
        if (counts.purchases > 0) dependencies.push(`${counts.purchases} purchase(s)`);

        if (dependencies.length > 0) {
            return NextResponse.json(
                { error: `Cannot delete customer who has existing: ${dependencies.join(", ")}` },
                { status: 400 }
            );
        }

        await prisma.customer.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Failed to delete customer:", error);
        return NextResponse.json(
            { error: "Failed to delete customer" },
            { status: 500 }
        );
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, fatherName, phone, email, address, notes, code, accountCategoryId, balance } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const updatedCustomer = await prisma.$transaction(async (tx) => {
            const existingCustomer = await tx.customer.findUnique({
                where: { id: parseInt(id) }
            });

            if (!existingCustomer) {
                throw new Error("Customer not found");
            }

            const newBalance = balance ? parseFloat(balance) : 0;
            const currentBalance = parseFloat(existingCustomer.balance);
            const adjustment = newBalance - currentBalance;

            if (adjustment !== 0) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: parseInt(id),
                        type: adjustment > 0 ? "DEBIT" : "CREDIT",
                        amount: Math.abs(adjustment),
                        description: "Balance Adjustment",
                        entryDate: new Date(),
                    }
                });
            }

            return await tx.customer.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    fatherName,
                    phone,
                    email,
                    address,
                    notes,
                    code,
                    balance: newBalance,
                    accountCategoryId: accountCategoryId ? parseInt(accountCategoryId) : null,
                },
                include: {
                    accountCategory: true
                }
            });
        });

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error("Failed to update customer:", error);
        return NextResponse.json(
            { error: "Failed to update customer" },
            { status: 500 }
        );
    }
}
