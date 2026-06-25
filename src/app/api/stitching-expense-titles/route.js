import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all stitching expense titles
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (id) {
            const title = await prisma.stitchingExpenseTitle.findUnique({
                where: { id: parseInt(id) },
                include: {
                    _count: {
                        select: { expenses: true }
                    }
                }
            });
            return NextResponse.json(title);
        }

        const titles = await prisma.stitchingExpenseTitle.findMany({
            include: {
                _count: {
                    select: { expenses: true }
                }
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(titles);
    } catch (error) {
        console.error("Error fetching stitching expense titles:", error);
        return NextResponse.json(
            { error: "Failed to fetch stitching expense titles" },
            { status: 500 }
        );
    }
}

// POST - Create new stitching expense title
export async function POST(request) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "Title name is required" },
                { status: 400 }
            );
        }

        const title = await prisma.stitchingExpenseTitle.create({
            data: { name: name.trim() },
            include: {
                _count: {
                    select: { expenses: true }
                }
            }
        });

        return NextResponse.json(title, { status: 201 });
    } catch (error) {
        console.error("Error creating stitching expense title:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A title with this name already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create stitching expense title" },
            { status: 500 }
        );
    }
}

// PUT - Update stitching expense title
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Title ID is required" },
                { status: 400 }
            );
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (isActive !== undefined) updateData.isActive = isActive;

        const title = await prisma.stitchingExpenseTitle.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                _count: {
                    select: { expenses: true }
                }
            }
        });

        return NextResponse.json(title);
    } catch (error) {
        console.error("Error updating stitching expense title:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A title with this name already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update stitching expense title" },
            { status: 500 }
        );
    }
}

// DELETE - Delete stitching expense title
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Title ID is required" },
                { status: 400 }
            );
        }

        // Check if title has associated expenses
        const title = await prisma.stitchingExpenseTitle.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: { expenses: true }
                }
            }
        });

        if (title && title._count.expenses > 0) {
            return NextResponse.json(
                { error: `Cannot delete title. ${title._count.expenses} expense(s) are using this title.` },
                { status: 400 }
            );
        }

        await prisma.stitchingExpenseTitle.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Title deleted successfully" });
    } catch (error) {
        console.error("Error deleting stitching expense title:", error);
        return NextResponse.json(
            { error: "Failed to delete stitching expense title" },
            { status: 500 }
        );
    }
}
