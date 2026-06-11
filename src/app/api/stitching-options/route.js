import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const options = await prisma.stitching_option.findMany({
            orderBy: { createdAt: "asc" }
        });
        return NextResponse.json(options);
    } catch (error) {
        console.error("Failed to fetch stitching options:", error);
        return NextResponse.json({ error: "Failed to fetch stitching options" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { name, price, stitching_cost, material_cost } = await req.json();
        if (!name || price === undefined || price === null) {
            return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
        }
        const option = await prisma.stitching_option.create({
            data: {
                name: name.trim(),
                price: parseFloat(price),
                stitching_cost: stitching_cost !== undefined && stitching_cost !== null ? parseFloat(stitching_cost) : 0,
                material_cost: material_cost !== undefined && material_cost !== null ? parseFloat(material_cost) : 0
            }
        });
        return NextResponse.json(option, { status: 201 });
    } catch (error) {
        console.error("Failed to create stitching option:", error);
        return NextResponse.json({ error: "Failed to create stitching option" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const { id, name, price, stitching_cost, material_cost, isActive } = await req.json();
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }
        const data = {};
        if (name !== undefined) data.name = name.trim();
        if (price !== undefined) data.price = parseFloat(price);
        if (stitching_cost !== undefined) data.stitching_cost = parseFloat(stitching_cost);
        if (material_cost !== undefined) data.material_cost = parseFloat(material_cost);
        if (isActive !== undefined) data.isActive = isActive;

        const option = await prisma.stitching_option.update({
            where: { id: parseInt(id) },
            data
        });
        return NextResponse.json(option);
    } catch (error) {
        console.error("Failed to update stitching option:", error);
        return NextResponse.json({ error: "Failed to update stitching option" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }
        await prisma.stitching_option.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Failed to delete stitching option:", error);
        return NextResponse.json({ error: "Failed to delete stitching option" }, { status: 500 });
    }
}
