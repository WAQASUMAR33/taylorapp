import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all bookings or a specific booking
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const customerId = searchParams.get("customerId");

        if (id) {
            const booking = await prisma.booking.findUnique({
                where: { id: parseInt(id) },
                include: {
                    customer: {
                        select: { id: true, name: true, phone: true, email: true }
                    },
                    tailor: {
                        select: { id: true, name: true, role: true }
                    },
                    cutter: {
                        select: { id: true, name: true, role: true }
                    },
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true }
                            }
                        }
                    }
                }
            });
            return NextResponse.json(booking);
        }

        if (customerId) {
            const bookings = await prisma.booking.findMany({
                where: { customerId: parseInt(customerId) },
                include: {
                    customer: {
                        select: { id: true, name: true, phone: true, email: true }
                    },
                    tailor: {
                        select: { id: true, name: true, role: true }
                    },
                    cutter: {
                        select: { id: true, name: true, role: true }
                    },
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true }
                            }
                        }
                    }
                },
                orderBy: { bookingDate: "desc" }
            });
            return NextResponse.json(bookings);
        }

        const bookings = await prisma.booking.findMany({
            include: {
                customer: {
                    select: { id: true, name: true, phone: true, email: true }
                },
                tailor: {
                    select: { id: true, name: true, role: true }
                },
                cutter: {
                    select: { id: true, name: true, role: true }
                },
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, sku: true }
                        }
                    }
                }
            },
            orderBy: { bookingDate: "desc" }
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Failed to fetch bookings:", error);
        return NextResponse.json(
            { error: "Failed to fetch bookings" },
            { status: 500 }
        );
    }
}

