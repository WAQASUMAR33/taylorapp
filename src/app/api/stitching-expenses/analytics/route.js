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

        // Calculate total stitching amount (Gross & Net) and material cost
        let totalStitchingAmountGross = 0;
        let totalStitchingDiscount = 0;
        let totalActualMaterialCost = 0;

        for (const b of bookings) {
            for (const item of b.items) {
                if (!item.productId) {
                    const qty = parseFloat(item.quantity) || 1;
                    const itemTotal = parseFloat(item.totalPrice) || 0;
                    const itemDiscount = parseFloat(item.discount) || 0;
                    
                    totalStitchingAmountGross += itemTotal + itemDiscount;
                    totalStitchingDiscount += itemDiscount;

                    if (item.selectedOptions && item.selectedOptions.length > 0) {
                        for (const opt of item.selectedOptions) {
                            if (opt.stitchingOption) {
                                totalActualMaterialCost += (parseFloat(opt.stitchingOption.material_cost) || 0) * qty;
                            }
                        }
                    }
                }
            }
        }

        // Calculate primary profit (Gross Stitching Profit as in the main analytics page)
        const primaryProfit = totalStitchingAmountGross - totalStitchingDiscount - totalActualMaterialCost;

        // Calculate total stitching expenses (Overhead expenses)
        const totalStitchingExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        // Original Profit (Net Stitching Profit = primary profit - total stitching expenses)
        const profit = primaryProfit - totalStitchingExpenses;

        return NextResponse.json({
            totalStitchingAmount: totalStitchingAmountGross - totalStitchingDiscount, // Net stitching charged
            totalStitchingExpenses,
            totalStitchingProfit: primaryProfit,
            profit
        });
    } catch (error) {
        console.error("Failed to fetch stitching expenses analytics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
