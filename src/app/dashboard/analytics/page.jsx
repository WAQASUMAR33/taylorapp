import prisma from "@/lib/prisma";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Analytics & PnL | GRACE TAILORS",
    description: "Branch-wise and combined analytics for bookings, revenue, costs and profit.",
};

async function getEmployees() {
    try {
        return await prisma.employee.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, role: true }
        });
    } catch {
        return [];
    }
}

async function getBranches() {
    try {
        return await prisma.branch.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, code: true }
        });
    } catch {
        return [];
    }
}

export default async function AnalyticsPage() {
    const [employees, branches] = await Promise.all([
        getEmployees(),
        getBranches(),
    ]);
    return <AnalyticsClient employees={employees} branches={branches} />;
}
