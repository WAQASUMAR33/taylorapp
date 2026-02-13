import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const material = await prisma.material.findUnique({
            where: { id: parseInt(id) },
            include: { movements: { orderBy: { movedAt: "desc" } } }
        });

        if (!material) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        return NextResponse.json(material);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { title, quantity, price, adjustmentNotes } = body;

        const currentMaterial = await prisma.material.findUnique({
            where: { id: parseInt(id) }
        });

        if (!currentMaterial) {
            return NextResponse.json({ error: "Material not found" }, { status: 404 });
        }

        const newQuantity = quantity !== undefined ? parseFloat(quantity) : currentMaterial.quantity;
        const diff = parseFloat(newQuantity) - parseFloat(currentMaterial.quantity);

        const material = await prisma.material.update({
            where: { id: parseInt(id) },
            data: {
                title: title || currentMaterial.title,
                quantity: newQuantity,
                price: price !== undefined ? parseFloat(price) : currentMaterial.price,
            },
        });

        // Track movement if quantity changed
        if (diff !== 0) {
            await prisma.materialmovement.create({
                data: {
                    materialId: material.id,
                    type: diff > 0 ? "IN" : "OUT",
                    quantity: Math.abs(diff),
                    notes: adjustmentNotes || "Manual adjustment"
                }
            });
        }

        return NextResponse.json(material);
    } catch (error) {
        console.error("Failed to update material:", error);
        return NextResponse.json(
            { error: "Failed to update material" },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;

        // Optionally check if used anywhere (none for now)

        await prisma.materialmovement.deleteMany({
            where: { materialId: parseInt(id) }
        });

        await prisma.material.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Material deleted successfully" });
    } catch (error) {
        console.error("Failed to delete material:", error);
        return NextResponse.json(
            { error: "Failed to delete material" },
            { status: 500 }
        );
    }
}
