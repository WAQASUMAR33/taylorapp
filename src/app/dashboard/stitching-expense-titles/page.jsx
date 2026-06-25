import prisma from "@/lib/prisma";
import StitchingExpenseTitleClient from "./StitchingExpenseTitleClient";
import { Box, Typography } from "@mui/material";
import { Tags } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Stitching Expense Titles | GRACE TAILORS",
    description: "Manage stitching expense categories and titles.",
};

async function getStitchingExpenseTitles() {
    try {
        const titles = await prisma.stitchingExpenseTitle.findMany({
            include: {
                _count: {
                    select: { expenses: true }
                }
            },
            orderBy: { name: "asc" },
        });

        return JSON.parse(JSON.stringify(titles));
    } catch (error) {
        console.error("Database error fetching stitching expense titles:", error);
        return [];
    }
}

export default async function StitchingExpenseTitlesPage() {
    const titles = await getStitchingExpenseTitles();

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
                        <Tags size={28} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Stitching Expense Titles
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage categories for stitching expenses.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <StitchingExpenseTitleClient initialTitles={titles} />
        </Box>
    );
}
