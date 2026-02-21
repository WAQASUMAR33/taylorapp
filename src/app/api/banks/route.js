import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const banks = await prisma.bank.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(banks);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, accountNumber, branch, balance } = body;

        const bank = await prisma.bank.create({
            data: {
                name,
                accountNumber,
                branch,
                balance: parseFloat(balance) || 0,
                isActive: true
            }
        });

        return NextResponse.json(bank, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, name, accountNumber, branch, balance, isActive } = body;

        const bank = await prisma.bank.update({
            where: { id: parseInt(id) },
            data: {
                name,
                accountNumber,
                branch,
                balance: parseFloat(balance) || 0,
                isActive
            }
        });

        return NextResponse.json(bank);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        await prisma.bank.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: "Bank deleted" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
