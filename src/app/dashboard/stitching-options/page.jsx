import prisma from "@/lib/prisma";
import StitchingOptionsClient from "./StitchingOptionsClient";
import { Box, Typography } from "@mui/material";
import { Scissors } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Stitching Option Pricing | RAPID TAILOR",
    description: "Manage stitching options and their prices.",
};

async function getOptions() {
    try {
        const options = await prisma.stitching_option.findMany({
            orderBy: { createdAt: "asc" }
        });
        return JSON.parse(JSON.stringify(options));
    } catch (error) {
        console.error("Error fetching stitching options:", error);
        return [];
    }
}

export default async function StitchingOptionsPage() {
    const options = await getOptions();

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{
                py: 3, px: 3, mb: 3,
                bgcolor: "background.paper",
                borderBottom: 1, borderColor: "divider",
                borderRadius: 2,
                boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)"
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{
                        p: 1.5, backgroundColor: "#f5f3ff",
                        borderRadius: 2, color: "#7c3aed",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Scissors size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Stitching Option Pricing
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Define stitching services and their prices (e.g. Single Silai, Double Silai).
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ px: 3 }}>
                <StitchingOptionsClient initialOptions={options} />
            </Box>
        </Box>
    );
}
