import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, fatherName, phone, email, address, notes, code, accountCategoryId, balance } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const customer = await prisma.$transaction(async (tx) => {
            const newCustomer = await tx.customer.create({
                data: {
                    name,
                    fatherName,
                    phone,
                    email,
                    address,
                    notes,
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

export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                accountCategory: true
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(customers);
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
