import prisma from "@/lib/prisma";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Analytics | TailorFlow",
    description: "Date-wise analytics for bookings, revenue, costs and staff performance.",
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

export default async function AnalyticsPage() {
    const employees = await getEmployees();
    return <AnalyticsClient employees={employees} />;
}
