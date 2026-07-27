import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

// Sync advance payment to the appropriate ledger account(s).
// paymentMethod: 'CASH' | 'BANK' | 'BOTH'
async function syncPaymentToAccounts(tx, { paymentMethod, bankId, advAmt, cashAmt, bankAmt, description, bookingId }) {
    if (advAmt <= 0) return;

    if (paymentMethod === 'CASH' || paymentMethod === 'BOTH') {
        const amount = paymentMethod === 'BOTH' ? cashAmt : advAmt;
        if (amount > 0) {
            const cashAcc = await getOrCreateCashAccount(tx);
            await tx.ledgerentry.create({
                data: { customerId: cashAcc.id, type: 'DEBIT', amount, description: `Cash Received - ${description}`, bookingId }
            });
            await tx.customer.update({ where: { id: cashAcc.id }, data: { balance: { increment: amount } } });
        }
    }

    if ((paymentMethod === 'BANK' || paymentMethod === 'BOTH') && bankId) {
        const amount = paymentMethod === 'BOTH' ? bankAmt : advAmt;
        if (amount > 0) {
            const { acc: bankAcc, bank } = await getOrCreateBankAccount(tx, bankId);
            await tx.ledgerentry.create({
                data: { customerId: bankAcc.id, type: 'DEBIT', amount, description: `Bank Received via ${bank.name} - ${description}`, bookingId }
            });
            await tx.customer.update({ where: { id: bankAcc.id }, data: { balance: { increment: amount } } });
            await tx.bank.update({ where: { id: bankId }, data: { balance: { increment: amount } } });
        }
    }
}

// Reverse a previously-synced payment from ledger accounts.
async function reversePaymentFromAccounts(tx, { paymentMethod, bankId, advAmt, cashAmt, bankAmt }) {
    if (advAmt <= 0) return;

    if (paymentMethod === 'CASH' || paymentMethod === 'BOTH') {
        const amount = paymentMethod === 'BOTH' ? cashAmt : advAmt;
        if (amount > 0) {
            const cashAcc = await tx.customer.findFirst({ where: { name: 'Cash Account' } });
            if (cashAcc) {
                await tx.customer.update({ where: { id: cashAcc.id }, data: { balance: { decrement: amount } } });
            }
        }
    }

    if ((paymentMethod === 'BANK' || paymentMethod === 'BOTH') && bankId) {
        const amount = paymentMethod === 'BOTH' ? bankAmt : advAmt;
        if (amount > 0) {
            const bankAcc = await tx.customer.findFirst({ where: { name: { startsWith: `Bank Account -` } } });
            if (bankAcc) {
                await tx.customer.update({ where: { id: bankAcc.id }, data: { balance: { decrement: amount } } });
            }
            await tx.bank.update({ where: { id: bankId }, data: { balance: { decrement: amount } } });
        }
    }
}

// Reverse/restore all booking-related ledger entries when status becomes or exits RETURNED
async function handleReturnedStatusTransition(tx, bookingId, currentBooking, newStatus) {
    if (currentBooking.status !== "RETURNED" && newStatus === "RETURNED") {
        const entries = await tx.ledgerentry.findMany({
            where: { bookingId },
            include: { customer: true }
        });

        const originalEntries = entries.filter(e => !e.description.startsWith("Reversal:") && !e.description.startsWith("Restore:"));

        for (const entry of originalEntries) {
            const amount = parseFloat(entry.amount);
            const reverseType = entry.type === "DEBIT" ? "CREDIT" : "DEBIT";
            const reverseDesc = `Reversal: ${entry.description}`;

            await tx.ledgerentry.create({
                data: {
                    customerId: entry.customerId,
                    type: reverseType,
                    amount,
                    description: reverseDesc,
                    bookingId
                }
            });

            const isDebit = reverseType === "DEBIT";
            await tx.customer.update({
                where: { id: entry.customerId },
                data: {
                    balance: { [isDebit ? "increment" : "decrement"]: amount }
                }
            });

            if (entry.customer?.code && entry.customer.code.startsWith("BANK-")) {
                const bankId = parseInt(entry.customer.code.split("-")[1]);
                if (bankId) {
                    await tx.bank.update({
                        where: { id: bankId },
                        data: {
                            balance: { [isDebit ? "increment" : "decrement"]: amount }
                        }
                    });
                }
            }
        }
    } else if (currentBooking.status === "RETURNED" && newStatus !== "RETURNED") {
        const entries = await tx.ledgerentry.findMany({
            where: { bookingId },
            include: { customer: true }
        });

        const reversalEntries = entries.filter(e => e.description.startsWith("Reversal:"));

        for (const entry of reversalEntries) {
            const amount = parseFloat(entry.amount);
            const restoreType = entry.type === "DEBIT" ? "CREDIT" : "DEBIT";
            const restoreDesc = `Restore: ${entry.description}`;

            await tx.ledgerentry.create({
                data: {
                    customerId: entry.customerId,
                    type: restoreType,
                    amount,
                    description: restoreDesc,
                    bookingId
                }
            });

            const isDebit = restoreType === "DEBIT";
            await tx.customer.update({
                where: { id: entry.customerId },
                data: {
                    balance: { [isDebit ? "increment" : "decrement"]: amount }
                }
            });

            if (entry.customer?.code && entry.customer.code.startsWith("BANK-")) {
                const bankId = parseInt(entry.customer.code.split("-")[1]);
                if (bankId) {
                    await tx.bank.update({
                        where: { id: bankId },
                        data: {
                            balance: { [isDebit ? "increment" : "decrement"]: amount }
                        }
                    });
                }
            }
        }
    }
}