// POST - Create a new booking
export async function POST(req) {
    try {
        const body = await req.json();
        const {
            customerId,
            bookingType,
            bookingDate,
            returnDate,
            deliveryDate,
            trialDate,
            tailorId,
            cutterId,
            totalAmount,
            advanceAmount,
            remainingAmount,
            notes,
            items,
            // Stitching Details
            cuffType,
            pohnchaType,
            gheraType,
            galaType,
            galaSize,
            pocketType,
            shalwarType,
            hasShalwarPocket,
            hasFrontPockets
        } = body;

        if (!customerId || !bookingType || !totalAmount || !items || items.length === 0) {
            return NextResponse.json(
                { error: "Customer, booking type, total amount, and at least one item are required" },
                { status: 400 }
            );
        }

        // Generate booking number
        const bookingNumber = `BK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Fetch products to get current cost prices
        const productIds = items.map(item => parseInt(item.productId));
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                costPrice: true,
                materialCost: true,
                cuttingCost: true,
                stitchingCost: true
            }
        });

        const productsMap = new Map();
        products.forEach(p => productsMap.set(p.id, p));

        // Use transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the booking
            const booking = await tx.booking.create({
                data: {
                    bookingNumber,
                    customerId: parseInt(customerId),
                    bookingType,
                    bookingDate: bookingDate ? new Date(bookingDate) : new Date(),
                    returnDate: returnDate ? new Date(returnDate) : null,
                    deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                    trialDate: trialDate ? new Date(trialDate) : null,
                    tailorId: tailorId ? parseInt(tailorId) : null,
                    cutterId: cutterId ? parseInt(cutterId) : null,
                    totalAmount: parseFloat(totalAmount),
                    advanceAmount: parseFloat(advanceAmount || 0),
                    remainingAmount: parseFloat(remainingAmount || totalAmount),
                    notes,
                    status: "PENDING",
                    items: {
                        create: items.map(item => {
                            const product = productsMap.get(parseInt(item.productId));
                            return {
                                productId: parseInt(item.productId),
                                quantity: parseInt(item.quantity),
                                unitPrice: parseFloat(item.unitPrice),
                                totalPrice: parseFloat(item.totalPrice),
                                discount: parseFloat(item.discount || 0),
                                costPrice: product?.costPrice ? parseFloat(product.costPrice) * parseInt(item.quantity) : null,
                                materialCost: product?.materialCost ? parseFloat(product.materialCost) * parseInt(item.quantity) : null,
                                cuttingCost: product?.cuttingCost ? parseFloat(product.cuttingCost) * parseInt(item.quantity) : null,
                                stitchingCost: product?.stitchingCost ? parseFloat(product.stitchingCost) * parseInt(item.quantity) : null,
                                // Stitching Details
                                cuffType: item.cuffType,
                                pohnchaType: item.pohnchaType,
                                gheraType: item.gheraType,
                                galaType: item.galaType,
                                galaSize: item.galaSize,
                                pocketType: item.pocketType,
                                shalwarType: item.shalwarType,
                                hasShalwarPocket: item.hasShalwarPocket || false,
                                hasFrontPockets: item.hasFrontPockets || false,
                            };
                        })
                    }
                },
                include: {
                    customer: {
                        select: { id: true, name: true, phone: true, email: true }
                    },
                    tailor: {
                        select: { id: true, name: true, role: true }
                    },
                    cutter: {
                        select: { id: true, name: true, role: true }
                    },
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true }
                            }
                        }
                    }
                }
            });

            // 2. Decrement stock and create movement record for each item
            for (const item of items) {
                const productId = parseInt(item.productId);
                const quantity = parseInt(item.quantity);

                // Update product stock
                await tx.product.update({
                    where: { id: productId },
                    data: {
                        quantity: { decrement: quantity }
                    }
                });

                // Create stock movement record
                await tx.stockmovement.create({
                    data: {
                        productId,
                        type: 'OUT',
                        quantity: quantity,
                        unitCost: null, // We might not have the cost price handy here, or could fetch it if needed
                        notes: `Booking Order: ${bookingNumber}`
                        // userId: userId // Omitting for now as we don't have session user easily accessible in this API route structure without changes
                    }
                });
            }

            // 3. Create ledger entries for this booking
            if (parseFloat(totalAmount) > 0) {
                // A. Debit for full booking amount
                await tx.ledgerentry.create({
                    data: {
                        customerId: parseInt(customerId),
                        type: 'DEBIT',
                        amount: parseFloat(totalAmount),
                        description: `Booking Order: ${bookingNumber} - ${bookingType}`,
                    }
                });

                // B. Credit for advance payment if any
                const advAmt = parseFloat(advanceAmount || 0);
                if (advAmt > 0) {
                    await tx.ledgerentry.create({
                        data: {
                            customerId: parseInt(customerId),
                            type: 'CREDIT',
                            amount: advAmt,
                            description: `Advance Payment for Booking: ${bookingNumber}`,
                        }
                    });

                    // SYNC TO CASH ACCOUNT
                    const cashAccount = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
                    if (cashAccount) {
                        await tx.ledgerentry.create({
                            data: {
                                customerId: cashAccount.id,
                                type: 'DEBIT', // Cash in
                                amount: advAmt,
                                description: `Advance from ${booking.customer.name} (Booking #${bookingNumber})`,
                            }
                        });
                        await tx.customer.update({
                            where: { id: cashAccount.id },
                            data: { balance: { increment: advAmt } }
                        });
                    }
                }

                // 4. Update Customer Balance
                // Balance increases with DEBIT (totalAmount) and decreases with CREDIT (advanceAmount)
                const balanceAdjustment = parseFloat(totalAmount) - advAmt;
                await tx.customer.update({
                    where: { id: parseInt(customerId) },
                    data: {
                        balance: { increment: balanceAdjustment }
                    }
                });
            }

            return booking;
        }, {
            maxWait: 5000,
            timeout: 20000
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Failed to create booking:", error);
        return NextResponse.json(
            { error: "Failed to create booking: " + error.message, details: error.stack },
            { status: 500 }
        );
    }
}

