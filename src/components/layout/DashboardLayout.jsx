"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";

export default function DashboardLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div
                className={`transition-all duration-300 ${collapsed ? 'pl-20' : 'pl-[300px]'}`}
            >
                <Header />
                <main className="p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
