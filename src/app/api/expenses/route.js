import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const title = searchParams.get("title");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        const where = {};
        if (title) {
            where.title = { contains: title };
        }
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                where.date.lte = end;
            }
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                addedByUser: { select: { id: true, fullName: true } },
            },
            orderBy: { date: "desc" },
        });

        const serialized = expenses.map((e) => ({
            ...e,
            amount: e.amount.toString(),
            date: e.date.toISOString(),
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
        }));

        return NextResponse.json(serialized);
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();
        const { title, date, amount, description } = body;

        if (!title || !date || !amount) {
            return NextResponse.json(
                { error: "Title, date, and amount are required" },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.create({
            data: {
                title,
                date: new Date(date),
                amount: parseFloat(amount),
                description: description || null,
                addedBy: session?.user?.id ? parseInt(session.user.id) : null,
            },
            include: {
                addedByUser: { select: { id: true, fullName: true } },
            },
        });

        return NextResponse.json(
            {
                ...expense,
                amount: expense.amount.toString(),
                date: expense.date.toISOString(),
                createdAt: expense.createdAt.toISOString(),
                updatedAt: expense.updatedAt.toISOString(),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create expense:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
