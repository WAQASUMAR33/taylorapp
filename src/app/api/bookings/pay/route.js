import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { bookingId, paymentAmount, discountAmount, itemQuantities } = body;

        if (!bookingId || paymentAmount === undefined) {
            return NextResponse.json(
                { error: "bookingId and paymentAmount are required" },
                { status: 400 }
            );
        }

        const bId = parseInt(bookingId);
        const payAmt = parseFloat(paymentAmount) || 0;
        const discountAmt = parseFloat(discountAmount) || 0;
        const totalDeduction = payAmt + discountAmt;

        const result = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bId },
                include: { items: true, customer: true, billingCustomer: true }
            });

            if (!booking) {
                throw new Error("Booking not found");
            }

            // 1. Update item quantities and prices if itemQuantities provided
            if (Array.isArray(itemQuantities) && itemQuantities.length > 0) {
                for (const qItem of itemQuantities) {
                    const item = booking.items.find(i => i.id === parseInt(qItem.itemId));
                    if (!item) continue;
                    const newQty = parseFloat(qItem.quantity) || 0;
                    if (newQty < 0) continue;
                    const unitPrice = parseFloat(item.unitPrice || 0);
                    const itemDiscount = parseFloat(item.discount || 0);
                    const newTotalPrice = Math.max(0, (newQty * unitPrice) - itemDiscount);

                    await tx.booking_item.update({
                        where: { id: item.id },
                        data: {
                            quantity: newQty,
                            totalPrice: newTotalPrice
                        }
                    });
                }
            }

            // 2. Fetch updated items to calculate new total amount
            const updatedItems = await tx.booking_item.findMany({
                where: { bookingId: bId }
            });
            const newTotalAmount = updatedItems.reduce((sum, i) => sum + parseFloat(i.totalPrice || 0), 0);

            const currentAdvance = parseFloat(booking.advanceAmount || 0);
            const effectiveBillingId = booking.billingCustomerId || booking.customerId;
            const billingName = booking.billingCustomer?.name || booking.customer?.name || "Customer";

            const updatedAdvance = currentAdvance + payAmt;
            const updatedRemaining = Math.max(0, newTotalAmount - (updatedAdvance + discountAmt));
            const updatedBillStatus = updatedRemaining === 0 ? "Clear Bill" : "Partial Pending";

            // Update booking total amount, remaining amount, advance amount, and bill status
            const updatedBooking = await tx.booking.update({
                where: { id: bId },
                data: {
                    totalAmount: newTotalAmount,
                    remainingAmount: updatedRemaining,
                    advanceAmount: updatedAdvance,
                    billStatus: updatedBillStatus
                }
            });

            // Create ledger entry for customer credit (reducing what they owe)
            if (payAmt > 0) {
                const descNotes = discountAmt > 0 
                    ? `Payment received: Rs. ${payAmt.toLocaleString()} (Discount: Rs. ${discountAmt.toLocaleString()}) for Booking #${booking.bookingNumber || booking.id}`
                    : `Payment received for Booking #${booking.bookingNumber || booking.id}`;

                await tx.ledgerentry.create({
                    data: {
                        customerId: effectiveBillingId,
                        type: 'CREDIT',
                        amount: payAmt,
                        description: descNotes,
                        bookingId: bId
                    }
                });

                // Update customer balance (decrement because they paid)
                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: {
                        balance: { decrement: payAmt }
                    }
                });
            }

            // Create ledger entry for cash account debit (cash in)
            if (payAmt > 0) {
                const cashAccount = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
                if (cashAccount) {
                    await tx.ledgerentry.create({
                        data: {
                            customerId: cashAccount.id,
                            type: 'DEBIT',
                            amount: payAmt,
                            description: `Cash received from ${billingName} for Booking #${booking.bookingNumber || booking.id}`,
                            bookingId: bId
                        }
                    });

                    // Update cash account balance
                    await tx.customer.update({
                        where: { id: cashAccount.id },
                        data: {
                            balance: { increment: payAmt }
                        }
                    });
                }
            }

            return updatedBooking;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error processing booking payment:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process payment" },
            { status: 500 }
        );
    }
}

