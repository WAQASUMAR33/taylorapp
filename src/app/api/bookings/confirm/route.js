import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getNextCustomerId } from "@/lib/customerHelper";

// ── Account helpers ───────────────────────────────────────────────────────────
async function getOrCreateCashAccount(tx) {
    let acc = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
    if (!acc) {
        const nextId = await getNextCustomerId(tx);
        acc = await tx.customer.create({
            data: { id: nextId, name: 'Cash Account', code: 'CASH-001', notes: 'System account for cash transactions' }
        });
    }
    return acc;
}

async function getOrCreateBankAccount(tx, bankId) {
    const bank = await tx.bank.findUnique({ where: { id: bankId } });
    if (!bank) throw new Error(`Bank with ID ${bankId} not found`);
    const accountName = `Bank Account - ${bank.name}`;
    let acc = await tx.customer.findFirst({ where: { name: accountName } });
    if (!acc) {
        const nextId = await getNextCustomerId(tx);
        acc = await tx.customer.create({
            data: { id: nextId, name: accountName, code: `BANK-${bankId}`, notes: `System receiving account for ${bank.name}` }
        });
    }
    return { acc, bank };
}

// Sync advance payment to the appropriate ledger account(s).
async function syncPaymentToAccounts(tx, { paymentMethod, bankId, advAmt, cashAmt, bankAmt, description, bookingId, entryDate, receivingId, branchId }) {
    if (advAmt <= 0) return;
    const resolvedDate = entryDate ? new Date(entryDate) : new Date();

    if (paymentMethod === 'CASH' || paymentMethod === 'BOTH' || !paymentMethod) {
        const amount = paymentMethod === 'BOTH' ? cashAmt : advAmt;
        if (amount > 0) {
            const cashAcc = await getOrCreateCashAccount(tx);
            await tx.ledgerentry.create({
                data: {
                    customerId: cashAcc.id,
                    type: 'DEBIT',
                    amount,
                    description: `Cash Received - ${description}`,
                    bookingId: bookingId || null,
                    receivingId: receivingId || null,
                    branchId: branchId || null,
                    entryDate: resolvedDate
                }
            });
            await tx.customer.update({ where: { id: cashAcc.id }, data: { balance: { increment: amount } } });
        }
    }

    if ((paymentMethod === 'BANK' || paymentMethod === 'BOTH') && bankId) {
        const amount = paymentMethod === 'BOTH' ? bankAmt : advAmt;
        if (amount > 0) {
            const { acc: bankAcc, bank } = await getOrCreateBankAccount(tx, bankId);
            await tx.ledgerentry.create({
                data: {
                    customerId: bankAcc.id,
                    type: 'DEBIT',
                    amount,
                    description: `Bank Received via ${bank.name} - ${description}`,
                    bookingId: bookingId || null,
                    receivingId: receivingId || null,
                    branchId: branchId || null,
                    entryDate: resolvedDate
                }
            });
            await tx.customer.update({ where: { id: bankAcc.id }, data: { balance: { increment: amount } } });
            await tx.bank.update({ where: { id: bankId }, data: { balance: { increment: amount } } });
        }
    }
}

