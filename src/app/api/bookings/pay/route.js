import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { bookingId, paymentAmount = 0, discountAmount = 0, itemsDelivery } = body;

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

                        // Keep original item for remaining undelivered portion in stitching
                        await tx.booking_item.update({
                            where: { id: item.id },
                            data: { quantity: remainingQty }
                        });

                        // Create a new booking_item for the delivered portion
                        const newDeliveredItem = await tx.booking_item.create({
                            data: {
                                bookingId: bId,
                                productId: item.productId,
                                quantity: delNow,
                                unitPrice: item.unitPrice,
                                totalPrice: item.totalPrice,
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
            const currentRemaining = parseFloat(booking.remainingAmount || 0);
            const currentAdvance = parseFloat(booking.advanceAmount || 0);

            const effectiveBillingId = booking.billingCustomerId || booking.customerId;
            const billingName = booking.billingCustomer?.name || booking.customer?.name || "Customer";

            const updatedRemaining = Math.max(0, currentRemaining - totalDeduction);
            const updatedAdvance = currentAdvance + payAmt;
            const updatedBillStatus = updatedRemaining === 0 ? "Clear Bill" : "Partial Pending";

            // Check if all suits in the booking are delivered
            const allBookingItems = await tx.booking_item.findMany({
                where: { bookingId: bId }
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
                    remainingAmount: updatedRemaining,
                    advanceAmount: updatedAdvance,
                    billStatus: updatedBillStatus,
                    status: newBookingStatus
                }
            });

            // 3. Ledger Entries for Payment
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

                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: {
                        balance: { decrement: payAmt }
                    }
                });
            }

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

