import prisma from "@/lib/prisma";
import MeasurementManagementClient from "./MeasurementManagementClient";
import { Container, Box, Typography } from "@mui/material";
import { Ruler } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Measurement Management | GRACE TAILORS",
    description: "Manage customer measurements for Shalwar Qameez and Waistcoats.",
};

async function getMeasurements() {
    try {
        const [measurements, totalCount] = await Promise.all([
            prisma.measurement.findMany({
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            fatherName: true,
                            measurementNo: true,
                            code: true,
                            address: true,
                            balance: true,
                            accountCategory: {
                                select: { name: true }
                            }
                        }
                    }
                },
                orderBy: { takenAt: "desc" },
                take: 50,
            }),
            prisma.measurement.count()
        ]);
        return {
            measurements: JSON.parse(JSON.stringify(measurements)),
            totalCount
        };
    } catch (error) {
        console.error("Database error fetching measurements:", error);
        return { measurements: [], totalCount: 0 };
    }
}

export default async function MeasurementPage() {
    const { measurements, totalCount } = await getMeasurements();

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{
                py: 3,
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
                        p: 1.5,
                        bgcolor: 'primary.light',
                        borderRadius: 3,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Ruler size={28} />
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
                <MeasurementManagementClient initialMeasurements={measurements} initialTotalCount={totalCount} />
            </Box>
        </Box>
    );
}
