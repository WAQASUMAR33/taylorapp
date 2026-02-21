import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: {
                    select: { name: true }
                }
            },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { sku, name, description, categoryId, quantity, costPrice, unitPrice, cuttingCost, stitchingCost, materialCost } = body;

        if (!sku || !name) {
            return NextResponse.json(
                { error: "SKU and Name are required" },
                { status: 400 }
            );
        }

        const product = await prisma.product.create({
            data: {
                sku,
                name,
                description,
                categoryId: categoryId ? parseInt(categoryId) : null,
                quantity: quantity ? parseInt(quantity) : 0,
                costPrice: costPrice ? parseFloat(costPrice) : null,
                unitPrice: unitPrice ? parseFloat(unitPrice) : null,
                cuttingCost: cuttingCost ? parseFloat(cuttingCost) : null,
                stitchingCost: stitchingCost ? parseFloat(stitchingCost) : null,
                materialCost: materialCost ? parseFloat(materialCost) : null,
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Failed to create product:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A product with this SKU already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, sku, name, description, categoryId, quantity, costPrice, unitPrice, cuttingCost, stitchingCost, materialCost } = body;

        if (!id || !sku || !name) {
            return NextResponse.json(
                { error: "ID, SKU and Name are required" },
                { status: 400 }
            );
        }

        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                sku,
                name,
                description,
                categoryId: categoryId ? parseInt(categoryId) : null,
                quantity: quantity ? parseInt(quantity) : 0,
                costPrice: costPrice ? parseFloat(costPrice) : null,
                unitPrice: unitPrice ? parseFloat(unitPrice) : null,
                cuttingCost: cuttingCost ? parseFloat(cuttingCost) : null,
                stitchingCost: stitchingCost ? parseFloat(stitchingCost) : null,
                materialCost: materialCost ? parseFloat(materialCost) : null,
            },
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("Failed to update product:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A product with this SKU already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        // Check if product is being used in any purchase items or booking items
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: {
                        purchaseItems: true,
                        bookingItems: true
                    }
                }
            }
        });

        if (product?._count.purchaseItems > 0 || product?._count.bookingItems > 0) {
            return NextResponse.json(
                { error: "Cannot delete product that has purchase or booking history" },
                { status: 400 }
            );
        }

        await prisma.product.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Failed to delete product:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
