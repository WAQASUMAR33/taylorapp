import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { customerId, items, billDiscountAmt, cashPaid, notes } = body;

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

            // Decrement stock for each sold item
            for (const item of items) {
                const pid = parseInt(item.productId);
                const qty = parseInt(item.quantity);
                if (!pid || !qty) continue;
                await tx.product.update({
                    where: { id: pid },
                    data: { quantity: { decrement: qty } },
                });
                await tx.stockmovement.create({
                    data: {
                        productId: pid,
                        type: "OUT",
                        quantity: qty,
                        notes: `Sale: ${billNumber}`,
                    },
                });
            }

            // If customer selected: handle partial payment
            if (customerId) {
                const cashPaidAmt = Math.min(Math.max(parseFloat(cashPaid) || 0, 0), total);
                const balanceAdded = total - cashPaidAmt;

                // Only add remaining unpaid amount to ledger/balance
                if (balanceAdded > 0) {
                    await tx.ledgerentry.create({
                        data: {
                            customerId: parseInt(customerId),
                            type: "CREDIT",
                            amount: balanceAdded,
                            description: cashPaidAmt > 0
                                ? `Sale - ${billNumber} (partial: Rs.${cashPaidAmt.toFixed(0)} paid, Rs.${balanceAdded.toFixed(0)} on account)`
                                : `Sale - ${billNumber}`,
                            entryDate: new Date(),
                        },
                    });

                    await tx.customer.update({
                        where: { id: parseInt(customerId) },
                        data: { balance: { decrement: balanceAdded } },
                    });
                }
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
