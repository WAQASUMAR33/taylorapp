import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const idParam = searchParams.get("id");
        const excludeIdParam = searchParams.get("excludeId");

        if (!idParam || isNaN(parseInt(idParam))) {
            return NextResponse.json({ exists: false, error: "Invalid ID parameter" }, { status: 400 });
        }

        const idNum = parseInt(idParam);
        const whereClause = { id: idNum };

        if (excludeIdParam && !isNaN(parseInt(excludeIdParam))) {
            whereClause.id = { equals: idNum, not: parseInt(excludeIdParam) };
        }

        const existing = await prisma.customer.findUnique({
            where: { id: idNum },
            select: { id: true, name: true }
        });

        if (existing && (!excludeIdParam || existing.id !== parseInt(excludeIdParam))) {
            return NextResponse.json({
                exists: true,
                message: `Key #${idNum} is already assigned to customer '${existing.name}'`,
                customer: existing,
            });
        }

        return NextResponse.json({ exists: false, available: true });
    } catch (error) {
        console.error("Failed to check customer ID:", error);
        return NextResponse.json({ error: "Failed to check customer ID" }, { status: 500 });
    }
}

