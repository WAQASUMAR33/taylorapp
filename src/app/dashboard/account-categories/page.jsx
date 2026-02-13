import prisma from "@/lib/prisma";
import AccountCategoryClient from "./AccountCategoryClient";
import { Box } from "@mui/material";
import { Tag } from "lucide-react";

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
        <div className="space-y-6">
            <Box sx={{ mb: 4, px: 3, pt: 3 }}>
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
                        <Tag size={28} />
                    </Box>
                    <Box>
                        <h1 className="text-3xl font-bold text-zinc-900">Account Categories</h1>
                        <p className="text-zinc-500 mt-1">
                            Create and manage customer account categories.
                        </p>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ px: 3 }}>
                <AccountCategoryClient initialCategories={categories} />
            </Box>
        </div>
    );
}
