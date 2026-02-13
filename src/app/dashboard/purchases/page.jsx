import prisma from "@/lib/prisma";
import PurchaseManagementClient from "./PurchaseManagementClient";

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
            }
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
        }))
    }));

    return (
        <div className="min-h-screen bg-zinc-50/50">
            <div className="pt-8 pb-6 bg-white border-b border-zinc-200">
                <div className="px-6">
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Purchase Management</h1>
                    <p className="text-zinc-500 mt-1">Record new stock purchases and manage supplier invoices.</p>
                </div>
            </div>

            <PurchaseManagementClient
                products={serializedProducts}
                suppliers={serializedSuppliers}
                banks={serializedBanks}
                initialPurchases={serializedPurchases}
            />
        </div>
    );
}
