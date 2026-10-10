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
        let products = [];
        try {
            products = await prisma.product.findMany({
                include: {
                    branchStocks: {
                        include: {
                            branch: true
                        }
                    }
                },
                orderBy: { name: "asc" },
            });
        } catch (includeErr) {
            console.warn("Retrying products query:", includeErr.message);
            products = await prisma.product.findMany({
                orderBy: { name: "asc" },
            });
        }
        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

async function getBranches() {
    try {
        let branches = [];
        try {
            branches = await prisma.branch.findMany({
                where: { isActive: true },
                orderBy: { id: "asc" }
            });
        } catch {
            branches = await prisma.branch.findMany({
                orderBy: { id: "asc" }
            });
        }
        return JSON.parse(JSON.stringify(branches));
    } catch (error) {
        console.error("Failed to fetch branches:", error);
        return [];
    }
}

export default async function ProductManagementPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const [products, branches] = await Promise.all([
        getProducts(),
        getBranches(),
    ]);

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

            <ProductManagementClient initialProducts={products} initialBranches={branches} />
        </Box>
    );
}
