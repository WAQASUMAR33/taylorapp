"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    UserRound,
    ShoppingCart,
    Scissors,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Package,
    Tag,
    Ruler,
    Calendar as CalendarIcon,
    Landmark,
    BookText,
    Boxes
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Account Management", href: "/dashboard/customers", icon: Users, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Measurements", href: "/dashboard/measurements", icon: Ruler, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Bookings", href: "/dashboard/bookings", icon: CalendarIcon, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "Employees", href: "/dashboard/employees", icon: UserRound, roles: ["ADMIN", "MANAGER"] },
    { name: "Products", href: "/dashboard/products", icon: Package, roles: ["ADMIN", "MANAGER"] },
    { name: "Categories", href: "/dashboard/categories", icon: Tag, roles: ["ADMIN", "MANAGER"] },
    { name: "Material Stock", href: "/dashboard/materials", icon: Boxes, roles: ["ADMIN", "MANAGER"] },
    { name: "Purchases", href: "/dashboard/purchases", icon: ShoppingCart, roles: ["ADMIN", "MANAGER"] },
    { name: "Ledger", href: "/dashboard/ledger", icon: BookText, roles: ["ADMIN", "MANAGER"] },
    { name: "Cash Management", href: "/dashboard/cash", icon: Landmark, roles: ["ADMIN", "MANAGER"] },
    { name: "Stitching Orders", href: "/dashboard/stitching-orders", icon: Scissors, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { name: "User Management", href: "/dashboard/users", icon: Settings, roles: ["ADMIN"] },
];

export default function Sidebar({ collapsed, setCollapsed }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const filteredNavItems = navItems.filter((item) =>
        item.roles.includes(session?.user?.role)
    );

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-white border-r border-zinc-200 transition-all duration-300 z-50 shadow-lg ${collapsed ? "w-20" : "w-[300px]"
                }`}
        >
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className={`p-6 flex items-center gap-3 border-b border-zinc-100 ${collapsed ? 'justify-center p-4' : ''}`}>
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Scissors className="h-6 w-6 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                            TailorFlow
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${isActive
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                    } ${collapsed ? 'justify-center px-2' : ''}`}
                            >
                                <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : ""}`} />
                                {!collapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl z-[60]">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-zinc-100 space-y-2">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-all group ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        {!collapsed && <span className="font-medium">Collapse</span>}
                    </button>

                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all group ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                        {!collapsed && <span className="font-medium">Logout</span>}
                    </button>

                    {!collapsed && (
                        <div className="px-4 py-2 text-xs text-center text-zinc-400">
                            v1.0.0
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
