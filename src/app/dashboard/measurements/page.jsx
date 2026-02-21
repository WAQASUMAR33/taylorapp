import prisma from "@/lib/prisma";
import MeasurementManagementClient from "./MeasurementManagementClient";
import { Container, Box, Typography } from "@mui/material";
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
        <Box sx={{ width: '100%' }}>
            <Box sx={{
                py: 1.5,
                px: 3,
                mb: 3,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 1,
                        bgcolor: '#3b82f6',
                        borderRadius: 2,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Ruler size={22} color="white" />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Measurement Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Record and manage custom measurements for Shalwar Qameez and Waistcoats.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ px: 3 }}>
                <MeasurementManagementClient initialMeasurements={measurements} customers={customers} />
            </Box>
        </Box>
    );
}
