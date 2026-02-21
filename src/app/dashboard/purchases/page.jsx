import prisma from "@/lib/prisma";
import PurchaseManagementClient from "./PurchaseManagementClient";
import { Container, Box, Typography } from "@mui/material";
import { ShoppingCart } from "lucide-react";

export const metadata = {
    title: "Purchase Management - TailorFlow",
};

export default async function PurchasesPage() {
    // Fetch products for the purchase form
    const products = await prisma.product.findMany({
        orderBy: { name: "asc" },
    });

    // Fetch suppliers (customers in the 'Supplier' category)
    const suppliers = await prisma.customer.findMany({
        where: {
            accountCategory: {
                name: "Supplier"
            }
        },
        orderBy: { name: "asc" },
    });

    // Fetch banks
    const banks = await prisma.bank.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });

    // Fetch existing purchases
    const purchases = await prisma.purchase.findMany({
        include: {
            items: {
                include: {
                    product: true
                }
            },
            payments: {
                include: {
                    bank: true
                }
            },
            supplierRel: true
        },
        orderBy: { createdAt: "desc" },
    });

    // Serialize data
    const serializedProducts = products.map(p => ({
        ...p,
        cuttingCost: p.cuttingCost ? p.cuttingCost.toString() : "0",
        stitchingCost: p.stitchingCost ? p.stitchingCost.toString() : "0",
        materialCost: p.materialCost ? p.materialCost.toString() : "0",
        costPrice: p.costPrice ? p.costPrice.toString() : "0",
        unitPrice: p.unitPrice ? p.unitPrice.toString() : "0",
    }));

    const serializedSuppliers = suppliers.map(s => ({
        id: s.id,
        name: s.name,
    }));

    const serializedBanks = banks.map(b => ({
        id: b.id,
        name: b.name,
        accountNumber: b.accountNumber,
    }));

    const serializedPurchases = purchases.map(purchase => ({
        ...purchase,
        totalAmount: purchase.totalAmount.toString(),
        purchaseDate: purchase.purchaseDate.toISOString(),
        createdAt: purchase.createdAt.toISOString(),
        items: purchase.items.map(item => ({
            ...item,
            unitCost: item.unitCost.toString(),
            totalCost: item.totalCost.toString(),
            product: {
                ...item.product,
                cuttingCost: item.product.cuttingCost ? item.product.cuttingCost.toString() : "0",
                stitchingCost: item.product.stitchingCost ? item.product.stitchingCost.toString() : "0",
                materialCost: item.product.materialCost ? item.product.materialCost.toString() : "0",
                costPrice: item.product.costPrice ? item.product.costPrice.toString() : "0",
                unitPrice: item.product.unitPrice ? item.product.unitPrice.toString() : "0",
            }
        })),
        payments: purchase.payments.map(payload => ({
            ...payload,
            amount: payload.amount.toString(),
        })),
        supplierRel: purchase.supplierRel ? {
            id: purchase.supplierRel.id,
            name: purchase.supplierRel.name
        } : null
    }));

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
                        <ShoppingCart size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Purchase Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Record new stock purchases and manage supplier invoices.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ px: 3 }}>
                <PurchaseManagementClient
                    products={serializedProducts}
                    suppliers={serializedSuppliers}
                    banks={serializedBanks}
                    initialPurchases={serializedPurchases}
                />
            </Box>
        </Box>
    );
}