// PUT - Update a booking
export async function PUT(req) {
    try {
        const body = await req.json();
        const {
            id,
            status,
            deliveryDate,
            trialDate,
            returnDate,
            totalAmount,
            advanceAmount,
            tailorId,
            cutterId,
            notes
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            );
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate);
        if (trialDate) updateData.trialDate = new Date(trialDate);
        if (returnDate) updateData.returnDate = new Date(returnDate);
        if (notes !== undefined) updateData.notes = notes;
        if (tailorId !== undefined) updateData.tailorId = tailorId ? parseInt(tailorId) : null;
        if (cutterId !== undefined) updateData.cutterId = cutterId ? parseInt(cutterId) : null;

        const booking = await prisma.$transaction(async (tx) => {
            const currentBooking = await tx.booking.findUnique({
                where: { id: parseInt(id) },
                include: { customer: true }
            });

            if (!currentBooking) {
                throw new Error("Booking not found");
            }

            const newTotal = totalAmount !== undefined ? parseFloat(totalAmount) : parseFloat(currentBooking.totalAmount);
            const newAdvance = advanceAmount !== undefined ? parseFloat(advanceAmount) : parseFloat(currentBooking.advanceAmount);

            // 1. Calculate Adjustments
            const totalDiff = newTotal - parseFloat(currentBooking.totalAmount);
            const advanceDiff = newAdvance - parseFloat(currentBooking.advanceAmount);
            const balanceAdjustment = totalDiff - advanceDiff;

            // 2. Create Ledger Entries for Adjustments
            if (totalDiff !== 0) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: currentBooking.customerId,
                        type: totalDiff > 0 ? "DEBIT" : "CREDIT",
                        amount: Math.abs(totalDiff),
                        description: `Booking Adjustment (Total): ${currentBooking.bookingNumber}`,
                        bookingId: currentBooking.id
                    }
                });
            }

            if (advanceDiff !== 0) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: currentBooking.customerId,
                        type: advanceDiff > 0 ? "CREDIT" : "DEBIT",
                        amount: Math.abs(advanceDiff),
                        description: `Booking Adjustment (Advance): ${currentBooking.bookingNumber}`,
                        bookingId: currentBooking.id
                    }
                });

                // SYNC TO CASH ACCOUNT
                const cashAccount = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
                if (cashAccount) {
                    await tx.ledgerentry.create({
                        data: {
                            customerId: cashAccount.id,
                            type: advanceDiff > 0 ? 'DEBIT' : 'CREDIT',
                            amount: Math.abs(advanceDiff),
                            description: `Booking Advance Adjustment - ${currentBooking.customer.name} (Booking #${currentBooking.bookingNumber})`,
                        }
                    });
                    await tx.customer.update({
                        where: { id: cashAccount.id },
                        data: { balance: { [advanceDiff > 0 ? 'increment' : 'decrement']: Math.abs(advanceDiff) } }
                    });
                }
            }

            // 3. Update Customer Balance
            if (balanceAdjustment !== 0) {
                await tx.customer.update({
                    where: { id: currentBooking.customerId },
                    data: {
                        balance: { [balanceAdjustment > 0 ? 'increment' : 'decrement']: Math.abs(balanceAdjustment) }
                    }
                });
            }

            // 4. Perform the actually update
            updateData.totalAmount = newTotal;
            updateData.advanceAmount = newAdvance;
            updateData.remainingAmount = newTotal - newAdvance;

            return await tx.booking.update({
                where: { id: parseInt(id) },
                data: updateData,
                include: {
                    customer: {
                        select: { id: true, name: true, phone: true, email: true }
                    },
                    tailor: {
                        select: { id: true, name: true, role: true }
                    },
                    cutter: {
                        select: { id: true, name: true, role: true }
                    },
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true }
                            }
                        }
                    }
                }
            });
        }, {
            maxWait: 5000,
            timeout: 20000
        });

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Failed to update booking:", error);
        return NextResponse.json(
            { error: "Failed to update booking" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a booking
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: parseInt(id) },
                include: { items: true, customer: true }
            });

            if (!booking) {
                throw new Error("Booking not found");
            }

            // 1. Revert Balance
            const balanceReversal = parseFloat(booking.totalAmount) - parseFloat(booking.advanceAmount);
            await tx.customer.update({
                where: { id: booking.customerId },
                data: {
                    balance: { decrement: balanceReversal }
                }
            });

            // 2. Revert Cash if advance was paid
            if (parseFloat(booking.advanceAmount) > 0) {
                const cashAccount = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
                if (cashAccount) {
                    await tx.customer.update({
                        where: { id: cashAccount.id },
                        data: { balance: { decrement: parseFloat(booking.advanceAmount) } }
                    });
                }
            }

            // 3. Revert Stock
            for (const item of booking.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { quantity: { increment: item.quantity } }
                });

                await tx.stockmovement.create({
                    data: {
                        productId: item.productId,
                        type: 'IN',
                        quantity: item.quantity,
                        notes: `Booking Deletion Reversal: ${booking.bookingNumber}`
                    }
                });
            }

            // 4. Delete Ledger Entries
            await tx.ledgerentry.deleteMany({
                where: { bookingId: parseInt(id) }
            });

            // 5. Delete the booking
            await tx.booking.delete({
                where: { id: parseInt(id) }
            });

            return { message: "Booking and association records reverted successfully" };
        });

        return NextResponse.json(result);

        return NextResponse.json({ message: "Booking deleted successfully" });
    } catch (error) {
        console.error("Failed to delete booking:", error);
        return NextResponse.json(
            { error: "Failed to delete booking" },
            { status: 500 }
        );
    }
}
