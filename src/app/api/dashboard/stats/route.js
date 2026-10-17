import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const branchIdParam = searchParams.get("branchId");
        const branchId = branchIdParam && branchIdParam !== "ALL" ? parseInt(branchIdParam) : null;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const bookingWhere = branchId ? { branchId } : {};

        // 1. Total Customers
        const totalCustomers = await prisma.customer.count({
            where: {
                accountCategory: {
                    name: "CUSTOMER"
                }
            }
        });

        // 2. Active Orders
        const activeOrders = await prisma.booking.count({
            where: {
                ...bookingWhere,
                status: {
                    notIn: ["DELIVERED", "CANCELLED"]
                }
            }
        });

        // 3. Revenue Month to Date
        const revenueResult = await prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: {
                ...bookingWhere,
                createdAt: { gte: firstDayOfMonth },
                status: { not: "CANCELLED" }
            }
        });
        const revenue = Number(revenueResult._sum.totalAmount || 0);

        // 4. Pending Delivery (Ready status)
        const pendingDelivery = await prisma.booking.count({
            where: {
                ...bookingWhere,
                status: "READY"
            }
        });

        // 5. Today Completed
        const completedToday = await prisma.booking.count({
            where: {
                ...bookingWhere,
                status: "DELIVERED",
                updatedAt: { gte: startOfToday, lt: endOfToday }
            }
        });

        // 6. Trials Today
        const trialsToday = await prisma.booking.count({
            where: {
                ...bookingWhere,
                trialDate: { gte: startOfToday, lt: endOfToday }
            }
        });

        // 7. Revenue Today
        const revenueTodayResult = await prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: {
                ...bookingWhere,
                createdAt: { gte: startOfToday, lt: endOfToday },
                status: { not: "CANCELLED" }
            }
        });
        const revenueToday = Number(revenueTodayResult._sum.totalAmount || 0);

        // 8. Recent Orders
        const orders = await prisma.booking.findMany({
            where: bookingWhere,
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                customer: true,
                items: true,
                branch: true
            }
        });

        const recentOrders = orders.map(order => ({
            id: order.id,
            bookingNumber: order.bookingNumber,
            customer: order.customer ? order.customer.name : "Unknown Customer",
            avatar: order.customer && order.customer.name
                ? order.customer.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                : "??",
            items: order.items.length,
            status: order.status,
            branchName: order.branch?.name || null,
            daysRemaining: order.deliveryDate
                ? Math.ceil((new Date(order.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24))
                : 0
        }));

        // 9. Chart Data: 7-Day Revenue & Volume Trends + Status Distribution
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dNext = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
            days.push({
                shortLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
                fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                start: d,
                end: dNext,
            });
        }

        const [dailyTrends, statusCounts] = await Promise.all([
            Promise.all(days.map(async (day) => {
                const [revAgg, orderCount, deliveredCount] = await Promise.all([
                    prisma.booking.aggregate({
                        _sum: { totalAmount: true },
                        where: {
                            ...bookingWhere,
                            createdAt: { gte: day.start, lt: day.end },
                            status: { not: "CANCELLED" }
                        }
                    }),
                    prisma.booking.count({
                        where: {
                            ...bookingWhere,
                            createdAt: { gte: day.start, lt: day.end }
                        }
                    }),
                    prisma.booking.count({
                        where: {
                            ...bookingWhere,
                            status: "DELIVERED",
                            updatedAt: { gte: day.start, lt: day.end }
                        }
                    })
                ]);
                return {
                    day: day.shortLabel,
                    fullDay: `${day.shortLabel} (${day.fullDate})`,
                    revenue: Number(revAgg._sum.totalAmount || 0),
                    orders: orderCount,
                    delivered: deliveredCount,
                };
            })),
            prisma.booking.groupBy({
                by: ["status"],
                where: bookingWhere,
                _count: { id: true },
            })
        ]);

        const statusDistribution = statusCounts.map((sc, index) => ({
            id: index,
            value: sc._count.id,
            label: sc.status.replace(/_/g, " "),
            status: sc.status,
        }));

        return NextResponse.json({
            statsData: {
                totalCustomers,
                activeOrders,
                revenue,
                pendingDelivery,
                completedToday,
                trialsToday,
                revenueToday
            },
            recentOrders,
            chartData: {
                dailyTrends,
                statusDistribution,
            }
        });
    } catch (error) {
        console.error("Dashboard stats API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
