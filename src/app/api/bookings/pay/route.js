import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();
        const {
            bookingId,
            bookingIds,
            bookingAllocations,
            paymentAmount = 0,
            discountAmount = 0,
            itemsDelivery,
            paymentMethod = 'CASH',
            bankId = null
        } = body;

        let targetBookingIds = [];
        if (Array.isArray(bookingAllocations) && bookingAllocations.length > 0) {
            targetBookingIds = bookingAllocations.map(a => parseInt(a.bookingId)).filter(Boolean);
        } else if (Array.isArray(bookingIds) && bookingIds.length > 0) {
            targetBookingIds = bookingIds.map(id => parseInt(id)).filter(Boolean);
        } else if (bookingId) {
            targetBookingIds = [parseInt(bookingId)];
        }

        if (targetBookingIds.length === 0) {
            return NextResponse.json(
                { error: "At least one bookingId is required" },
                { status: 400 }
            );
        }

        let totalPayAmt = parseFloat(paymentAmount) || 0;
        let totalDiscountAmt = parseFloat(discountAmount) || 0;
        const resolvedBankId = bankId ? parseInt(bankId) : null;
        const resolvedMethod = (paymentMethod || 'CASH').toUpperCase();

        const result = await prisma.$transaction(async (tx) => {
            const bookings = await tx.booking.findMany({
                where: { id: { in: targetBookingIds } },
                include: {
                    items: {
                        include: { selectedOptions: true }
                    },
                    customer: true,
                    billingCustomer: true
                }
            });

            if (!bookings || bookings.length === 0) {
                throw new Error("No matching bookings found");
            }

            // Preserve the caller's requested order
            const orderedBookings = targetBookingIds
                .map(id => bookings.find(b => b.id === id))
                .filter(Boolean);

            // Build allocation map: bookingId -> { paymentAmount, discountAmount, itemsDelivery }
            const allocationMap = new Map();

            if (Array.isArray(bookingAllocations) && bookingAllocations.length > 0) {
                let sumAllocPay = 0;
                let sumAllocDisc = 0;
                for (const alloc of bookingAllocations) {
                    const bId = parseInt(alloc.bookingId);
                    const p = Math.max(0, parseFloat(alloc.paymentAmount) || 0);
                    const d = Math.max(0, parseFloat(alloc.discountAmount) || 0);
                    sumAllocPay += p;
                    sumAllocDisc += d;
                    allocationMap.set(bId, {
                        paymentAmount: p,
                        discountAmount: d,
                        itemsDelivery: alloc.itemsDelivery || []
                    });
                }
                if (totalPayAmt === 0 && sumAllocPay > 0) totalPayAmt = sumAllocPay;
                if (totalDiscountAmt === 0 && sumAllocDisc > 0) totalDiscountAmt = sumAllocDisc;
            } else {
                let remDisc = totalDiscountAmt;
                let remPay = totalPayAmt;

                for (let i = 0; i < orderedBookings.length; i++) {
                    const b = orderedBookings[i];
                    const bRem = parseFloat(b.remainingAmount || 0);

                    const allocD = Math.min(bRem, remDisc);
                    remDisc -= allocD;

                    const remAfterD = Math.max(0, bRem - allocD);
                    const isLast = (i === orderedBookings.length - 1);
                    const allocP = isLast ? remPay : Math.min(remAfterD, remPay);
                    remPay -= allocP;

                    const bItemsDelivery = Array.isArray(itemsDelivery)
                        ? itemsDelivery.filter(del => b.items.some(it => it.id === parseInt(del.itemId)))
                        : [];

                    allocationMap.set(b.id, {
                        paymentAmount: Math.max(0, allocP),
                        discountAmount: Math.max(0, allocD),
                        itemsDelivery: bItemsDelivery
                    });
                }
            }

            const updatedBookings = [];

            // 1. Process delivery and financial updates for each target booking
            for (const booking of orderedBookings) {
                const bId = booking.id;
                const alloc = allocationMap.get(bId) || { paymentAmount: 0, discountAmount: 0, itemsDelivery: [] };
                const bPayAmt = alloc.paymentAmount;
                const bDiscountAmt = alloc.discountAmount;
                const bTotalDeduction = bPayAmt + bDiscountAmt;
                const bItemsDelivery = alloc.itemsDelivery || (Array.isArray(itemsDelivery)
                    ? itemsDelivery.filter(del => booking.items.some(it => it.id === parseInt(del.itemId)))
                    : []);

                // A. Process suit delivery quantities (INDEPENDENT of payment)
                if (Array.isArray(bItemsDelivery) && bItemsDelivery.length > 0) {
                    for (const delInfo of bItemsDelivery) {
                        const item = booking.items.find(i => i.id === parseInt(delInfo.itemId));
                        if (!item) continue;

                        const delNow = parseFloat(delInfo.deliverNowQty) || 0;
                        const totalQty = parseFloat(item.quantity) || 1;

                        if (item.itemStatus === "DELIVERED") continue;
                        if (delNow <= 0) continue;

                        if (delNow >= totalQty) {
                            await tx.booking_item.update({
                                where: { id: item.id },
                                data: { itemStatus: "DELIVERED" }
                            });
                        } else {
                            const remainingQty = totalQty - delNow;
                            const unitP = parseFloat(item.unitPrice) || 0;
                            const originalTotalPrice = parseFloat(item.totalPrice) || (totalQty * unitP);
                            const pricePerUnit = totalQty > 0 ? (originalTotalPrice / totalQty) : unitP;

                            const remTotalPrice = Math.round((remainingQty * pricePerUnit) * 100) / 100;
                            const delTotalPrice = Math.round((delNow * pricePerUnit) * 100) / 100;

                            await tx.booking_item.update({
                                where: { id: item.id },
                                data: {
                                    quantity: remainingQty,
                                    totalPrice: remTotalPrice
                                }
                            });

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

                // B. Financial calculations for this booking
                const currentTotal = parseFloat(booking.totalAmount || 0);
                const currentRemaining = parseFloat(booking.remainingAmount || 0);
                const currentAdvance = parseFloat(booking.advanceAmount || 0);

                const updatedTotal = Math.max(0, currentTotal - bDiscountAmt);
                const updatedRemaining = Math.max(0, currentRemaining - bTotalDeduction);
                const updatedAdvance = currentAdvance + bPayAmt;
                const updatedBillStatus = updatedRemaining <= 0 ? "Clear" : (updatedAdvance <= 0 ? "Pending" : "Partially Pending");

                // Check item delivery status for booking status
                const allBookingItems = await tx.booking_item.findMany({
                    where: { bookingId: bId },
                    select: { id: true, itemStatus: true }
                });
                const hasUndelivered = allBookingItems.some(i => i.itemStatus !== "DELIVERED");

                let newBookingStatus = booking.status;
                if (!hasUndelivered && allBookingItems.length > 0) {
                    newBookingStatus = updatedRemaining === 0 ? "PAID" : "TRANSFERRED_TO_LEDGER";
                } else if (allBookingItems.some(i => i.itemStatus === "DELIVERED")) {
                    newBookingStatus = "PARTIALLY_DELIVERED";
                }

                const updatedB = await tx.booking.update({
                    where: { id: bId },
                    data: {
                        totalAmount: updatedTotal,
                        remainingAmount: updatedRemaining,
                        advanceAmount: updatedAdvance,
                        billStatus: updatedBillStatus,
                        status: newBookingStatus
                    }
                });

                updatedBookings.push(updatedB);
            }

            // 2. Ledger and Receiving Entries for all paid bookings
            const primaryBooking = orderedBookings[0];
            const effectiveBillingId = primaryBooking.billingCustomerId || primaryBooking.customerId;
            const billingName = primaryBooking.billingCustomer?.name || primaryBooking.customer?.name || "Customer";
            const payEntryDate = new Date();
            const branchId = primaryBooking.branchId || session?.user?.branchId || 1;

            const actualTotalPay = Array.from(allocationMap.values()).reduce((sum, a) => sum + (a.paymentAmount || 0), 0);
            const actualTotalDiscount = Array.from(allocationMap.values()).reduce((sum, a) => sum + (a.discountAmount || 0), 0);

            if (actualTotalPay > 0) {
                for (const booking of orderedBookings) {
                    const alloc = allocationMap.get(booking.id);
                    const bPayAmt = alloc ? alloc.paymentAmount : 0;
                    if (bPayAmt <= 0) continue;

                    const descNotes = `Payment received for Booking #${booking.bookingNumber || booking.id}`;

                    const receiving = await tx.receiving.create({
                        data: {
                            receiptNo: `REC-${booking.bookingNumber || booking.id}-${Date.now().toString().slice(-4)}`,
                            customerId: effectiveBillingId,
                            bookingId: booking.id,
                            amount: bPayAmt,
                            paymentMode: resolvedMethod,
                            bankId: resolvedBankId,
                            source: 'Receiving',
                            branchId: booking.branchId || branchId || null,
                            receivingDate: payEntryDate,
                            description: descNotes
                        }
                    });

                    await tx.ledgerentry.create({
                        data: {
                            customerId: effectiveBillingId,
                            type: 'CREDIT',
                            amount: bPayAmt,
                            description: descNotes,
                            bookingId: booking.id,
                            receivingId: receiving.id,
                            branchId: booking.branchId || branchId || null,
                            entryDate: payEntryDate
                        }
                    });

                    if (resolvedMethod === 'BANK' && resolvedBankId) {
                        const { acc: bankAcc, bank } = await getOrCreateBankAccount(tx, resolvedBankId);
                        await tx.ledgerentry.create({
                            data: {
                                customerId: bankAcc.id,
                                type: 'DEBIT',
                                amount: bPayAmt,
                                description: `Bank Received via ${bank.name} from ${billingName} for Booking #${booking.bookingNumber || booking.id}`,
                                bookingId: booking.id,
                                receivingId: receiving.id,
                                branchId: booking.branchId || branchId || null,
                                entryDate: payEntryDate
                            }
                        });
                        await tx.customer.update({
                            where: { id: bankAcc.id },
                            data: { balance: { increment: bPayAmt } }
                        });
                        await tx.bank.update({
                            where: { id: resolvedBankId },
                            data: { balance: { increment: bPayAmt } }
                        });
                    } else {
                        const cashAcc = await getOrCreateCashAccount(tx);
                        await tx.ledgerentry.create({
                            data: {
                                customerId: cashAcc.id,
                                type: 'DEBIT',
                                amount: bPayAmt,
                                description: `Cash received from ${billingName} for Booking #${booking.bookingNumber || booking.id}`,
                                bookingId: booking.id,
                                receivingId: receiving.id,
                                branchId: booking.branchId || branchId || null,
                                entryDate: payEntryDate
                            }
                        });
                        await tx.customer.update({
                            where: { id: cashAcc.id },
                            data: { balance: { increment: bPayAmt } }
                        });
                    }
                }

                // Decrement customer balance by total paid
                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: { balance: { decrement: actualTotalPay } }
                });
            }

            // Adjust customer ledger balance for discount granted
            if (actualTotalDiscount > 0) {
                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: { balance: { decrement: actualTotalDiscount } }
                });
            }

            // 3. Excess payment allocation (if any payment remains after paying all selected bookings)
            const excessPayment = Math.max(0, totalPayAmt - actualTotalPay);
            if (excessPayment > 0) {
                const otherUnpaid = await tx.booking.findMany({
                    where: {
                        id: { notIn: targetBookingIds },
                        OR: [
                            { customerId: effectiveBillingId },
                            { billingCustomerId: effectiveBillingId }
                        ],
                        remainingAmount: { gt: 0 },
                        status: { notIn: ["CANCELLED"] }
                    },
                    orderBy: { bookingDate: "asc" }
                });

                let remExcess = excessPayment;
                for (const ob of otherUnpaid) {
                    if (remExcess <= 0) break;
                    const obRem = parseFloat(ob.remainingAmount || 0);
                    const obAdv = parseFloat(ob.advanceAmount || 0);
                    const alloc = Math.min(obRem, remExcess);
                    const newObRem = Math.max(0, obRem - alloc);
                    const newObAdv = obAdv + alloc;
                    const newObStatus = newObRem <= 0 ? "Clear" : "Partially Pending";

                    await tx.booking.update({
                        where: { id: ob.id },
                        data: {
                            remainingAmount: newObRem,
                            advanceAmount: newObAdv,
                            billStatus: newObStatus,
                            status: newObRem <= 0 && (ob.status === "DELIVERED" || ob.status === "PARTIALLY_DELIVERED") ? "PAID" : ob.status
                        }
                    });

                    const descNotes = `Excess payment allocated to Booking #${ob.bookingNumber || ob.id}`;
                    const rec = await tx.receiving.create({
                        data: {
                            receiptNo: `REC-${ob.bookingNumber || ob.id}-${Date.now().toString().slice(-4)}`,
                            customerId: effectiveBillingId,
                            bookingId: ob.id,
                            amount: alloc,
                            paymentMode: resolvedMethod,
                            bankId: resolvedBankId,
                            source: 'Receiving',
                            branchId: ob.branchId || branchId || null,
                            receivingDate: payEntryDate,
                            description: descNotes
                        }
                    });

                    await tx.ledgerentry.create({
                        data: {
                            customerId: effectiveBillingId,
                            type: 'CREDIT',
                            amount: alloc,
                            description: descNotes,
                            bookingId: ob.id,
                            receivingId: rec.id,
                            branchId: ob.branchId || branchId || null,
                            entryDate: payEntryDate
                        }
                    });

                    await tx.customer.update({
                        where: { id: effectiveBillingId },
                        data: { balance: { decrement: alloc } }
                    });

                    if (resolvedMethod === 'BANK' && resolvedBankId) {
                        const { acc: bankAcc, bank } = await getOrCreateBankAccount(tx, resolvedBankId);
                        await tx.ledgerentry.create({
                            data: {
                                customerId: bankAcc.id,
                                type: 'DEBIT',
                                amount: alloc,
                                description: `Bank Received via ${bank.name} from ${billingName} for Booking #${ob.bookingNumber || ob.id}`,
                                bookingId: ob.id,
                                receivingId: rec.id,
                                branchId: ob.branchId || branchId || null,
                                entryDate: payEntryDate
                            }
                        });
                        await tx.customer.update({
                            where: { id: bankAcc.id },
                            data: { balance: { increment: alloc } }
                        });
                        await tx.bank.update({
                            where: { id: resolvedBankId },
                            data: { balance: { increment: alloc } }
                        });
                    } else {
                        const cashAcc = await getOrCreateCashAccount(tx);
                        await tx.ledgerentry.create({
                            data: {
                                customerId: cashAcc.id,
                                type: 'DEBIT',
                                amount: alloc,
                                description: `Cash received from ${billingName} for Booking #${ob.bookingNumber || ob.id}`,
                                bookingId: ob.id,
                                receivingId: rec.id,
                                branchId: ob.branchId || branchId || null,
                                entryDate: payEntryDate
                            }
                        });
                        await tx.customer.update({
                            where: { id: cashAcc.id },
                            data: { balance: { increment: alloc } }
                        });
                    }

                    remExcess -= alloc;
                }
            }

            return updatedBookings.length === 1 ? updatedBookings[0] : { success: true, count: updatedBookings.length, bookings: updatedBookings };
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
