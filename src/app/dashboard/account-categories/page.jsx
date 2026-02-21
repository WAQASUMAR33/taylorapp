import prisma from "@/lib/prisma";
import AccountCategoryClient from "./AccountCategoryClient";
import { Box, Typography } from "@mui/material";
import { Tags } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Account Categories | TailorFlow",
    description: "Manage customer account categories and classifications.",
};

async function getAccountCategories() {
    try {
        const categories = await prisma.accountCategory.findMany({
            include: {
                _count: {
                    select: { customers: true }
                }
            },
            orderBy: { name: "asc" },
        });

        return JSON.parse(JSON.stringify(categories));
    } catch (error) {
        console.error("Database error fetching account categories:", error);
        return [];
    }
}

export default async function AccountCategoriesPage() {
    const categories = await getAccountCategories();

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
                            Account Categories
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage categories for customers.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <AccountCategoryClient initialCategories={categories} />
        </Box>
    );
}
