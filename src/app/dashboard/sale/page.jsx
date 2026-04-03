import prisma from "@/lib/prisma";
import SaleClient from "./SaleClient";
import { Box, Typography } from "@mui/material";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "New Sale | RAPID TAILOR",
    description: "Create a new sale and generate a bill.",
};

export default async function SalePage() {
    const [products, customers] = await Promise.all([
        prisma.product.findMany({ orderBy: { name: "asc" } }).then(r => JSON.parse(JSON.stringify(r))),
        prisma.customer.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, phone: true, balance: true },
        }).then(r => JSON.parse(JSON.stringify(r))),
    ]);

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{
                py: 3, px: 3, mb: 3,
                bgcolor: "background.paper",
                borderBottom: 1, borderColor: "divider",
                borderRadius: 2,
                boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: "success.light", borderRadius: 3, color: "success.main", display: "flex", alignItems: "center" }}>
                        <ShoppingBag size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">New Sale</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Search products, add items, apply discounts and save the bill.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <SaleClient products={products} customers={customers} />
        </Box>
    );
}
