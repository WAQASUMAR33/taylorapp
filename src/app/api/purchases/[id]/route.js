import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const purchaseId = parseInt(id);

        if (!purchaseId) {
            return NextResponse.json(
                { error: "Purchase ID is required" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch the purchase with all related data needed for reversal
            const purchase = await tx.purchase.findUnique({
                where: { id: purchaseId },
                include: {
                    items: true,
                    payments: true,
                }
            });

            if (!purchase) {
                throw new Error("Purchase not found");
            }

            // 2. Revert Product Stock and create stock movements
            for (const item of purchase.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: { decrement: item.quantity }
                    }
                });

                await tx.stockmovement.create({
                    data: {
                        productId: item.productId,
                        type: 'OUT',
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        notes: `Purchase Deletion Reversal: ${purchase.invoiceNumber}`
                    }
                });
            }

            // 3. Revert Supplier Balance (if supplierId exists)
            if (purchase.supplierId) {
                // Total amount reversal (Debit supplier to decrease credit)
                await tx.customer.update({
                    where: { id: purchase.supplierId },
                    data: {
                        balance: { increment: purchase.totalAmount }
                    }
                });

                // Payments reversal (Credit supplier to decrease debit)
                const totalPaid = purchase.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                if (totalPaid > 0) {
                    await tx.customer.update({
                        where: { id: purchase.supplierId },
                        data: {
                            balance: { decrement: totalPaid }
                        }
                    });
                }
            }

            // 4. Revert Bank Balances
            for (const payment of purchase.payments) {
                if (payment.method === "BANK" && payment.bankId) {
                    await tx.bank.update({
                        where: { id: payment.bankId },
                        data: {
                            balance: { increment: payment.amount }
                        }
                    });
                }
            }

            // 5. Delete associated records (Prisma doesn't have Cascade for these relations in this schema)
            // Delete Ledger Entries
            await tx.ledgerentry.deleteMany({
                where: { purchaseId: purchaseId }
            });

            // Delete Purchase Payments
            await tx.purchase_payment.deleteMany({
                where: { purchaseId: purchaseId }
            });

            // Delete Purchase Items
            await tx.purchase_item.deleteMany({
                where: { purchaseId: purchaseId }
            });

            // 6. Delete the purchase itself
            await tx.purchase.delete({
                where: { id: purchaseId }
            });

            return { message: "Purchase and associated records reverted successfully" };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to delete purchase:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete purchase" },
            { status: 500 }
        );
    }
}
