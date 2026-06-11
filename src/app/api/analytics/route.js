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
                fromDate = new Date(from);
                where.bookingDate.gte = fromDate;
            }
            if (to) {
                toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                where.bookingDate.lte = toDate;
            }
        }
        if (tailorId) where.tailorId = parseInt(tailorId);
        if (cutterId) where.cutterId = parseInt(cutterId);

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
        let totalStitchingCostCharged = 0;  // sum of stitchingCost from booking_items (revenue)
        let totalActualStitchingCost = 0;   // sum of stitching_cost from stitching_options
        let totalActualMaterialCost = 0;    // sum of material_cost from stitching_options

        // Cloth profit breakdown
        let totalClothUnitPrice = 0;        // sum of unitPrice * quantity for cloth items
        let totalClothCostPrice = 0;        // sum of costPrice * quantity for cloth items

        // Tailor map: tailorId → { name, amount, count }
        const tailorMap = {};
        // Cutter map: cutterId → { name, amount, count }
        const cutterMap = {};

        for (const b of bookings) {
            const total = parseFloat(b.totalAmount) || 0;
            const advance = parseFloat(b.advanceAmount) || 0;
            const remaining = parseFloat(b.remainingAmount) || 0;
            const itemCost = b.items.reduce((sum, i) => sum + (parseFloat(i.costPrice) || 0), 0);

            totalBookingAmount += total;
            totalReceived += advance;
            totalPending += remaining;
            totalCost += itemCost;

            // Process each item
            for (const item of b.items) {
                const itemTotal = parseFloat(item.totalPrice) || 0;
                const qty = parseInt(item.quantity) || 1;

                if (!item.productId) {
                    // ── Stitching item ──
                    suitCount += qty;
                    stitchingRevenue += itemTotal;

                    // Stitching cost charged to customer (revenue side)
                    totalStitchingCostCharged += (parseFloat(item.stitchingCost) || 0) * qty;

                    // Actual costs from linked stitching options
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

        // ── Stitching Profit = total stitchingCost (charged) - (actual stitching cost + actual material cost) ──
        const stitchingProfit = totalStitchingCostCharged - (totalActualStitchingCost + totalActualMaterialCost);

        // ── Cloth Profit = total unitPrice - (total costPrice + total expenses) ──
        const clothProfit = totalClothUnitPrice - (totalClothCostPrice + totalExpenses);

        // ── Overall Shop Profit = Stitching Profit + Cloth Profit ──
        const overallShopProfit = stitchingProfit + clothProfit;

        const totalProfit = totalBookingAmount - totalCost;

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
            bookings: JSON.parse(JSON.stringify(bookings)),
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
                totalStitchingCostCharged,
                totalActualStitchingCost,
                totalActualMaterialCost,
                stitchingProfit,
                // Cloth profit breakdown
                totalClothUnitPrice,
                totalClothCostPrice,
                totalExpenses,
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
