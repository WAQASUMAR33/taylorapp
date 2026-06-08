import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req, { params }) {
    try {
        const id = parseInt(params.id);
        const body = await req.json();
        const { title, date, amount, description } = body;

        if (!title || !date || !amount) {
            return NextResponse.json(
                { error: "Title, date, and amount are required" },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                title,
                date: new Date(date),
                amount: parseFloat(amount),
                description: description || null,
            },
            include: {
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
        console.error("Failed to update expense:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const id = parseInt(params.id);

        await prisma.expense.delete({ where: { id } });

        return NextResponse.json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Failed to delete expense:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
