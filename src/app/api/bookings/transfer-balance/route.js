import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();
        const {
            bookingId,
            bookingIds,
            targetCustomerId,
            transferAmount = 0,
            note = "",
            itemsDelivery = []
        } = body;

        let targetBookingIds = [];
        if (Array.isArray(bookingIds) && bookingIds.length > 0) {
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

        if (!targetCustomerId) {
            return NextResponse.json(
                { error: "Target customer/account is required for balance transfer" },
                { status: 400 }
            );
        }

        const tCustId = parseInt(targetCustomerId);
        const totalTransferAmt = parseFloat(transferAmount) || 0;

        if (totalTransferAmt <= 0) {
            return NextResponse.json(
                { error: "Transfer amount must be greater than zero" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const targetCustomer = await tx.customer.findUnique({
                where: { id: tCustId }
            });

            if (!targetCustomer) {
                throw new Error("Target customer not found");
            }

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

            const primaryBooking = bookings[0];
            const sourceCustomerId = primaryBooking.billingCustomerId || primaryBooking.customerId;
            const sourceCustomer = primaryBooking.billingCustomer || primaryBooking.customer;

            if (sourceCustomerId === targetCustomer.id) {
                throw new Error("Target account cannot be the same as the source customer account");
            }

            const entryDate = new Date();
            const branchId = primaryBooking.branchId || session?.user?.branchId || 1;
            const customNote = note ? ` - ${note.trim()}` : "";

            // 1. Process suit delivery quantities (if any specified)
            if (Array.isArray(itemsDelivery) && itemsDelivery.length > 0) {
                for (const delInfo of itemsDelivery) {
                    const itemId = parseInt(delInfo.itemId);
                    const delNow = parseFloat(delInfo.deliverNowQty) || 0;
                    if (delNow <= 0) continue;

                    // Find item in any of the target bookings
                    let foundBooking = null;
                    let foundItem = null;
                    for (const b of bookings) {
                        const item = b.items.find(i => i.id === itemId);
                        if (item) {
                            foundBooking = b;
                            foundItem = item;
                            break;
                        }
                    }

                    if (!foundItem || foundItem.itemStatus === "DELIVERED") continue;
                    const totalQty = parseFloat(foundItem.quantity) || 1;

                    if (delNow >= totalQty) {
                        await tx.booking_item.update({
                            where: { id: foundItem.id },
                            data: { itemStatus: "DELIVERED" }
                        });
                    } else {
                        const remainingQty = totalQty - delNow;
                        const unitP = parseFloat(foundItem.unitPrice) || 0;
                        const originalTotalPrice = parseFloat(foundItem.totalPrice) || (totalQty * unitP);
                        const pricePerUnit = totalQty > 0 ? (originalTotalPrice / totalQty) : unitP;

                        const remTotalPrice = Math.round((remainingQty * pricePerUnit) * 100) / 100;
                        const delTotalPrice = Math.round((delNow * pricePerUnit) * 100) / 100;

                        await tx.booking_item.update({
                            where: { id: foundItem.id },
                            data: {
                                quantity: remainingQty,
                                totalPrice: remTotalPrice
                            }
                        });

                        const newDeliveredItem = await tx.booking_item.create({
                            data: {
                                bookingId: foundBooking.id,
                                productId: foundItem.productId,
                                quantity: delNow,
                                unitPrice: foundItem.unitPrice,
                                totalPrice: delTotalPrice,
                                costPrice: foundItem.costPrice,
                                cuttingCost: foundItem.cuttingCost,
                                discount: foundItem.discount,
                                materialCost: foundItem.materialCost,
                                stitchingCost: foundItem.stitchingCost,
                                stitchingType: foundItem.stitchingType,
                                cuffType: foundItem.cuffType,
                                pohnchaType: foundItem.pohnchaType,
                                gheraType: foundItem.gheraType,
                                galaType: foundItem.galaType,
                                galaSize: foundItem.galaSize,
                                pocketType: foundItem.pocketType,
                                shalwarType: foundItem.shalwarType,
                                hasShalwarPocket: foundItem.hasShalwarPocket,
                                hasFrontPockets: foundItem.hasFrontPockets,
                                itemStatus: "DELIVERED",
                                itemNote: foundItem.itemNote,
                                qameez_lambai: foundItem.qameez_lambai,
                                bazoo: foundItem.bazoo,
                                teera: foundItem.teera,
                                galaa: foundItem.galaa,
                                chaati: foundItem.chaati,
                                gheera: foundItem.gheera,
                                kaf: foundItem.kaf,
                                gehra_gird: foundItem.gehra_gird,
                                shalwar_lambai: foundItem.shalwar_lambai,
                                puhncha: foundItem.puhncha,
                                shalwar_gheera: foundItem.shalwar_gheera,
                                chaati_around: foundItem.chaati_around,
                                kamar_around: foundItem.kamar_around,
                                hip_around: foundItem.hip_around,
                                kandha: foundItem.kandha,
                                wskot_lambai: foundItem.wskot_lambai,
                                wskot_teera: foundItem.wskot_teera,
                                wskot_gala: foundItem.wskot_gala,
                                wskot_chaati: foundItem.wskot_chaati,
                                wskot_kamar: foundItem.wskot_kamar,
                                wskot_hip: foundItem.wskot_hip,
                                front_pocket: foundItem.front_pocket,
                                side_pocket: foundItem.side_pocket,
                                shalwar_pocket: foundItem.shalwar_pocket
                            }
                        });

                        if (foundItem.selectedOptions && foundItem.selectedOptions.length > 0) {
                            await tx.booking_item_stitching_option.createMany({
                                data: foundItem.selectedOptions.map(opt => ({
                                    bookingItemId: newDeliveredItem.id,
                                    stitchingOptionId: opt.stitchingOptionId,
                                    price: opt.price
                                }))
                            });
                        }
                    }
                }
            }

            // 2. Distribute transfer amount across target bookings and update them
            let remTransfer = totalTransferAmt;
            const updatedBookings = [];
            const bookingNumbers = [];

            for (let i = 0; i < bookings.length; i++) {
                const b = bookings[i];
                const bRem = parseFloat(b.remainingAmount || 0);
                const bAdv = parseFloat(b.advanceAmount || 0);

                const isLast = (i === bookings.length - 1);
                const allocTransfer = isLast ? remTransfer : Math.min(bRem, remTransfer);
                remTransfer -= allocTransfer;

                const newRem = Math.max(0, bRem - allocTransfer);
                const newAdv = bAdv + allocTransfer;
                const newBillStatus = newRem <= 0 ? "Clear" : "Partially Pending";

                // Check item status
                const allItems = await tx.booking_item.findMany({
                    where: { bookingId: b.id },
                    select: { id: true, itemStatus: true }
                });
                const hasUndelivered = allItems.some(item => item.itemStatus !== "DELIVERED");

                let newStatus = b.status;
                if (!hasUndelivered && allItems.length > 0) {
                    newStatus = newRem === 0 ? "TRANSFERRED_TO_LEDGER" : "PARTIALLY_DELIVERED";
                } else {
                    newStatus = newRem === 0 ? "TRANSFERRED_TO_LEDGER" : b.status;
                }

                const updatedB = await tx.booking.update({
                    where: { id: b.id },
                    data: {
                        remainingAmount: newRem,
                        advanceAmount: newAdv,
                        billStatus: newBillStatus,
                        status: newStatus,
                        billingCustomerId: targetCustomer.id
                    }
                });

                updatedBookings.push(updatedB);
                bookingNumbers.push(`#${b.bookingNumber || b.id}`);

                // Individual ledger entries per booking if multiple bookings
                if (allocTransfer > 0) {
                    const sourceDesc = `Booking #${b.bookingNumber || b.id} remaining balance transferred to ${targetCustomer.name}${targetCustomer.code ? ` (${targetCustomer.code})` : ''}${customNote}`;
                    await tx.ledgerentry.create({
                        data: {
                            customerId: sourceCustomerId,
                            type: 'CREDIT',
                            amount: allocTransfer,
                            description: sourceDesc,
                            bookingId: b.id,
                            branchId: b.branchId || branchId || null,
                            entryDate: entryDate
                        }
                    });

                    const targetDesc = `Booking #${b.bookingNumber || b.id} balance transferred from ${sourceCustomer?.name || 'Customer'}${sourceCustomer?.code ? ` (${sourceCustomer.code})` : ''}${customNote}`;
                    await tx.ledgerentry.create({
                        data: {
                            customerId: targetCustomer.id,
                            type: 'DEBIT',
                            amount: allocTransfer,
                            description: targetDesc,
                            bookingId: b.id,
                            branchId: b.branchId || branchId || null,
                            entryDate: entryDate
                        }
                    });
                }
            }

            // 3. Update Customer Account Balances
            // Source customer balance decreases (debt cleared)
            await tx.customer.update({
                where: { id: sourceCustomerId },
                data: {
                    balance: { decrement: totalTransferAmt }
                }
            });

            // Target customer balance increases (debt transferred to them)
            await tx.customer.update({
                where: { id: targetCustomer.id },
                data: {
                    balance: { increment: totalTransferAmt }
                }
            });

            return {
                success: true,
                updatedBookings,
                transferredAmount: totalTransferAmt,
                sourceCustomerName: sourceCustomer?.name || "Source Customer",
                targetCustomerName: targetCustomer.name
            };
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error transferring booking balance:", error);
        return NextResponse.json(
            { error: error.message || "Failed to transfer booking balance" },
            { status: 500 }
        );
    }
}