// GET - Fetch all bookings or a specific booking
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const customerId = searchParams.get("customerId");

        const STAFF_INCLUDE = {
            staff: { include: { customer: { select: { id: true, name: true, accountCategory: { select: { name: true } } } } } }
        };
        const TAILOR_CUTTER_SELECT = { select: { id: true, name: true, accountCategory: { select: { name: true } } } };

        const BILLING_SELECT = { select: { id: true, name: true, phone: true } };

        if (id) {
            const booking = await prisma.booking.findUnique({
                where: { id: parseInt(id) },
                include: {
                    customer: { select: { id: true, name: true, phone: true, email: true, measurementNo: true } },
                    billingCustomer: BILLING_SELECT,
                    tailor: TAILOR_CUTTER_SELECT,
                    cutter: TAILOR_CUTTER_SELECT,
                    ...STAFF_INCLUDE,
                    items: {
                        include: {
                            product: { select: { id: true, name: true, sku: true } },
                            selectedOptions: { include: { stitchingOption: true } }
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
                    customer: { select: { id: true, name: true, phone: true, email: true, measurementNo: true } },
                    billingCustomer: BILLING_SELECT,
                    tailor: TAILOR_CUTTER_SELECT,
                    cutter: TAILOR_CUTTER_SELECT,
                    ...STAFF_INCLUDE,
                    items: {
                        include: {
                            product: { select: { id: true, name: true, sku: true } },
                            selectedOptions: { include: { stitchingOption: true } }
                        }
                    }
                },
                orderBy: { bookingDate: "desc" }
            });
            return NextResponse.json(bookings);
        }

        const ITEMS_INCLUDE = {
            items: {
                include: {
                    product: { select: { id: true, name: true, sku: true } },
                    selectedOptions: { include: { stitchingOption: true } }
                }
            }
        };

        const bookings = await prisma.booking.findMany({
            include: {
                customer: {
                    select: { id: true, name: true, phone: true, email: true, measurementNo: true }
                },
                billingCustomer: BILLING_SELECT,
                tailor: {
                    select: { id: true, name: true }
                },
                cutter: {
                    select: { id: true, name: true }
                },
                staff: {
                    include: { customer: { select: { id: true, name: true, accountCategory: { select: { name: true } } } } }
                },
                ...ITEMS_INCLUDE
            },
            orderBy: { bookingDate: "desc" }
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Failed to fetch bookings:", error);
        return NextResponse.json(
            { error: "Failed to fetch bookings: " + error.message, details: error.stack },
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
            billingCustomerId,
            bookingType,
            bookingDate,
            returnDate,
            deliveryDate,
            trialDate,
            tailorId,
            cutterId,
            tailorIds,   // array of employee IDs for tailors
            cutterIds,   // array of employee IDs for cutters
            totalAmount,
            advanceAmount,
            remainingAmount,
            notes,
            items,
            // Payment method fields
            paymentMethod,
            bankId,
            cashAmount,
            bankAmount,
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

        const resolvedPaymentMethod = paymentMethod || 'CASH';
        const resolvedBankId = bankId ? parseInt(bankId) : null;
        const resolvedCashAmt = parseFloat(cashAmount || 0);
        const resolvedBankAmt = parseFloat(bankAmount || 0);

        // The account that gets debited/credited is the billing customer (or booking customer if none)
        const effectiveBillingId = billingCustomerId ? parseInt(billingCustomerId) : parseInt(customerId);

        // Normalise staff arrays — fall back to legacy single fields
        const resolvedTailorIds = Array.isArray(tailorIds) && tailorIds.length > 0
            ? tailorIds.map(Number).filter(Boolean)
            : tailorId ? [parseInt(tailorId)] : [];
        const resolvedCutterIds = Array.isArray(cutterIds) && cutterIds.length > 0
            ? cutterIds.map(Number).filter(Boolean)
            : cutterId ? [parseInt(cutterId)] : [];

        if (!customerId || !bookingType || !totalAmount || !items || items.length === 0) {
            return NextResponse.json(
                { error: "Customer, booking type, total amount, and at least one item are required" },
                { status: 400 }
            );
        }

        const productIds = items.map(item => parseInt(item.productId)).filter(Boolean);
        const products = productIds.length > 0 ? await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, costPrice: true, materialCost: true, cuttingCost: true, stitchingCost: true }
        }) : [];

        const productsMap = new Map();
        products.forEach(p => productsMap.set(p.id, p));

        // Use transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // Generate monthly-reset booking number: YYYYMM-NNNN (restarts at 0001 each month)
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth(); // 0-indexed
            const mm = String(month + 1).padStart(2, "0");
            const prefix = `${year}${mm}-`;

            // Find the last booking number for this month by looking at bookingNumber prefix
            const lastBooking = await tx.booking.findFirst({
                where: { bookingNumber: { startsWith: prefix } },
                orderBy: { bookingNumber: "desc" },
                select: { bookingNumber: true }
            });

            let nextSeq = 1;
            if (lastBooking) {
                const lastSeq = parseInt(lastBooking.bookingNumber.split("-")[1], 10);
                nextSeq = lastSeq + 1;
            }
            const seq = String(nextSeq).padStart(4, "0");
            const bookingNumber = `${prefix}${seq}`;

            // 1. Create the booking
            const booking = await tx.booking.create({
                data: {
                    bookingNumber,
                    customerId: parseInt(customerId),
                    billingCustomerId: billingCustomerId ? parseInt(billingCustomerId) : null,
                    bookingType,
                    bookingDate: bookingDate ? new Date(bookingDate) : new Date(),
                    returnDate: returnDate ? new Date(returnDate) : null,
                    deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                    trialDate: trialDate ? new Date(trialDate) : null,
                    tailorId: resolvedTailorIds[0] || null,
                    cutterId: resolvedCutterIds[0] || null,
                    totalAmount: parseFloat(totalAmount),
                    advanceAmount: parseFloat(advanceAmount || 0),
                    remainingAmount: parseFloat(remainingAmount || totalAmount),
                    billStatus: parseFloat(remainingAmount || totalAmount) <= 0 ? "Clear Bill" : "Partial Pending",
                    notes,
                    status: "PENDING",
                    staff: {
                        create: [
                            ...resolvedTailorIds.map(id => ({ customerId: id, role: "TAILOR" })),
                            ...resolvedCutterIds.map(id => ({ customerId: id, role: "CUTTER" })),
                        ]
                    },
                    items: {
                        create: items.map(item => {
                            const pid = item.productId ? parseInt(item.productId) : null;
                            const product = pid ? productsMap.get(pid) : null;
                            return {
                                ...(pid ? { product: { connect: { id: pid } } } : {}),
                                quantity: parseFloat(item.quantity) || 1,
                                unitPrice: parseFloat(item.unitPrice || item.totalPrice || 0),
                                totalPrice: parseFloat(item.totalPrice || 0),
                                discount: parseFloat(item.discount || 0),
                                costPrice: product?.costPrice ? parseFloat(product.costPrice) : null,
                                materialCost: product?.materialCost ? parseFloat(product.materialCost) : null,
                                cuttingCost: product?.cuttingCost ? parseFloat(product.cuttingCost) : null,
                                stitchingCost: product?.stitchingCost ? parseFloat(product.stitchingCost) : null,
                                // Stitching Details
                                stitchingType: item.stitchingType || "SUIT",
                                cuffType: item.cuffType,
                                pohnchaType: item.pohnchaType,
                                gheraType: item.gheraType,
                                galaType: item.galaType,
                                galaSize: item.galaSize,
                                pocketType: item.pocketType,
                                shalwarType: item.shalwarType,
                                hasShalwarPocket: item.hasShalwarPocket || false,
                                hasFrontPockets: item.hasFrontPockets || false,
                                itemStatus: item.itemStatus || "PENDING",
                                itemNote: item.itemNote || null,
                                // Per-item measurements
                                qameez_lambai: item.qameez_lambai || null,
                                bazoo: item.bazoo || null,
                                teera: item.teera || null,
                                galaa: item.galaa || null,
                                chaati: item.chaati || null,
                                gheera: item.gheera || null,
                                kaf: item.kaf || null,
                                gehra_gird: item.gehra_gird || null,
                                shalwar_lambai: item.shalwar_lambai || null,
                                puhncha: item.puhncha || null,
                                shalwar_gheera: item.shalwar_gheera || null,
                                chaati_around: item.chaati_around || null,
                                kamar_around: item.kamar_around || null,
                                hip_around: item.hip_around || null,
                                kandha: item.kandha || null,
                                wskot_lambai: item.wskot_lambai || null,
                                wskot_teera: item.wskot_teera || null,
                                wskot_gala: item.wskot_gala || null,
                                wskot_chaati: item.wskot_chaati || null,
                                wskot_kamar: item.wskot_kamar || null,
                                wskot_hip: item.wskot_hip || null,
                                front_pocket: item.front_pocket || null,
                                side_pocket: item.side_pocket || null,
                                shalwar_pocket: item.shalwar_pocket || null,
                            };
                        })
                    }
                },
                include: {
                    customer: { select: { id: true, name: true, phone: true, email: true, measurementNo: true } },
                    billingCustomer: { select: { id: true, name: true, phone: true } },
                    tailor: { select: { id: true, name: true, accountCategory: { select: { name: true } } } },
                    cutter: { select: { id: true, name: true, accountCategory: { select: { name: true } } } },
                    staff: { include: { customer: { select: { id: true, name: true, accountCategory: { select: { name: true } } } } } },
                    items: {
                        include: {
                            product: { select: { id: true, name: true, sku: true } },
                            selectedOptions: { include: { stitchingOption: true } }
                        }
                    }
                }
            });

            // Save selected stitching options per item
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const bookingItem = booking.items[i];
                const selectedOptionIds = Array.isArray(item.selectedOptionIds) ? item.selectedOptionIds : [];
                if (selectedOptionIds.length > 0 && bookingItem) {
                    // Fetch option prices
                    const opts = await tx.stitching_option.findMany({
                        where: { id: { in: selectedOptionIds.map(Number) } }
                    });
                    await tx.booking_item_stitching_option.createMany({
                        data: opts.map(opt => ({
                            bookingItemId: bookingItem.id,
                            stitchingOptionId: opt.id,
                            price: parseFloat(opt.price)
                        }))
                    });
                }
            }

            // 2. Decrement stock and create movement record for each item (only if product is set)
            for (const item of items) {
                if (!item.productId) continue;
                const productId = parseInt(item.productId);
                const quantity = parseFloat(item.quantity);

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

            // 3. Create ledger entries for this booking (against billing customer)
            if (parseFloat(totalAmount) > 0) {
                const billingName = effectiveBillingId !== parseInt(customerId)
                    ? (await tx.customer.findUnique({ where: { id: effectiveBillingId }, select: { name: true } }))?.name
                    : booking.customer.name;

                // A. Debit for full booking amount
                await tx.ledgerentry.create({
                    data: {
                        customerId: effectiveBillingId,
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
                            customerId: effectiveBillingId,
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
                                description: `Advance from ${billingName} (Booking #${bookingNumber})`,
                            }
                        });
                        await tx.customer.update({
                            where: { id: cashAccount.id },
                            data: { balance: { increment: advAmt } }
                        });
                    }
                }

                // 4. Update Billing Customer Balance
                const balanceAdjustment = parseFloat(totalAmount) - advAmt;
                await tx.customer.update({
                    where: { id: effectiveBillingId },
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
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === "ADMIN";
        const body = await req.json();
        const {
            id,
            status,
            customerId,
            bookingType,
            bookingDate,
            deliveryDate,
            trialDate,
            returnDate,
            totalAmount,
            advanceAmount,
            billingCustomerId,
            tailorId,
            cutterId,
            tailorIds,
            cutterIds,
            notes,
            items  // full items array for edit mode
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Booking ID is required" },
                { status: 400 }
            );
        }

        // Resolve staff arrays — prefer arrays, fall back to legacy single fields
        const hasStaffUpdate = tailorIds !== undefined || cutterIds !== undefined || tailorId !== undefined || cutterId !== undefined;
        const resolvedTailorIds = Array.isArray(tailorIds)
            ? tailorIds.map(Number).filter(Boolean)
            : tailorId !== undefined ? (tailorId ? [parseInt(tailorId)] : []) : undefined;
        const resolvedCutterIds = Array.isArray(cutterIds)
            ? cutterIds.map(Number).filter(Boolean)
            : cutterId !== undefined ? (cutterId ? [parseInt(cutterId)] : []) : undefined;

        const updateData = {};
        if (status) updateData.status = status;
        if (customerId) updateData.customerId = parseInt(customerId);
        if (bookingType) updateData.bookingType = bookingType;
        if (bookingDate) updateData.bookingDate = new Date(bookingDate);
        if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
        if (trialDate !== undefined) updateData.trialDate = trialDate ? new Date(trialDate) : null;
        if (returnDate !== undefined) updateData.returnDate = returnDate ? new Date(returnDate) : null;
        if (notes !== undefined) updateData.notes = notes;
        if (billingCustomerId !== undefined) updateData.billingCustomerId = billingCustomerId ? parseInt(billingCustomerId) : null;

        const booking = await prisma.$transaction(async (tx) => {
            const currentBooking = await tx.booking.findUnique({
                where: { id: parseInt(id) },
                include: { customer: true, billingCustomer: true }
            });

            if (!currentBooking) {
                throw new Error("Booking not found");
            }

            if ((currentBooking.status === "COMPLETED" || currentBooking.status === "RETURNED") && status && status !== currentBooking.status) {
                if (!isAdmin) {
                    throw new Error("Only an admin can change the status of a completed or returned booking.");
                }
            }

            if (advanceAmount !== undefined) {
                const parsedAdvance = parseFloat(advanceAmount);
                const currentAdvance = parseFloat(currentBooking.advanceAmount);
                if (parsedAdvance !== currentAdvance && !isAdmin) {
                    throw new Error("Only an admin can edit the advance amount.");
                }
            }

            const newTotal = totalAmount !== undefined ? parseFloat(totalAmount) : parseFloat(currentBooking.totalAmount);
            const newAdvance = advanceAmount !== undefined ? parseFloat(advanceAmount) : parseFloat(currentBooking.advanceAmount);

            // Use billing customer for ledger/balance (fall back to booking customer)
            const effectiveBillingId = currentBooking.billingCustomerId || currentBooking.customerId;
            const billingName = currentBooking.billingCustomer?.name || currentBooking.customer.name;

            // 1. Calculate Adjustments
            const totalDiff = newTotal - parseFloat(currentBooking.totalAmount);
            const advanceDiff = newAdvance - parseFloat(currentBooking.advanceAmount);
            const balanceAdjustment = totalDiff - advanceDiff;

            // 2. Create Ledger Entries for Adjustments
            if (totalDiff !== 0) {
                await tx.ledgerentry.create({
                    data: {
                        customerId: effectiveBillingId,
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
                        customerId: effectiveBillingId,
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
                            description: `Booking Advance Adjustment - ${billingName} (Booking #${currentBooking.bookingNumber})`,
                        }
                    });
                    await tx.customer.update({
                        where: { id: cashAccount.id },
                        data: { balance: { [advanceDiff > 0 ? 'increment' : 'decrement']: Math.abs(advanceDiff) } }
                    });
                }
            }

            // 3. Update Billing Customer Balance
            if (balanceAdjustment !== 0) {
                await tx.customer.update({
                    where: { id: effectiveBillingId },
                    data: {
                        balance: { [balanceAdjustment > 0 ? 'increment' : 'decrement']: Math.abs(balanceAdjustment) }
                    }
                });
            }

            // 4. Update staff assignments if provided
            if (resolvedTailorIds !== undefined || resolvedCutterIds !== undefined) {
                await tx.booking_staff.deleteMany({ where: { bookingId: parseInt(id) } });
                const newTailorIds = resolvedTailorIds ?? [];
                const newCutterIds = resolvedCutterIds ?? [];
                if (newTailorIds.length > 0 || newCutterIds.length > 0) {
                    await tx.booking_staff.createMany({
                        data: [
                            ...newTailorIds.map(custId => ({ bookingId: parseInt(id), customerId: custId, role: "TAILOR" })),
                            ...newCutterIds.map(custId => ({ bookingId: parseInt(id), customerId: custId, role: "CUTTER" })),
                        ]
                    });
                }
                updateData.tailorId = newTailorIds[0] ?? null;
                updateData.cutterId = newCutterIds[0] ?? null;
            }

            // 5. Replace booking items if provided
            if (Array.isArray(items) && items.length > 0) {
                // A. Revert stock and log movements for existing items in this booking
                const priorItems = await tx.booking_item.findMany({
                    where: { bookingId: parseInt(id) }
                });

                for (const priorItem of priorItems) {
                    if (!priorItem.productId) continue;
                    
                    await tx.product.update({
                        where: { id: priorItem.productId },
                        data: {
                            quantity: { increment: priorItem.quantity }
                        }
                    });

                    await tx.stockmovement.create({
                        data: {
                            productId: priorItem.productId,
                            type: 'IN',
                            quantity: priorItem.quantity,
                            notes: `Booking Update Reversal: ${currentBooking.bookingNumber}`
                        }
                    });
                }

                // B. Delete existing items
                await tx.booking_item.deleteMany({ where: { bookingId: parseInt(id) } });

                // C. Recreate new items
                const productIds = items.map(i => parseInt(i.productId)).filter(Boolean);
                const products = productIds.length > 0 ? await tx.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, costPrice: true, materialCost: true, cuttingCost: true, stitchingCost: true }
                }) : [];
                const productsMap = new Map(products.map(p => [p.id, p]));

                for (const item of items) {
                    const pid = item.productId ? parseInt(item.productId) : null;
                    const product = pid ? productsMap.get(pid) : null;
                    const selectedOptionIds = (item.selectedOptionIds || []).map(Number).filter(Boolean);

                    const createdItem = await tx.booking_item.create({
                        data: {
                            bookingId: parseInt(id),
                            ...(pid ? { productId: pid } : {}),
                            quantity: parseFloat(item.quantity) || 1,
                            unitPrice: parseFloat(item.unitPrice || 0),
                            totalPrice: parseFloat(item.totalPrice || 0),
                            discount: parseFloat(item.discount || 0),
                            costPrice: product?.costPrice ? parseFloat(product.costPrice) : null,
                            materialCost: product?.materialCost ? parseFloat(product.materialCost) : null,
                            cuttingCost: product?.cuttingCost ? parseFloat(product.cuttingCost) : null,
                            stitchingCost: product?.stitchingCost ? parseFloat(product.stitchingCost) : null,
                            cuffType: item.cuffType || null,
                            pohnchaType: item.pohnchaType || null,
                            gheraType: item.gheraType || null,
                            galaType: item.galaType || null,
                            galaSize: item.galaSize || null,
                            pocketType: item.pocketType || null,
                            shalwarType: item.shalwarType || null,
                            hasShalwarPocket: item.hasShalwarPocket || false,
                            hasFrontPockets: item.hasFrontPockets || false,
                            itemStatus: item.itemStatus || "PENDING",
                            itemNote: item.itemNote || null,
                            stitchingType: item.stitchingType || "SUIT",
                            qameez_lambai: item.qameez_lambai || null,
                            bazoo: item.bazoo || null,
                            teera: item.teera || null,
                            galaa: item.galaa || null,
                            chaati: item.chaati || null,
                            gheera: item.gheera || null,
                            kaf: item.kaf || null,
                            gehra_gird: item.gehra_gird || null,
                            shalwar_lambai: item.shalwar_lambai || null,
                            puhncha: item.puhncha || null,
                            shalwar_gheera: item.shalwar_gheera || null,
                            chaati_around: item.chaati_around || null,
                            kamar_around: item.kamar_around || null,
                            hip_around: item.hip_around || null,
                            kandha: item.kandha || null,
                            wskot_lambai: item.wskot_lambai || null,
                            wskot_teera: item.wskot_teera || null,
                            wskot_gala: item.wskot_gala || null,
                            wskot_chaati: item.wskot_chaati || null,
                            wskot_kamar: item.wskot_kamar || null,
                            wskot_hip: item.wskot_hip || null,
                            front_pocket: item.front_pocket || null,
                            side_pocket: item.side_pocket || null,
                            shalwar_pocket: item.shalwar_pocket || null,
                        }
                    });

                    if (selectedOptionIds.length > 0) {
                        const validOptions = await tx.stitching_option.findMany({ where: { id: { in: selectedOptionIds } }, select: { id: true, price: true } });
                        await tx.booking_item_stitching_option.createMany({
                            data: validOptions.map(opt => ({ bookingItemId: createdItem.id, stitchingOptionId: opt.id, price: opt.price }))
                        });
                    }

                    // D. Decrement stock and log movements for new items
                    if (pid) {
                        const quantity = parseFloat(item.quantity) || 1;
                        await tx.product.update({
                            where: { id: pid },
                            data: {
                                quantity: { decrement: quantity }
                            }
                        });

                        await tx.stockmovement.create({
                            data: {
                                productId: pid,
                                type: 'OUT',
                                quantity: quantity,
                                notes: `Booking Update: ${currentBooking.bookingNumber}`
                            }
                        });
                    }
                }
            }

            if (status && status !== currentBooking.status) {
                await handleReturnedStatusTransition(tx, currentBooking.id, currentBooking, status);
            }

            // 6. Perform the actual update
            updateData.totalAmount = newTotal;
            updateData.advanceAmount = newAdvance;
            updateData.remainingAmount = newTotal - newAdvance;
            updateData.billStatus = (newTotal - newAdvance) <= 0 ? "Clear Bill" : "Partial Pending";

            return await tx.booking.update({
                where: { id: parseInt(id) },
                data: updateData,
                include: {
                    customer: {
                        select: { id: true, name: true, phone: true, email: true, measurementNo: true }
                    },
                    billingCustomer: {
                        select: { id: true, name: true, phone: true }
                    },
                    tailor: {
                        select: { id: true, name: true, accountCategory: { select: { name: true } } }
                    },
                    cutter: {
                        select: { id: true, name: true, accountCategory: { select: { name: true } } }
                    },
                    staff: {
                        include: { customer: { select: { id: true, name: true, accountCategory: { select: { name: true } } } } }
                    },
                    items: {
                        include: {
                            product: { select: { id: true, name: true, sku: true } },
                            selectedOptions: { include: { stitchingOption: true } }
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
            { error: "Failed to update booking: " + error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete a booking
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized. Only administrators can delete bookings." },
                { status: 403 }
            );
        }

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
                if (!item.productId) continue;
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
    } catch (error) {
        console.error("Failed to delete booking:", error);
        return NextResponse.json(
            { error: "Failed to delete booking" },
            { status: 500 }
        );
    }
}

// PATCH - Update a single booking item's status and/or note
export async function PATCH(req) {
    try {
        const { itemId, itemStatus, itemNote } = await req.json();
        if (!itemId) {
            return NextResponse.json({ error: "itemId is required" }, { status: 400 });
        }
        const data = {};
        if (itemStatus !== undefined) data.itemStatus = itemStatus;
        if (itemNote !== undefined) data.itemNote = itemNote;

        const updated = await prisma.booking_item.update({
            where: { id: parseInt(itemId) },
            data,
            include: {
                product: { select: { id: true, name: true, sku: true } },
                selectedOptions: { include: { stitchingOption: true } }
            }
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update booking item:", error);
        return NextResponse.json({ error: "Failed to update booking item" }, { status: 500 });
    }
}
