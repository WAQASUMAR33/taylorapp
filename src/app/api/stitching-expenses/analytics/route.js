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
                    items: true
                }
            }),
            prisma.stitchingExpense.findMany({
                where: expenseWhere
            })
        ]);

        // Calculate total stitching amount (excluding product/cloth sales)
        let totalStitchingAmount = 0;
        for (const b of bookings) {
            for (const item of b.items) {
                if (!item.productId) {
                    const itemTotal = parseFloat(item.totalPrice) || 0;
                    totalStitchingAmount += itemTotal;
                }
            }
        }

        // Calculate total stitching expenses
        const totalStitchingExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        // Profit
        const profit = totalStitchingAmount - totalStitchingExpenses;

        return NextResponse.json({
            totalStitchingAmount,
            totalStitchingExpenses,
            profit
        });
    } catch (error) {
        console.error("Failed to fetch stitching expenses analytics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
