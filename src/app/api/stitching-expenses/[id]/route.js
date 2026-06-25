import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req, { params }) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        const body = await req.json();
        const { titleId, date, amount, description } = body;

        if (!titleId || !date || !amount) {
            return NextResponse.json(
                { error: "Title, date, and amount are required" },
                { status: 400 }
            );
        }

        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return NextResponse.json(
                { error: "Amount must be a positive number" },
                { status: 400 }
            );
        }

        const expense = await prisma.stitchingExpense.update({
            where: { id },
            data: {
                titleId: parseInt(titleId),
                date: new Date(date),
                amount: parseFloat(amount),
                description: description || null,
            },
            include: {
                title: { select: { id: true, name: true } },
                addedByUser: { select: { id: true, fullName: true } },
            },
        });

        return NextResponse.json({
            ...expense,
            amount: expense.amount.toString(),
            date: expense.date.toISOString(),
            createdAt: expense.createdAt.toISOString(),
            updatedAt: expense.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error("Failed to update stitching expense:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        await prisma.stitchingExpense.delete({ where: { id } });

        return NextResponse.json({ message: "Stitching expense deleted successfully" });
    } catch (error) {
        console.error("Failed to delete stitching expense:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
