import prisma from "@/lib/prisma";
import ProductManagementClient from "./ProductManagementClient";
import { Container, Box, Typography } from "@mui/material";
import { PackageSearch } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Product Management | GRACE TAILORS",
    description: "Manage your inventory, prices, and product details.",
};

async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: "asc" },
        });
        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

export default async function ProductManagementPage() {
    const session = await getServerSession(authOptions);
    const canView = checkPermission(session, "products", "view");
    if (!canView) {
        redirect("/dashboard");
    }

    const products = await getProducts();

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
                        <PackageSearch size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Product Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage your inventory, prices, and product details.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <ProductManagementClient initialProducts={products} />
        </Box>
    );
}
