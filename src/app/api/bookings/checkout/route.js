import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { bookingId, itemsToDeliver, discount = 0, cashReceived = 0 } = body;

        if (!bookingId || !itemsToDeliver) {
            return NextResponse.json(
                { error: "bookingId and itemsToDeliver are required" },
                { status: 400 }
            );
        }

        const bId = parseInt(bookingId);
        const discAmt = parseFloat(discount) || 0;
        const cashAmt = parseFloat(cashReceived) || 0;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch booking with items
            const booking = await tx.booking.findUnique({
                where: { id: bId },
                include: {
                    items: {
                        include: {
                            selectedOptions: true
                        }
                    },
                    customer: true,
                    billingCustomer: true
                }
            });

            if (!booking) {
                throw new Error("Booking not found");
            }

            const effectiveBillingId = booking.billingCustomerId || booking.customerId;
            const billingName = booking.billingCustomer?.name || booking.customer.name;

            // 2. Process items
            let itemsLeftBehind = false;

            for (const deliverInfo of itemsToDeliver) {
                const item = booking.items.find(i => i.id === parseInt(deliverInfo.itemId));
                if (!item) continue;

                const qtyToDeliver = parseFloat(deliverInfo.quantityToDeliver) || 0;
                const qtyRemaining = parseFloat(item.quantity);

                if (qtyToDeliver === 0) {
                    if (qtyRemaining > 0) {
                        itemsLeftBehind = true;
                    }
                    continue;
                }

                if (qtyToDeliver < qtyRemaining) {
                    itemsLeftBehind = true;

                    // Split item:
                    // A. Update original item's quantity to qtyRemaining - qtyToDeliver
                    const newQtyOriginal = qtyRemaining - qtyToDeliver;
                    const pricePerUnit = parseFloat(item.unitPrice);
                    
                    // Proportionate discount and totalPrice
                    const originalTotalBeforeDisc = qtyRemaining * pricePerUnit;
                    const itemDiscountTotal = parseFloat(item.discount || 0);
                    const originalDiscountRatio = originalTotalBeforeDisc > 0 ? (itemDiscountTotal / originalTotalBeforeDisc) : 0;
                    
                    const newOriginalDiscount = Math.round((newQtyOriginal * pricePerUnit * originalDiscountRatio) * 100) / 100;
                    const newOriginalPrice = Math.max(0, (newQtyOriginal * pricePerUnit) - newOriginalDiscount);

                    await tx.booking_item.update({
                        where: { id: item.id },
                        data: {
                            quantity: newQtyOriginal,
                            discount: newOriginalDiscount,
                            totalPrice: newOriginalPrice
                        }
                    });

                    // B. Create a new booking_item that is fully DELIVERED
                    const deliveredDiscount = itemDiscountTotal - newOriginalDiscount;
                    const deliveredPrice = Math.max(0, (qtyToDeliver * pricePerUnit) - deliveredDiscount);

                    const newDeliveredItem = await tx.booking_item.create({
                        data: {
                            bookingId: bId,
                            productId: item.productId,
                            quantity: qtyToDeliver,
                            unitPrice: item.unitPrice,
                            totalPrice: deliveredPrice,
                            costPrice: item.costPrice,
                            cuttingCost: item.cuttingCost,
                            discount: deliveredDiscount,
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

                    // C. Copy selected options
                    if (item.selectedOptions && item.selectedOptions.length > 0) {
                        await tx.booking_item_stitching_option.createMany({
                            data: item.selectedOptions.map(opt => ({
                                bookingItemId: newDeliveredItem.id,
                                stitchingOptionId: opt.stitchingOptionId,
                                price: opt.price
                            }))
                        });
                    }
                } else {
                    // qtyToDeliver === qtyRemaining: Mark item as DELIVERED
                    await tx.booking_item.update({
                        where: { id: item.id },
                        data: {
                            itemStatus: "DELIVERED"
                        }
                    });
                }
            }

            // Also check if there are other undelivered items in the booking that weren't in itemsToDeliver
            const remainingUndeliveredItems = await tx.booking_item.findMany({
                where: {
                    bookingId: bId,
                    NOT: { itemStatus: "DELIVERED" }
                }
            });

            if (remainingUndeliveredItems.length > 0) {
                itemsLeftBehind = true;
            }

            // 3. Calculate new financial state of the booking
            const currentTotal = parseFloat(booking.totalAmount || 0);
            const currentAdvance = parseFloat(booking.advanceAmount || 0);
            const currentRemaining = parseFloat(booking.remainingAmount || 0);

            // Additional discount directly reduces the booking's total amount
            const newTotalAmount = Math.max(0, currentTotal - discAmt);
            const newAdvanceAmount = currentAdvance + cashAmt;
            const newRemainingAmount = Math.max(0, currentRemaining - cashAmt - discAmt);

            // Determine status
            let newStatus = booking.status;
            let newBillStatus = booking.billStatus;

            if (itemsLeftBehind) {
                newStatus = "PARTIALLY_DELIVERED";
                newBillStatus = newRemainingAmount <= 0 ? "Clear Bill" : "Partial Pending";
            } else {
                // All items delivered
                if (newRemainingAmount === 0) {
                    newStatus = "PAID";
                    newBillStatus = "Clear Bill";
                } else {
                    newStatus = "TRANSFERRED_TO_LEDGER";
                    newBillStatus = "Transferred To Ledger";
                }
            }

            // 4. Update the Booking record
            const updatedBooking = await tx.booking.update({
                where: { id: bId },
                data: {
                    totalAmount: newTotalAmount,
                    advanceAmount: newAdvanceAmount,
                    remainingAmount: newRemainingAmount,
                    status: newStatus,
                    billStatus: newBillStatus
                }
            });

            // 5. Update Ledger Bookkeeping
            const totalCreditAmt = cashAmt + discAmt;

            // A. Credit Billing Customer's Ledger
            if (totalCreditAmt > 0) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: effectiveBillingId,
                        type: 'CREDIT',
                        amount: totalCreditAmt,
                        description: `Checkout Payment - Booking #${booking.bookingNumber || booking.id} (Cash: Rs. ${cashAmt}, Discount: Rs. ${discAmt})`,
                        bookingId: bId
                    }
                });

                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: {
                        balance: { decrement: totalCreditAmt }
                    }
                });
            }

            // B. Debit Cash Account (for cash received)
            if (cashAmt > 0) {
                const cashAccount = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
                if (cashAccount) {
                    await tx.ledgerentry.create({
                        data: {
                            customerId: cashAccount.id,
                            type: 'DEBIT',
                            amount: cashAmt,
                            description: `Cash received at Checkout from ${billingName} (Booking #${booking.bookingNumber || booking.id})`,
                            bookingId: bId
                        }
                    });

                    await tx.customer.update({
                        where: { id: cashAccount.id },
                        data: {
                            balance: { increment: cashAmt }
                        }
                    });
                }
            }

            return updatedBooking;
        }, {
            maxWait: 5000,
            timeout: 20000
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error("Checkout process failed:", err);
        return NextResponse.json(
            { error: err.message || "Checkout process failed" },
            { status: 500 }
        );
    }
}
