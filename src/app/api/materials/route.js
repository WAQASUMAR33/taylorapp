import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const materials = await prisma.material.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(materials);
    } catch (error) {
        console.error("Failed to fetch materials:", error);
        return NextResponse.json(
            { error: "Failed to fetch materials" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { title, quantity, price } = body;

        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        const material = await prisma.material.create({
            data: {
                title,
                quantity: parseFloat(quantity) || 0,
                price: parseFloat(price) || 0,
            },
        });

        // Track initial movement
        if (parseFloat(quantity) > 0) {
            await prisma.materialmovement.create({
                data: {
                    materialId: material.id,
                    type: "IN",
                    quantity: parseFloat(quantity),
                    notes: "Initial stock addition"
                }
            });
        }

        return NextResponse.json(material, { status: 201 });
    } catch (error) {
        console.error("Failed to create material:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
