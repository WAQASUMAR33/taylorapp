import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { invoiceNumber, supplierId, supplier, purchaseDate, items, payments, totalAmount } = body;

        // Start a transaction to ensure everything happens atomically
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the purchase record
            const purchase = await tx.purchase.create({
                data: {
                    invoiceNumber,
                    supplier: supplier || "N/A",
                    supplierRel: supplierId ? {
                        connect: { id: parseInt(supplierId) }
                    } : undefined,
                    purchaseDate: new Date(purchaseDate),
                    totalAmount: parseFloat(totalAmount) || 0,
                    items: {
                        create: items.map(item => ({
                            productId: parseInt(item.productId),
                            quantity: parseInt(item.quantity) || 1,
                            unitCost: parseFloat(item.unitCost) || 0,
                            totalCost: parseFloat(item.totalCost) || 0
                        }))
                    },
                    payments: {
                        create: payments.filter(p => parseFloat(p.amount) > 0).map(p => ({
                            amount: parseFloat(p.amount) || 0,
                            method: p.method,
                            bankId: p.bankId ? parseInt(p.bankId) : null,
                            paymentDate: new Date(purchaseDate)
                        }))
                    }
                },
                include: {
                    items: { include: { product: true } },
                    payments: { include: { bank: true } }
                }
            });

            // 2. Update stock and movements
            for (const item of items) {
                await tx.product.update({
                    where: { id: parseInt(item.productId) },
                    data: {
                        quantity: { increment: parseInt(item.quantity) },
                        costPrice: parseFloat(item.unitCost)
                    }
                });

                await tx.stockmovement.create({
                    data: {
                        productId: parseInt(item.productId),
                        type: 'IN',
                        quantity: parseInt(item.quantity),
                        unitCost: parseFloat(item.unitCost),
                        notes: `Purchase Invoice: ${invoiceNumber}`
                    }
                });
            }

            // 3. LEDGER GENERATION
            if (supplierId) {
                const sId = parseInt(supplierId);

                // A. Record the full purchase liability (Credit Supplier)
                await tx.ledgerentry.create({
                    data: {
                        customerId: sId,
                        type: 'CREDIT',
                        amount: parseFloat(totalAmount),
                        description: `Purchase Invoice: ${invoiceNumber} (Total Amount)`,
                        purchaseId: purchase.id,
                        entryDate: new Date(purchaseDate)
                    }
                });

                // Update supplier balance - Credit decreases balance
                await tx.customer.update({
                    where: { id: sId },
                    data: {
                        balance: { decrement: parseFloat(totalAmount) }
                    }
                });

                // B. Record each payment (Debit Supplier - reducing liability)
                for (const payment of payments) {
                    const payAmt = parseFloat(payment.amount);
                    if (payAmt > 0) {
                        await tx.ledgerentry.create({
                            data: {
                                customerId: sId,
                                type: 'DEBIT',
                                amount: payAmt,
                                description: `Payment for Inv #${invoiceNumber} via ${payment.method}`,
                                purchaseId: purchase.id,
                                entryDate: new Date(purchaseDate)
                            }
                        });

                        // Update supplier balance - Debit increases balance
                        await tx.customer.update({
                            where: { id: sId },
                            data: {
                                balance: { increment: payAmt }
                            }
                        });

                        // C. Update Bank Balance if method is BANK
                        if (payment.method === "BANK" && payment.bankId) {
                            await tx.bank.update({
                                where: { id: parseInt(payment.bankId) },
                                data: {
                                    balance: { decrement: payAmt }
                                }
                            });
                        }

                        // SYNC TO CASH ACCOUNT if method is CASH
                        if (payment.method === "CASH") {
                            const cashAccount = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
                            if (cashAccount) {
                                await tx.ledgerentry.create({
                                    data: {
                                        customerId: cashAccount.id,
                                        type: 'CREDIT', // Cash out
                                        amount: payAmt,
                                        description: `Payment for Purchase Inv #${invoiceNumber} (Supplier: ${supplier})`,
                                    }
                                });
                                await tx.customer.update({
                                    where: { id: cashAccount.id },
                                    data: { balance: { decrement: payAmt } }
                                });
                            }
                        }
                    }
                }
            }

            return purchase;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Failed to create purchase:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const purchases = await prisma.purchase.findMany({
            include: {
                items: { include: { product: true } },
                payments: { include: { bank: true } },
                supplierRel: true
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(purchases);
    } catch (error) {
        console.error("Failed to fetch purchases:", error);
        return NextResponse.json(
            { error: "Failed to fetch purchases" },
            { status: 500 }
        );
    }
}
