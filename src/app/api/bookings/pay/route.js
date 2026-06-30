import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { bookingId, paymentAmount, workflow } = body;

        if (!bookingId || paymentAmount === undefined || !workflow) {
            return NextResponse.json(
                { error: "bookingId, paymentAmount, and workflow are required" },
                { status: 400 }
            );
        }

        const bId = parseInt(bookingId);
        const payAmt = parseFloat(paymentAmount) || 0;

        const result = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bId },
                include: { customer: true, billingCustomer: true }
            });

            if (!booking) {
                throw new Error("Booking not found");
            }

            const currentRemaining = parseFloat(booking.remainingAmount || 0);
            const currentAdvance = parseFloat(booking.advanceAmount || 0);
            const totalAmount = parseFloat(booking.totalAmount || 0);

            const effectiveBillingId = booking.billingCustomerId || booking.customerId;
            const billingName = booking.billingCustomer?.name || booking.customer.name;

            let updatedRemaining = currentRemaining;
            let updatedAdvance = currentAdvance;
            let updatedBillStatus = booking.billStatus || "Partial Pending";

            let customerCreditAmt = 0;
            let cashDebitAmt = 0;

            if (workflow === "FULL_PAY") {
                // Marks bill immediately as "Clear Bill"
                customerCreditAmt = currentRemaining;
                cashDebitAmt = currentRemaining;
                
                updatedRemaining = 0;
                updatedAdvance = totalAmount;
                updatedBillStatus = "Clear Bill";
            } else if (workflow === "LESS_PAY") {
                // Allows manual clearance despite lower payment
                customerCreditAmt = currentRemaining; // Clear full remaining debt from customer balance
                cashDebitAmt = payAmt; // But record actual cash received
                
                updatedRemaining = 0;
                updatedAdvance = totalAmount;
                updatedBillStatus = "Clear Bill";
            } else if (workflow === "PARTIAL_PAY") {
                // Automatically flags status as "Partial Pending"
                customerCreditAmt = payAmt;
                cashDebitAmt = payAmt;

                updatedRemaining = Math.max(0, currentRemaining - payAmt);
                updatedAdvance = currentAdvance + payAmt;
                updatedBillStatus = "Partial Pending";
            } else {
                throw new Error("Invalid payment workflow");
            }

            // Update booking remaining amount, advance amount, and status
            const updatedBooking = await tx.booking.update({
                where: { id: bId },
                data: {
                    remainingAmount: updatedRemaining,
                    advanceAmount: updatedAdvance,
                    billStatus: updatedBillStatus
                }
            });

            // Create ledger entry for customer credit (reducing what they owe)
            if (customerCreditAmt > 0) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: effectiveBillingId,
                        type: 'CREDIT',
                        amount: customerCreditAmt,
                        description: `${workflow} - Payment received for Booking #${booking.bookingNumber || booking.id}`,
                        bookingId: bId
                    }
                });

                // Update customer balance (decrement because they paid)
                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: {
                        balance: { decrement: customerCreditAmt }
                    }
                });
            }

            // Create ledger entry for cash account debit (cash in)
            if (cashDebitAmt > 0) {
                const cashAccount = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
                if (cashAccount) {
                    await tx.ledgerentry.create({
                        data: {
                            customerId: cashAccount.id,
                            type: 'DEBIT',
                            amount: cashDebitAmt,
                            description: `Cash received from ${billingName} for Booking #${booking.bookingNumber || booking.id} (${workflow})`,
                            bookingId: bId
                        }
                    });

                    // Update cash account balance
                    await tx.customer.update({
                        where: { id: cashAccount.id },
                        data: {
                            balance: { increment: cashDebitAmt }
                        }
                    });
                }
            }

            return updatedBooking;
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("Failed to process payment:", err);
        return NextResponse.json(
            { error: err.message || "Failed to process payment" },
            { status: 500 }
        );
    }
}
