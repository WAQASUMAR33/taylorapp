import prisma from "@/lib/prisma";
import CategoryManagementClient from "./CategoryManagementClient";
import { Container, Box, Typography } from "@mui/material";

export const metadata = {
    title: "Category Management | TailorFlow",
    description: "Manage product and material categories.",
};

async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { name: "asc" },
        });
        return categories;
    } catch (error) {
        console.error("Database error:", error);
        return [];
    }
}

export default async function CategoryPage() {
    const categories = await getCategories();

    // Serialize
    const serializedCategories = JSON.parse(JSON.stringify(categories));

    return (
        <Container maxWidth="xl" disableGutters>
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
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                        Category Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        Organize your products and materials into structured categories.
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ px: 3 }}>
                <CategoryManagementClient initialCategories={serializedCategories} />
            </Box>
        </Container>
    );
}
