import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { customerId, items, billDiscountAmt, notes } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
        }

        const bill = await prisma.$transaction(async (tx) => {
            // Calculate subtotal (each item: qty * unitPrice * (1 - itemDiscount/100))
            const subtotal = items.reduce((sum, item) => {
                const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice) * (1 - (parseFloat(item.discount) || 0) / 100);
                return sum + itemTotal;
            }, 0);

            const discountAmount = Math.min(parseFloat(billDiscountAmt) || 0, subtotal);
            const total = subtotal - discountAmount;

            const billNumber = `BILL-${Date.now()}`;

            const newBill = await tx.bill.create({
                data: {
                    billNumber,
                    customerId: customerId ? parseInt(customerId) : null,
                    status: "ISSUED",
                    subtotal,
                    discount: discountAmount,
                    tax: 0,
                    total,
                    notes: notes || null,
                    items: {
                        create: items.map((item) => ({
                            productId: parseInt(item.productId),
                            quantity: parseInt(item.quantity),
                            unitPrice: parseFloat(item.unitPrice),
                            discount: parseFloat(item.discount) || 0,
                            total: parseFloat(item.quantity) * parseFloat(item.unitPrice) * (1 - (parseFloat(item.discount) || 0) / 100),
                        })),
                    },
                },
                include: { items: { include: { product: true } }, customer: true },
            });

            // If customer selected: create ledger entry and update balance
            if (customerId) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: parseInt(customerId),
                        type: "CREDIT",
                        amount: total,
                        description: `Sale - ${billNumber}`,
                        entryDate: new Date(),
                    },
                });

                await tx.customer.update({
                    where: { id: parseInt(customerId) },
                    data: { balance: { decrement: total } },
                });
            }

            return newBill;
        });

        return NextResponse.json(bill, { status: 201 });
    } catch (error) {
        console.error("Failed to create sale:", error);
        return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const bills = await prisma.bill.findMany({
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                items: { include: { product: { select: { id: true, name: true, sku: true } } } },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(JSON.parse(JSON.stringify(bills)));
    } catch (error) {
        console.error("Failed to fetch bills:", error);
        return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
    }
}
