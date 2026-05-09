import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // "IN" | "OUT" | null (all)

        const where = type ? { type } : {};

        const movements = await prisma.materialmovement.findMany({
            where,
            orderBy: { movedAt: "desc" },
            include: {
                material: {
                    select: { id: true, title: true, price: true },
                },
            },
        });

        const serialized = movements.map((mv) => ({
            ...mv,
            quantity: parseFloat(mv.quantity.toString()),
            material: {
                ...mv.material,
                price: parseFloat(mv.material.price.toString()),
            },
        }));

        return NextResponse.json(serialized);
    } catch (error) {
        console.error("Failed to fetch material movements:", error);
        return NextResponse.json(
            { error: "Failed to fetch material movements" },
            { status: 500 }
        );
    }
}
