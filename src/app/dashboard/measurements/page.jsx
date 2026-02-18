import prisma from "@/lib/prisma";
import MeasurementManagementClient from "./MeasurementManagementClient";
import { Box, Typography } from "@mui/material";
import { Ruler } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Measurement Management | TailorFlow",
    description: "Manage customer measurements for Shalwar Qameez and Waistcoats.",
};

async function getMeasurements() {
    try {
        const measurements = await prisma.measurement.findMany({
            include: {
                customer: {
                    select: { id: true, name: true, phone: true }
                }
            },
            orderBy: { takenAt: "desc" },
        });
        return JSON.parse(JSON.stringify(measurements));
    } catch (error) {
        console.error("Database error fetching measurements:", error);
        return [];
    }
}

async function getCustomers() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                accountCategory: true
            },
            orderBy: { name: "asc" },
        });

        // Filter out employee categories (Cutter, Tailor)
        return customers.filter(c => {
            const catName = c.accountCategory?.name?.toLowerCase() || "";
            return !catName.includes("cutter") && !catName.includes("tailor");
        }).map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone || "",
            address: c.address || ""
        }));
    } catch (error) {
        console.error("Database error fetching customers:", error);
        return [];
    }
}

export default async function MeasurementPage() {
    const measurements = await getMeasurements();
    const customers = await getCustomers();

    return (
        <div className="p-6 space-y-6">
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{
                        p: 1.5,
                        bgcolor: '#f5f3ff',
                        borderRadius: 3,
                        color: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Ruler size={28} />
                    </Box>
                    <Box>
                        <h1 className="text-3xl font-bold text-zinc-900">Measurement Management</h1>
                        <p className="text-zinc-500 mt-1">Record and manage custom measurements for Shalwar Qameez and Waistcoats.</p>
                    </Box>
                </Box>
            </Box>

            <MeasurementManagementClient initialMeasurements={measurements} customers={customers} />
        </div>
    );
}
