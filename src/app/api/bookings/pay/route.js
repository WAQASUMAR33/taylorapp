import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ── Account helpers ───────────────────────────────────────────────────────────
async function getOrCreateCashAccount(tx) {
    let acc = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
    if (!acc) {
        acc = await tx.customer.create({
            data: { name: 'Cash Account', code: 'CASH-001', notes: 'System account for cash transactions' }
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
        acc = await tx.customer.create({
            data: { name: accountName, code: `BANK-${bankId}`, notes: `System receiving account for ${bank.name}` }
        });
    }
    return { acc, bank };
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { bookingId, paymentAmount = 0, discountAmount = 0, itemsDelivery, paymentMethod = 'CASH', bankId = null } = body;

        if (!bookingId) {
            return NextResponse.json(
                { error: "bookingId is required" },
                { status: 400 }
            );
        }

        const bId = parseInt(bookingId);
        const payAmt = parseFloat(paymentAmount) || 0;
        const discountAmt = parseFloat(discountAmount) || 0;
        const totalDeduction = payAmt + discountAmt;
        const resolvedBankId = bankId ? parseInt(bankId) : null;
        const resolvedMethod = (paymentMethod || 'CASH').toUpperCase();

        const result = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bId },
                include: {
                    items: {
                        include: { selectedOptions: true }
                    },
                    customer: true,
                    billingCustomer: true
                }
            });

            if (!booking) {
                throw new Error("Booking not found");
            }

            // 1. Process suit delivery quantities (100% INDEPENDENT of payment amounts)
            if (Array.isArray(itemsDelivery) && itemsDelivery.length > 0) {
                for (const delInfo of itemsDelivery) {
                    const item = booking.items.find(i => i.id === parseInt(delInfo.itemId));
                    if (!item) continue;

                    const delNow = parseFloat(delInfo.deliverNowQty) || 0;
                    const totalQty = parseFloat(item.quantity) || 1;

                    if (item.itemStatus === "DELIVERED") continue;
                    if (delNow <= 0) continue;

                    if (delNow >= totalQty) {
                        // Mark entire item as DELIVERED
                        await tx.booking_item.update({
                            where: { id: item.id },
                            data: { itemStatus: "DELIVERED" }
                        });
                    } else {
                        // Split item: remaining portion (PENDING) and delivered portion (DELIVERED)
                        const remainingQty = totalQty - delNow;
                        const unitP = parseFloat(item.unitPrice) || 0;
                        const originalTotalPrice = parseFloat(item.totalPrice) || (totalQty * unitP);
                        const pricePerUnit = totalQty > 0 ? (originalTotalPrice / totalQty) : unitP;

                        const remTotalPrice = Math.round((remainingQty * pricePerUnit) * 100) / 100;
                        const delTotalPrice = Math.round((delNow * pricePerUnit) * 100) / 100;

                        // Keep original item for remaining undelivered portion in stitching
                        await tx.booking_item.update({
                            where: { id: item.id },
                            data: {
                                quantity: remainingQty,
                                totalPrice: remTotalPrice
                            }
                        });

                        // Create a new booking_item for the delivered portion
                        const newDeliveredItem = await tx.booking_item.create({
                            data: {
                                bookingId: bId,
                                productId: item.productId,
                                quantity: delNow,
                                unitPrice: item.unitPrice,
                                totalPrice: delTotalPrice,
                                costPrice: item.costPrice,
                                cuttingCost: item.cuttingCost,
                                discount: item.discount,
                                materialCost: item.materialCost,
                                stitchingCost: item.stitchingCost,
                                stitchingType: item.stitchingType,
                                cuffType: item.cuffType,
                                pohnchaType: item.pohnchaType,
                                gheraType: item.gheraType,
                                galaType: item.galaType,
                                galaSize: item.galaSize,
                                pocketType: item.pocketType,
                                shalwarType: item.shalwarType,
                                hasShalwarPocket: item.hasShalwarPocket,
                                hasFrontPockets: item.hasFrontPockets,
                                itemStatus: "DELIVERED",
                                itemNote: item.itemNote,
                                qameez_lambai: item.qameez_lambai,
                                bazoo: item.bazoo,
                                teera: item.teera,
                                galaa: item.galaa,
                                chaati: item.chaati,
                                gheera: item.gheera,
                                kaf: item.kaf,
                                gehra_gird: item.gehra_gird,
                                shalwar_lambai: item.shalwar_lambai,
                                puhncha: item.puhncha,
                                shalwar_gheera: item.shalwar_gheera,
                                chaati_around: item.chaati_around,
                                kamar_around: item.kamar_around,
                                hip_around: item.hip_around,
                                kandha: item.kandha,
                                wskot_lambai: item.wskot_lambai,
                                wskot_teera: item.wskot_teera,
                                wskot_gala: item.wskot_gala,
                                wskot_chaati: item.wskot_chaati,
                                wskot_kamar: item.wskot_kamar,
                                wskot_hip: item.wskot_hip,
                                front_pocket: item.front_pocket,
                                side_pocket: item.side_pocket,
                                shalwar_pocket: item.shalwar_pocket
                            }
                        });

                        if (item.selectedOptions && item.selectedOptions.length > 0) {
                            await tx.booking_item_stitching_option.createMany({
                                data: item.selectedOptions.map(opt => ({
                                    bookingItemId: newDeliveredItem.id,
                                    stitchingOptionId: opt.stitchingOptionId,
                                    price: opt.price
                                }))
                            });
                        }
                    }
                }
            }

            // 2. Financial Update (Payment & Discount - Independent of suit quantity)
            const currentTotal = parseFloat(booking.totalAmount || 0);
            const currentRemaining = parseFloat(booking.remainingAmount || 0);
            const currentAdvance = parseFloat(booking.advanceAmount || 0);

            const effectiveBillingId = booking.billingCustomerId || booking.customerId;
            const billingName = booking.billingCustomer?.name || booking.customer?.name || "Customer";

            const updatedTotal = Math.max(0, currentTotal - discountAmt);
            const updatedRemaining = Math.max(0, currentRemaining - totalDeduction);
            const updatedAdvance = currentAdvance + payAmt;
            const updatedBillStatus = updatedRemaining <= 0 ? "Clear" : (updatedAdvance <= 0 ? "Pending" : "Partially Pending");

            // Check if all suits in the booking are delivered
            const allBookingItems = await tx.booking_item.findMany({
                where: { bookingId: bId },
                select: { id: true, itemStatus: true }
            });
            const hasUndelivered = allBookingItems.some(i => i.itemStatus !== "DELIVERED");

            let newBookingStatus = booking.status;
            if (!hasUndelivered && allBookingItems.length > 0) {
                // All items delivered -> CLOSED / PAID or TRANSFERRED_TO_LEDGER
                newBookingStatus = updatedRemaining === 0 ? "PAID" : "TRANSFERRED_TO_LEDGER";
            } else if (allBookingItems.some(i => i.itemStatus === "DELIVERED")) {
                newBookingStatus = "PARTIALLY_DELIVERED";
            }

            // Update booking record
            const updatedBooking = await tx.booking.update({
                where: { id: bId },
                data: {
                    totalAmount: updatedTotal,
                    remainingAmount: updatedRemaining,
                    advanceAmount: updatedAdvance,
                    billStatus: updatedBillStatus,
                    status: newBookingStatus
                }
            });

            const payEntryDate = new Date();

            // 3. Ledger Entries for Payment (Receiving Transaction)
            if (payAmt > 0) {
                const descNotes = `Payment received for Booking #${booking.bookingNumber || booking.id}`;

                // Record in dedicated receiving model
                const receiving = await tx.receiving.create({
                    data: {
                        receiptNo: `REC-${booking.bookingNumber || booking.id}-${Date.now().toString().slice(-4)}`,
                        customerId: effectiveBillingId,
                        bookingId: bId,
                        amount: payAmt,
                        paymentMode: resolvedMethod,
                        bankId: resolvedBankId,
                        receivingDate: payEntryDate,
                        description: descNotes
                    }
                });

                await tx.ledgerentry.create({
                    data: {
                        customerId: effectiveBillingId,
                        type: 'CREDIT',
                        amount: payAmt,
                        description: descNotes,
                        bookingId: bId,
                        receivingId: receiving.id,
                        entryDate: payEntryDate
                    }
                });

                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: {
                        balance: { decrement: payAmt }
                    }
                });

                // Sync receiving to Cash or Bank Account
                if (resolvedMethod === 'BANK' && resolvedBankId) {
                    const { acc: bankAcc, bank } = await getOrCreateBankAccount(tx, resolvedBankId);
                    await tx.ledgerentry.create({
                        data: {
                            customerId: bankAcc.id,
                            type: 'DEBIT',
                            amount: payAmt,
                            description: `Bank Received via ${bank.name} from ${billingName} for Booking #${booking.bookingNumber || booking.id}`,
                            bookingId: bId,
                            receivingId: receiving.id,
                            entryDate: payEntryDate
                        }
                    });
                    await tx.customer.update({
                        where: { id: bankAcc.id },
                        data: { balance: { increment: payAmt } }
                    });
                    await tx.bank.update({
                        where: { id: resolvedBankId },
                        data: { balance: { increment: payAmt } }
                    });
                } else {
                    const cashAcc = await getOrCreateCashAccount(tx);
                    await tx.ledgerentry.create({
                        data: {
                            customerId: cashAcc.id,
                            type: 'DEBIT',
                            amount: payAmt,
                            description: `Cash received from ${billingName} for Booking #${booking.bookingNumber || booking.id}`,
                            bookingId: bId,
                            receivingId: receiving.id,
                            entryDate: payEntryDate
                        }
                    });
                    await tx.customer.update({
                        where: { id: cashAcc.id },
                        data: {
                            balance: { increment: payAmt }
                        }
                    });
                }
            }

            // Adjust customer ledger balance for discount granted
            if (discountAmt > 0) {
                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: {
                        balance: { decrement: discountAmt }
                    }
                });
            }

            return updatedBooking;
        }, {
            maxWait: 10000,
            timeout: 30000
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

