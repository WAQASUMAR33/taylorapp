import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

async function getStats() {
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
}

async function getRecentOrders() {
    const orders = await prisma.booking.findMany({
        take: 5,
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            customer: true,
            items: true
        }
    });

    return orders.map(order => ({
        id: order.id,
        bookingNumber: order.bookingNumber,
        customer: order.customer.name,
        // Initials for avatar
        avatar: order.customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        items: order.items.length,
        status: order.status,
        // Calculate days remaining/overdue based on deliveryDate
        daysRemaining: order.deliveryDate
            ? Math.ceil((new Date(order.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24))
            : 0
    }));
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    const statsData = await getStats();
    const recentOrders = await getRecentOrders();

    return (
        <DashboardClient
            statsData={{
                ...statsData,
                revenue: Number(statsData.revenue),
                revenueToday: Number(statsData.revenueToday),
            }}
            recentOrders={recentOrders}
            session={session}
        />
    );
}
