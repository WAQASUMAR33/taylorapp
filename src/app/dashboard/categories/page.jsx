import prisma from "@/lib/prisma";
import CategoryManagementClient from "./CategoryManagementClient";
import Layout from "../layout"; // Assuming it inherits from dashboard layout if needed, or just use typography

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

    // Serialize Decimal or other complex types if any (DateTime is fine for JSON)
    const serializedCategories = JSON.parse(JSON.stringify(categories));

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900">Category Management</h1>
                <p className="text-zinc-500 mt-1">Organize your products and materials into structured categories.</p>
            </div>

            <CategoryManagementClient initialCategories={serializedCategories} />
        </div>
    );
}
