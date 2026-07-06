import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Retrieve all sale returns
export async function GET(req) {
    try {
        const returns = await prisma.sale_return.findMany({
            include: {
                customer: { select: { id: true, name: true, phone: true, address: true } },
                bank: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } }
                    }
                }
            },
            orderBy: { returnDate: "desc" }
        });
        return NextResponse.json(returns);
    } catch (error) {
        console.error("Failed to fetch sale returns:", error);
        return NextResponse.json({ error: "Failed to fetch sale returns: " + error.message }, { status: 500 });
    }
}

// POST - Create a new sale return
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { customerId, returnDate, totalAmount, paymentMode, bankId, notes, items } = body;

        if (!customerId || !totalAmount || !items || items.length === 0) {
            return NextResponse.json({ error: "Customer, total amount, and items are required" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Generate sequential return number RET-YYYYMM-NNNN
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const mm = String(month + 1).padStart(2, "0");
            const prefix = `RET-${year}${mm}-`;

            const lastReturn = await tx.sale_return.findFirst({
                where: { returnNumber: { startsWith: prefix } },
                orderBy: { returnNumber: "desc" },
                select: { returnNumber: true }
            });

            let nextSeq = 1;
            if (lastReturn) {
                const parts = lastReturn.returnNumber.split("-");
                const lastSeq = parseInt(parts[parts.length - 1], 10);
                nextSeq = lastSeq + 1;
            }
            const seq = String(nextSeq).padStart(4, "0");
            const returnNumber = `${prefix}${seq}`;

            // 1. Create the sale return
            const saleReturn = await tx.sale_return.create({
                data: {
                    returnNumber,
                    customerId: parseInt(customerId),
                    returnDate: returnDate ? new Date(returnDate) : new Date(),
                    totalAmount: parseFloat(totalAmount),
                    paymentMode,
                    bankId: bankId ? parseInt(bankId) : null,
                    notes: notes || null,
                    items: {
                        create: items.map(item => ({
                            productId: parseInt(item.productId),
                            quantity: parseFloat(item.quantity),
                            unitPrice: parseFloat(item.unitPrice),
                            totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice)
                        }))
                    }
                },
                include: {
                    customer: true,
                    bank: true
                }
            });

            // 2. Adjust stock levels and log stock movements
            for (const item of items) {
                const pid = parseInt(item.productId);
                const qty = parseFloat(item.quantity);

                await tx.product.update({
                    where: { id: pid },
                    data: { quantity: { increment: qty } }
                });

                await tx.stockmovement.create({
                    data: {
                        productId: pid,
                        type: "IN",
                        quantity: qty,
                        notes: `Sale Return: ${returnNumber}`
                    }
                });
            }

            // 3. Financial Bookkeeping
            const returnAmt = parseFloat(totalAmount);

            // Customer Credit Entry (representing return of goods value)
            await tx.ledgerentry.create({
                data: {
                    customerId: parseInt(customerId),
                    type: "CREDIT",
                    amount: returnAmt,
                    description: `Product Sale Return: ${returnNumber}`,
                    saleReturnId: saleReturn.id
                }
            });
            await tx.customer.update({
                where: { id: parseInt(customerId) },
                data: { balance: { decrement: returnAmt } }
            });

            if (paymentMode === "CASH") {
                // Offset representing cash payout refund
                await tx.ledgerentry.create({
                    data: {
                        customerId: parseInt(customerId),
                        type: "DEBIT",
                        amount: returnAmt,
                        description: `Refund cash paid for Return: ${returnNumber}`,
                        saleReturnId: saleReturn.id
                    }
                });
                await tx.customer.update({
                    where: { id: parseInt(customerId) },
                    data: { balance: { increment: returnAmt } }
                });

                // Cash Account Outflow
                const cashAccount = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
                if (cashAccount) {
                    await tx.ledgerentry.create({
                        data: {
                            customerId: cashAccount.id,
                            type: 'CREDIT',
                            amount: returnAmt,
                            description: `Refund cash paid to ${saleReturn.customer.name} (Return #${returnNumber})`,
                            saleReturnId: saleReturn.id
                        }
                    });
                    await tx.customer.update({
                        where: { id: cashAccount.id },
                        data: { balance: { decrement: returnAmt } }
                    });
                }
            } else if (paymentMode === "BANK" && bankId) {
                // Offset representing bank payout refund
                await tx.ledgerentry.create({
                    data: {
                        customerId: parseInt(customerId),
                        type: "DEBIT",
                        amount: returnAmt,
                        description: `Refund bank payout for Return: ${returnNumber}`,
                        saleReturnId: saleReturn.id
                    }
                });
                await tx.customer.update({
                    where: { id: parseInt(customerId) },
                    data: { balance: { increment: returnAmt } }
                });

                // Bank Account Outflow
                const bank = await tx.bank.findUnique({ where: { id: parseInt(bankId) } });
                if (bank) {
                    const accountName = `Bank Account - ${bank.name}`;
                    let bankAcc = await tx.customer.findFirst({ where: { name: accountName } });
                    if (!bankAcc) {
                        bankAcc = await tx.customer.create({
                            data: { name: accountName, code: `BANK-${bank.id}`, notes: `System receiving account for ${bank.name}` }
                        });
                    }

                    await tx.ledgerentry.create({
                        data: {
                            customerId: bankAcc.id,
                            type: 'CREDIT',
                            amount: returnAmt,
                            description: `Refund bank paid to ${saleReturn.customer.name} (Return #${returnNumber})`,
                            saleReturnId: saleReturn.id
                        }
                    });
                    await tx.customer.update({
                        where: { id: bankAcc.id },
                        data: { balance: { decrement: returnAmt } }
                    });
                    await tx.bank.update({
                        where: { id: parseInt(bankId) },
                        data: { balance: { decrement: returnAmt } }
                    });
                }
            }

            return saleReturn;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Failed to create sale return:", error);
        return NextResponse.json({ error: "Failed to create sale return: " + error.message }, { status: 500 });
    }
}
