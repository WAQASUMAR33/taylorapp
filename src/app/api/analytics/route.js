import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const tailorId = searchParams.get("tailorId");
        const cutterId = searchParams.get("cutterId");

        const where = {};

        // Build date filter
        let fromDate = null;
        let toDate = null;
        if (from || to) {
            where.bookingDate = {};
            if (from) {
                fromDate = new Date(`${from}T00:00:00.000Z`);
                where.bookingDate.gte = fromDate;
            }
            if (to) {
                toDate = new Date(`${to}T23:59:59.999Z`);
                where.bookingDate.lte = toDate;
            }
        }
        if (tailorId) where.tailorId = parseInt(tailorId);
        if (cutterId) where.cutterId = parseInt(cutterId);

        // Ignore cancelled stitching bookings in analytics
        where.NOT = {
            bookingType: "STITCHING",
            status: "CANCELLED",
        };

        // --- Bookings with full relations including stitching options ---
        const bookings = await prisma.booking.findMany({
            where,
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                tailor: { select: { id: true, name: true } },
                cutter: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                        selectedOptions: {
                            include: {
                                stitchingOption: {
                                    select: {
                                        id: true,
                                        name: true,
                                        stitching_cost: true,
                                        material_cost: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { bookingDate: "desc" }
        });

        // --- Expenses between dates ---
        const expenseWhere = {};
        if (fromDate || toDate) {
            expenseWhere.date = {};
            if (fromDate) expenseWhere.date.gte = fromDate;
            if (toDate) expenseWhere.date.lte = toDate;
        }
        const expenses = await prisma.expense.findMany({ where: expenseWhere });
        const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

        // --- Sale Returns between dates ---
        const returnWhere = {};
        if (fromDate || toDate) {
            returnWhere.returnDate = {};
            if (fromDate) returnWhere.returnDate.gte = fromDate;
            if (toDate) returnWhere.returnDate.lte = toDate;
        }
        const saleReturns = await prisma.sale_return.findMany({
            where: returnWhere,
            include: {
                items: {
                    include: {
                        product: { select: { id: true, costPrice: true } }
                    }
                }
            }
        });
        const totalSaleReturns = saleReturns.reduce((s, r) => s + (parseFloat(r.totalAmount) || 0), 0);

        // Calculate the cost price of returned items
        let totalReturnedCostPrice = 0;
        for (const r of saleReturns) {
            for (const item of r.items) {
                const qty = parseFloat(item.quantity) || 0;
                const cost = parseFloat(item.product?.costPrice) || 0;
                totalReturnedCostPrice += qty * cost;
            }
        }

        // --- Purchases (for payables) ---
        const purchases = await prisma.purchase.findMany({
            include: {
                payments: true,
                supplierRel: { select: { id: true, name: true } }
            },
            orderBy: { purchaseDate: "desc" }
        });

        // --- Customers receivables (non-supplier, positive balance) ---
        const customers = await prisma.customer.findMany({
            where: { balance: { gt: 0 } },
            select: { id: true, name: true, balance: true }
        });

        // --- Aggregate booking totals ---
        let totalBookingAmount = 0;
        let totalReceived = 0;
        let totalPending = 0;
        let totalCost = 0;
        let suitCount = 0;
        let stitchingRevenue = 0;   // total stitchingCost charged to customer
        let productRevenue = 0;     // total unitPrice for cloth items

        // Stitching profit breakdown
        let totalStitchingAmount = 0;        // Gross stitching revenue before discount
        let totalStitchingDiscountAmount = 0; // Total discount applied to stitching items
        let totalActualStitchingCost = 0;   // sum of stitching_cost from stitching_options
        let totalActualMaterialCost = 0;    // sum of material_cost from stitching_options

        // Cloth profit breakdown
        let totalClothUnitPrice = 0;        // sum of unitPrice * quantity for cloth items
        let totalClothCostPrice = 0;        // sum of costPrice * quantity for cloth items
        let totalClothDiscountAmount = 0;   // sum of discount for cloth items

        // Tailor map: tailorId → { name, amount, count }
        const tailorMap = {};
        // Cutter map: cutterId → { name, amount, count }
        const cutterMap = {};

        const processedBookings = [];

        for (const b of bookings) {
            const total = parseFloat(b.totalAmount) || 0;
            const advance = parseFloat(b.advanceAmount) || 0;
            const rawRemaining = parseFloat(b.remainingAmount) || 0;
            const itemCost = b.items.reduce((sum, i) => sum + (parseFloat(i.costPrice) || 0), 0);

            // Determine if bill is cleared or fully paid
            const isCleared = b.billStatus === "Clear" || b.billStatus === "Clear Bill" || b.status === "PAID" || rawRemaining <= 0 || (advance >= total && total > 0);
            const remaining = isCleared ? 0 : Math.max(0, Math.min(rawRemaining, total));
            const received = isCleared ? total : Math.max(advance, Math.max(0, total - remaining));

            processedBookings.push({
                ...b,
                advanceAmount: received,
                remainingAmount: remaining,
            });

            totalBookingAmount += total;
            totalReceived += received;
            totalPending += remaining;
            totalCost += itemCost;

            // Process each item
            for (const item of b.items) {
                const itemTotal = parseFloat(item.totalPrice) || 0;
                const qty = parseFloat(item.quantity) || 1;
                const itemDiscount = parseFloat(item.discount) || 0;

                if (!item.productId) {
                    // ── Stitching item ──
                    suitCount += qty;
                    stitchingRevenue += itemTotal;

                    // Gross stitching amount is itemTotal + itemDiscount
                    totalStitchingAmount += itemTotal + itemDiscount;
                    totalStitchingDiscountAmount += itemDiscount;

                    if (item.selectedOptions && item.selectedOptions.length > 0) {
                        for (const opt of item.selectedOptions) {
                            if (opt.stitchingOption) {
                                totalActualStitchingCost += (parseFloat(opt.stitchingOption.stitching_cost) || 0) * qty;
                                totalActualMaterialCost += (parseFloat(opt.stitchingOption.material_cost) || 0) * qty;
                            }
                        }
                    }
                } else {
                    // ── Cloth / product item ──
                    productRevenue += itemTotal;
                    totalClothUnitPrice += (parseFloat(item.unitPrice) || 0) * qty;
                    totalClothCostPrice += (parseFloat(item.costPrice) || 0) * qty;
                    totalClothDiscountAmount += itemDiscount;
                }
            }

            // Tailor breakdown
            if (b.tailor) {
                if (!tailorMap[b.tailorId]) {
                    tailorMap[b.tailorId] = { id: b.tailorId, name: b.tailor.name, amount: 0, count: 0 };
                }
                tailorMap[b.tailorId].amount += total;
                tailorMap[b.tailorId].count += 1;
            }

            // Cutter breakdown
            if (b.cutter) {
                if (!cutterMap[b.cutterId]) {
                    cutterMap[b.cutterId] = { id: b.cutterId, name: b.cutter.name, amount: 0, count: 0 };
                }
                cutterMap[b.cutterId].amount += total;
                cutterMap[b.cutterId].count += 1;
            }
        }

        // ── Stitching Profit = total stitching amount - total stitching discount amount - total material cost - total stitching cost ──
        const stitchingProfit = totalStitchingAmount - totalStitchingDiscountAmount - totalActualMaterialCost - totalActualStitchingCost;

        // Deduct cost price of returned items from total cost price of products
        const totalClothCostPriceNet = Math.max(0, totalClothCostPrice - totalReturnedCostPrice);

        // ── Cloth Profit = total unitPrice - total discount - (total costPrice (net) + total expenses + total sale returns) ──
        const clothProfit = totalClothUnitPrice - totalClothDiscountAmount - (totalClothCostPriceNet + totalExpenses + totalSaleReturns);

        // ── Overall Shop Profit = Stitching Profit + Cloth Profit ──
        const overallShopProfit = stitchingProfit + clothProfit;

        totalCost = totalClothCostPriceNet + totalActualStitchingCost + totalActualMaterialCost;
        const totalProfit = overallShopProfit;

        // --- Payables from purchases ---
        let totalPayable = 0;
        for (const p of purchases) {
            const paid = p.payments.reduce((s, pay) => s + parseFloat(pay.amount), 0);
            const payable = parseFloat(p.totalAmount) - paid;
            if (payable > 0) totalPayable += payable;
        }

        // --- Receivables from customer balances ---
        const totalReceivables = customers.reduce((s, c) => s + parseFloat(c.balance), 0);

        return NextResponse.json({
            bookings: JSON.parse(JSON.stringify(processedBookings)),
            summary: {
                totalBookingAmount,
                totalReceived,
                totalPending,
                totalCost,
                totalProfit,
                totalPayable,
                totalReceivables,
                bookingCount: bookings.length,
                suitCount,
                stitchingRevenue,
                productRevenue,
                // Stitching profit breakdown
                totalStitchingCostCharged: totalStitchingAmount,
                totalStitchingDiscountAmount,
                totalActualStitchingCost,
                totalActualMaterialCost,
                stitchingProfit,
                // Cloth profit breakdown
                totalClothUnitPrice,
                totalClothCostPrice: totalClothCostPriceNet,
                totalClothDiscountAmount,
                totalExpenses,
                totalSaleReturns,
                clothProfit,
                // Overall shop profit
                overallShopProfit,
            },
            tailorBreakdown: Object.values(tailorMap).sort((a, b) => b.amount - a.amount),
            cutterBreakdown: Object.values(cutterMap).sort((a, b) => b.amount - a.amount),
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics: " + error.message }, { status: 500 });
    }
}
