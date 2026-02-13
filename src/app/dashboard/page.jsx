import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    Users,
    Scissors,
    TrendingUp,
    Clock,
    ChevronRight,
    Plus,
    Package,
    DollarSign,
    Calendar,
    CheckCircle2
} from "lucide-react";

async function getStats() {
    // 1. Total Customers
    const totalCustomers = await prisma.customer.count();

    // 2. Active Orders (Processing, Ready, Measurement Taken, Cutting, Stitching, Trial)
    // Exclude Cancelled and Delivered
    const activeOrders = await prisma.booking.count({
        where: {
            status: {
                notIn: ['DELIVERED', 'CANCELLED']
            }
        }
    });

    // 3. Revenue (Month to Date)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sum totalAmount from orders created this month that aren't cancelled
    const revenueResult = await prisma.booking.aggregate({
        _sum: {
            totalAmount: true
        },
        where: {
            createdAt: {
                gte: firstDayOfMonth
            },
            status: {
                not: 'CANCELLED'
            }
        }
    });

    const revenue = revenueResult._sum.totalAmount || 0;

    // 4. Pending Delivery (Ready status)
    const pendingDelivery = await prisma.booking.count({
        where: {
            status: 'READY'
        }
    });

    return {
        totalCustomers,
        activeOrders,
        revenue,
        pendingDelivery
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

    const stats = [
        {
            name: "Total Customers",
            value: statsData.totalCustomers.toString(),
            icon: Users,
            change: "View All",
            changeType: "positive",
            color: "blue",
            href: "/dashboard/customers"
        },
        {
            name: "Active Orders",
            value: statsData.activeOrders.toString(),
            icon: Scissors,
            change: "View All",
            changeType: "positive",
            color: "purple",
            href: "/dashboard/bookings?status=active"
        },
        {
            name: "Revenue (MTD)",
            value: `Rs. ${Number(statsData.revenue).toLocaleString()}`,
            icon: TrendingUp,
            change: "View Reports",
            changeType: "positive",
            color: "green",
            href: "/dashboard/reports"
        },
        {
            name: "Ready for Delivery",
            value: statsData.pendingDelivery.toString(),
            icon: Clock,
            change: "View All",
            changeType: "negative",
            color: "orange",
            href: "/dashboard/bookings?status=READY"
        },
    ];

    const quickActions = [
        { name: "New Order", icon: Plus, color: "blue", href: "/dashboard/bookings" },
        { name: "Add Customer", icon: Users, color: "green", href: "/dashboard/customers" },
        { name: "Add Product", icon: Package, color: "purple", href: "/dashboard/products" },
        { name: "View Reports", icon: TrendingUp, color: "orange", href: "/dashboard/reports" },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                        Welcome back, {session?.user?.name || "User"}! 👋
                    </h1>
                    <p className="text-zinc-600 mt-2 text-lg">
                        Here's what's happening with your tailor shop today.
                    </p>
                </div>
                <Link href="/dashboard/bookings">
                    <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 active:scale-95">
                        <Plus className="h-5 w-5" />
                        New Stitching Order
                    </button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Link href={stat.href} key={stat.name} className="block group">
                        <div
                            className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`p-3 bg-gradient-to-br ${stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                                    stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                                        stat.color === 'green' ? 'from-green-500 to-green-600' :
                                            'from-orange-500 to-orange-600'
                                    } rounded-xl shadow-lg`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.changeType === "positive"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                    }`}>
                                    {stat.change}
                                </span>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-medium text-zinc-600">{stat.name}</p>
                                <p className="text-3xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h3 className="font-bold text-zinc-900 text-lg mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link href={action.href} key={action.name} className="block group w-full">
                            <button
                                className={`w-full flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-zinc-200 hover:border-${action.color}-500 hover:bg-${action.color}-50 transition-all`}
                            >
                                <div className={`p-3 bg-gradient-to-br ${action.color === 'blue' ? 'from-blue-500 to-blue-600' :
                                    action.color === 'green' ? 'from-green-500 to-green-600' :
                                        action.color === 'purple' ? 'from-purple-500 to-purple-600' :
                                            action.color === 'orange' ? 'from-orange-500 to-orange-600' : 'from-zinc-500 to-zinc-600'
                                    } rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                                    <action.icon className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-zinc-700">{action.name}</span>
                            </button>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden min-w-[300px]">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                        <h3 className="font-bold text-zinc-900 text-lg">Recent Orders</h3>
                        <Link href="/dashboard/bookings">
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                                View all <ChevronRight className="h-4 w-4" />
                            </button>
                        </Link>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {recentOrders.length === 0 ? (
                                <p className="text-center text-zinc-500 py-4">No recent orders found.</p>
                            ) : (
                                recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-zinc-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                                                {order.avatar}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-900">{order.customer}</p>
                                                <p className="text-xs text-zinc-500">{order.items} items • {order.daysRemaining} days remaining</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 ${order.status === 'READY'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            } text-xs font-bold rounded-full uppercase tracking-wider`}>
                                            {order.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 min-w-[300px]">
                    <h3 className="font-bold text-zinc-900 text-lg mb-6">Today's Overview</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                                <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-zinc-600">Completed Orders</p>
                                {/* This would be a DB query in real implementation */}
                                <p className="text-2xl font-bold text-zinc-900">0</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-zinc-600">Scheduled Trials</p>
                                <p className="text-2xl font-bold text-zinc-900">0</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-zinc-600">Revenue Today</p>
                                <p className="text-2xl font-bold text-zinc-900">Rs. 0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
