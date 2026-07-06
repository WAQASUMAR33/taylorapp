import prisma from "@/lib/prisma";
import SaleReturnsClient from "./SaleReturnsClient";
import { Box, Typography } from "@mui/material";
import { RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Sale Returns | GRACE TAILORS",
    description: "Manage product returns, update stock, and balance customer accounts.",
};

export default async function SaleReturnsPage() {
    const returns = await prisma.sale_return.findMany({
        include: {
            customer: { select: { id: true, name: true, phone: true, address: true } },
            bank: { select: { id: true, name: true } },
            items: {
                include: {
                    product: { select: { id: true, name: true, sku: true } }
                }
            }
        },
        orderBy: { returnDate: "desc" }
    });

    const customers = await prisma.customer.findMany({
        select: { id: true, name: true, phone: true, address: true },
        orderBy: { name: "asc" }
    });

    const products = await prisma.product.findMany({
        select: { id: true, name: true, sku: true, unitPrice: true },
        orderBy: { name: "asc" }
    });

    const banks = await prisma.bank.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    });

    // Serialize Decimals to string/number
    const serializedReturns = returns.map(r => ({
        ...r,
        totalAmount: parseFloat(r.totalAmount.toString()),
        items: r.items.map(item => ({
            ...item,
            quantity: parseFloat(item.quantity.toString()),
            unitPrice: parseFloat(item.unitPrice.toString()),
            totalPrice: parseFloat(item.totalPrice.toString())
        }))
    }));

    const serializedProducts = products.map(p => ({
        ...p,
        unitPrice: p.unitPrice ? parseFloat(p.unitPrice.toString()) : 0
    }));

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
                    <Box sx={{ p: 1.5, bgcolor: "warning.light", borderRadius: 3, color: "warning.main", display: "flex", alignItems: "center" }}>
                        <RotateCcw size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">Product Sale Returns</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Process customer product returns, auto-increment stock quantities, and record ledger offsets.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <SaleReturnsClient 
                initialReturns={serializedReturns} 
                customers={customers} 
                products={serializedProducts} 
                banks={banks} 
            />
        </Box>
    );
}
