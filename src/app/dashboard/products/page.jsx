import prisma from "@/lib/prisma";
import ProductManagementClient from "./ProductManagementClient";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Product Management | TailorFlow",
    description: "Manage your inventory, prices, and product details.",
};

async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: {
                    select: { name: true }
                }
            },
            orderBy: { name: "asc" },
        });
        // Convert Decimal to string/number for serialization
        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
        });
        return categories;
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
}

export default async function ProductManagementPage() {
    const products = await getProducts();
    const categories = await getCategories();

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900">Product Management</h1>
                <p className="text-zinc-500 mt-1">Manage your inventory, prices, and product details.</p>
            </div>

            <ProductManagementClient initialProducts={products} categories={categories} />
        </div>
    );
}
