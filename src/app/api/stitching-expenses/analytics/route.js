import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        // Build search conditions
        let fromDate = null;
        let toDate = null;

        const bookingWhere = {
            NOT: {
                bookingType: "STITCHING",
                status: "CANCELLED",
            }
        };

        const expenseWhere = {};

        if (dateFrom || dateTo) {
            bookingWhere.bookingDate = {};
            expenseWhere.date = {};

            if (dateFrom) {
                fromDate = new Date(`${dateFrom}T00:00:00.000Z`);
                bookingWhere.bookingDate.gte = fromDate;
                expenseWhere.date.gte = fromDate;
            }
            if (dateTo) {
                toDate = new Date(`${dateTo}T23:59:59.999Z`);
                bookingWhere.bookingDate.lte = toDate;
                expenseWhere.date.lte = toDate;
            }
        }

        // Fetch bookings and expenses in parallel
        const [bookings, expenses] = await Promise.all([
            prisma.booking.findMany({
                where: bookingWhere,
                include: {
                    items: {
                        include: {
                            selectedOptions: {
                                include: {
                                    stitchingOption: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.stitchingExpense.findMany({
                where: expenseWhere
            })
        ]);

        // Calculate total stitching amount, actual stitching cost, and material cost
        let totalStitchingAmount = 0;
        let totalActualStitchingCost = 0;
        let totalActualMaterialCost = 0;

        for (const b of bookings) {
            for (const item of b.items) {
                if (!item.productId) {
                    const qty = parseFloat(item.quantity) || 1;
                    const itemTotal = parseFloat(item.totalPrice) || 0;
                    totalStitchingAmount += itemTotal;

                    if (item.selectedOptions && item.selectedOptions.length > 0) {
                        for (const opt of item.selectedOptions) {
                            if (opt.stitchingOption) {
                                totalActualStitchingCost += (parseFloat(opt.stitchingOption.stitching_cost) || 0) * qty;
                                totalActualMaterialCost += (parseFloat(opt.stitchingOption.material_cost) || 0) * qty;
                            }
                        }
                    }
                }
            }
        }

        // Calculate total stitching profit (Gross Stitching Profit)
        const totalStitchingProfit = totalStitchingAmount - (totalActualStitchingCost + totalActualMaterialCost);

        // Calculate total stitching expenses (Overhead expenses)
        const totalStitchingExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        // Net Stitching Profit
        const profit = totalStitchingProfit - totalStitchingExpenses;

        return NextResponse.json({
            totalStitchingAmount,
            totalStitchingExpenses,
            totalStitchingProfit,
            profit
        });
    } catch (error) {
        console.error("Failed to fetch stitching expenses analytics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
