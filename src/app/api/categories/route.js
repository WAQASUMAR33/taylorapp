import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({
            data: {
                name,
                description,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Failed to create category:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A category with this name already exists" },
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
        const { id, name, description } = body;

        if (!id || !name) {
            return NextResponse.json(
                { error: "ID and Name are required" },
                { status: 400 }
            );
        }

        const updatedCategory = await prisma.category.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
            },
        });

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error("Failed to update category:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A category with this name already exists" },
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
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        // Check if category is being used by any products
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: { _count: { select: { products: true } } }
        });

        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        if (category._count.products > 0) {
            return NextResponse.json(
                { error: `Cannot delete category "${category.name}" because it has ${category._count.products} product(s) assigned to it.` },
                { status: 400 }
            );
        }

        await prisma.category.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Failed to delete category:", error);
        return NextResponse.json(
            { error: "Failed to delete category: " + error.message, details: error.stack },
            { status: 500 }
        );
    }
}
