import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all account categories or specific category
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (id) {
            const category = await prisma.accountCategory.findUnique({
                where: { id: parseInt(id) },
                include: {
                    _count: {
                        select: { customers: true }
                    }
                }
            });
            return NextResponse.json(category);
        }

        const categories = await prisma.accountCategory.findMany({
            include: {
                _count: {
                    select: { customers: true }
                }
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching account categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch account categories" },
            { status: 500 }
        );
    }
}

// POST - Create new account category
export async function POST(request) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        const category = await prisma.accountCategory.create({
            data: { name },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error creating account category:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create account category" },
            { status: 500 }
        );
    }
}

// PUT - Update account category
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (isActive !== undefined) updateData.isActive = isActive;

        const category = await prisma.accountCategory.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating account category:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update account category" },
            { status: 500 }
        );
    }
}

// DELETE - Delete account category
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        // Check if category has customers
        const category = await prisma.accountCategory.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: { customers: true }
                }
            }
        });

        if (category && category._count.customers > 0) {
            return NextResponse.json(
                { error: `Cannot delete category. ${category._count.customers} customer(s) are using this category.` },
                { status: 400 }
            );
        }

        await prisma.accountCategory.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting account category:", error);
        return NextResponse.json(
            { error: "Failed to delete account category" },
            { status: 500 }
        );
    }
}
