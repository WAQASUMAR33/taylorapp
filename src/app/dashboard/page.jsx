import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

async function getStats() {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Total Customers (only CUSTOMER category, not employees)
        const totalCustomers = await prisma.customer.count({
            where: {
                accountCategory: {
                    name: 'CUSTOMER'
                }
            }
        });

        // 2. Active Orders (exclude Cancelled and Delivered)
        const activeOrders = await prisma.booking.count({
            where: {
                status: {
                    notIn: ['DELIVERED', 'CANCELLED']
                }
            }
        });

        // 3. Revenue (Month to Date)
        const revenueResult = await prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: {
                createdAt: { gte: firstDayOfMonth },
                status: { not: 'CANCELLED' }
            }
        });
        const revenue = revenueResult._sum.totalAmount || 0;

        // 4. Pending Delivery (Ready status)
        const pendingDelivery = await prisma.booking.count({
            where: { status: 'READY' }
        });

        // 5. Today's Completed Orders (Delivered today)
        const completedToday = await prisma.booking.count({
            where: {
                status: 'DELIVERED',
                updatedAt: { gte: startOfToday, lt: endOfToday }
            }
        });

        // 6. Scheduled Trials today (trialDate is today)
        const trialsToday = await prisma.booking.count({
            where: {
                trialDate: { gte: startOfToday, lt: endOfToday }
            }
        });

        // 7. Revenue Today
        const revenueTodayResult = await prisma.booking.aggregate({
            _sum: { totalAmount: true },
            where: {
                createdAt: { gte: startOfToday, lt: endOfToday },
                status: { not: 'CANCELLED' }
            }
        });
        const revenueToday = revenueTodayResult._sum.totalAmount || 0;

        return {
            totalCustomers,
            activeOrders,
            revenue,
            pendingDelivery,
            completedToday,
            trialsToday,
            revenueToday
        };
    } catch (error) {
        console.error("Database error fetching dashboard stats:", error);
        return {
            totalCustomers: 0,
            activeOrders: 0,
            revenue: 0,
            pendingDelivery: 0,
            completedToday: 0,
            trialsToday: 0,
            revenueToday: 0
        };
    }
}

async function getRecentOrders() {
    try {
        const orders = await prisma.booking.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                customer: true,
                items: true,
                branch: true
            }
        });

        return orders.map(order => ({
            id: order.id,
            bookingNumber: order.bookingNumber,
            customer: order.customer ? order.customer.name : "Unknown Customer",
            avatar: order.customer && order.customer.name
                ? order.customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : "??",
            items: order.items.length,
            status: order.status,
            branchName: order.branch?.name || null,
            daysRemaining: order.deliveryDate
                ? Math.ceil((new Date(order.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24))
                : 0
        }));
    } catch (error) {
        console.error("Database error fetching recent orders:", error);
        return [];
    }
}

async function getChartData() {
    try {
        const now = new Date();
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
                            createdAt: { gte: day.start, lt: day.end },
                            status: { not: "CANCELLED" }
                        }
                    }),
                    prisma.booking.count({
                        where: {
                            createdAt: { gte: day.start, lt: day.end }
                        }
                    }),
                    prisma.booking.count({
                        where: {
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
                _count: { id: true },
            })
        ]);

        const statusDistribution = statusCounts.map((sc, index) => ({
            id: index,
            value: sc._count.id,
            label: sc.status.replace(/_/g, " "),
            status: sc.status,
        }));

        return { dailyTrends, statusDistribution };
    } catch (err) {
        console.error("Chart data query error:", err);
        return { dailyTrends: [], statusDistribution: [] };
    }
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    const [statsData, recentOrders, branches, chartData] = await Promise.all([
        getStats(),
        getRecentOrders(),
        prisma.branch.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, code: true }
        }),
        getChartData()
    ]);

    return (
        <DashboardClient
            statsData={{
                ...statsData,
                revenue: Number(statsData.revenue),
                revenueToday: Number(statsData.revenueToday),
            }}
            recentOrders={recentOrders}
            session={session}
            branches={branches}
            initialChartData={chartData}
        />
    );
}