// POST - Cashier confirms booking, receives advance amount, and records ledger entries
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();
        const {
            bookingId,
            advanceAmount,
            paymentMethod = "CASH",
            bankId = null,
            cashAmount = 0,
            bankAmount = 0,
            notes = ""
        } = body;

        if (!bookingId) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            );
        }

        const bId = parseInt(bookingId);
        const parsedAdvance = Math.max(0, parseFloat(advanceAmount || 0));
        const resolvedCashAmt = parseFloat(cashAmount || 0);
        const resolvedBankAmt = parseFloat(bankAmount || 0);
        const resolvedBankId = bankId ? parseInt(bankId) : null;
        const resolvedPaymentMethod = paymentMethod || "CASH";

        const result = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bId },
                include: {
                    customer: true,
                    billingCustomer: true,
                    branch: true,
                    items: true
                }
            });

            if (!booking) {
                throw new Error("Booking not found");
            }

            if (booking.isConfirmed) {
                throw new Error(`Booking #${booking.bookingNumber} has already been confirmed by cashier.`);
            }

            const totalAmount = parseFloat(booking.totalAmount || 0);
            const remainingAmount = Math.max(0, totalAmount - parsedAdvance);
            const billStatus = remainingAmount <= 0
                ? "Clear"
                : (parsedAdvance <= 0 ? "Pending" : "Partially Pending");

            const now = new Date();
            const branchId = booking.branchId || (session?.user?.branchId ? parseInt(session.user.branchId) : 1);
            const cashierUserId = session?.user?.id ? parseInt(session.user.id) : null;
            const cashierName = session?.user?.name || session?.user?.fullName || "Cashier";

            const effectiveBillingId = booking.billingCustomerId || booking.customerId;
            const billingCustomer = booking.billingCustomer || booking.customer;
            const billingName = billingCustomer?.name || "Customer";

            const customNote = notes ? ` - ${notes.trim()}` : "";

            // 1. Update Booking to Confirmed
            let updatedNotes = booking.notes || "";
            if (notes && notes.trim()) {
                updatedNotes = updatedNotes 
                    ? `${updatedNotes}\n[Cashier ${cashierName}]: ${notes.trim()}`
                    : `[Cashier ${cashierName}]: ${notes.trim()}`;
            }

            const updatedBooking = await tx.booking.update({
                where: { id: booking.id },
                data: {
                    advanceAmount: parsedAdvance,
                    remainingAmount: remainingAmount,
                    billStatus: billStatus,
                    isConfirmed: true,
                    confirmedAt: now,
                    confirmedById: cashierUserId,
                    notes: updatedNotes
                }
            });

            // 2. Post Financial Double-Entry Ledger Entries
            if (totalAmount > 0) {
                // A. Debit Customer Ledger for total order
                await tx.ledgerentry.create({
                    data: {
                        customerId: effectiveBillingId,
                        type: 'DEBIT',
                        amount: totalAmount,
                        description: `Booking Order: #${booking.bookingNumber} - ${booking.bookingType}${customNote}`,
                        bookingId: booking.id,
                        branchId: branchId || null,
                        entryDate: now
                    }
                });

                // B. Credit Customer Ledger for Advance Payment (if any received by cashier)
                if (parsedAdvance > 0) {
                    const receiving = await tx.receiving.create({
                        data: {
                            receiptNo: `REC-${booking.bookingNumber}-ADV`,
                            customerId: effectiveBillingId,
                            bookingId: booking.id,
                            amount: parsedAdvance,
                            paymentMode: resolvedPaymentMethod,
                            bankId: resolvedBankId,
                            source: 'Advance',
                            branchId: branchId || null,
                            receivingDate: now,
                            description: `Advance Payment for Booking: #${booking.bookingNumber}${customNote}`
                        }
                    });

                    await tx.ledgerentry.create({
                        data: {
                            customerId: effectiveBillingId,
                            type: 'CREDIT',
                            amount: parsedAdvance,
                            description: `Advance Payment for Booking: #${booking.bookingNumber}${customNote}`,
                            bookingId: booking.id,
                            receivingId: receiving.id,
                            branchId: branchId || null,
                            entryDate: now
                        }
                    });

                    // Sync to Cash / Bank accounts
                    await syncPaymentToAccounts(tx, {
                        paymentMethod: resolvedPaymentMethod,
                        bankId: resolvedBankId,
                        advAmt: parsedAdvance,
                        cashAmt: resolvedCashAmt,
                        bankAmt: resolvedBankAmt,
                        description: `Advance from ${billingName} (Booking #${booking.bookingNumber})`,
                        bookingId: booking.id,
                        receivingId: receiving.id,
                        branchId: branchId || null,
                        entryDate: now
                    });
                }

                // C. Update Customer Balance
                const netAdjustment = totalAmount - parsedAdvance;
                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: {
                        balance: { increment: netAdjustment }
                    }
                });
            }

            return {
                booking: updatedBooking,
                bookingNumber: booking.bookingNumber,
                totalAmount,
                advanceAmount: parsedAdvance,
                remainingAmount,
                billingCustomerName: billingName
            };
        }, {
            maxWait: 5000,
            timeout: 20000
        });

        return NextResponse.json({
            success: true,
            message: `Booking #${result.bookingNumber} confirmed successfully!`,
            ...result
        });
    } catch (error) {
        console.error("Cashier booking confirmation failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to confirm booking" },
            { status: 500 }
        );
    }
}

