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
        const measurementNo = searchParams.get("measurementNo") || searchParams.get("no") || "";
        const excludeId = searchParams.get("excludeId");

        const trimmed = measurementNo.trim();
        if (!trimmed) {
            return NextResponse.json({ exists: false });
        }

        const whereClause = {
            measurementNo: trimmed,
        };

        if (excludeId && !isNaN(parseInt(excludeId))) {
            whereClause.id = { not: parseInt(excludeId) };
        }

        const existing = await prisma.customer.findFirst({
            where: whereClause,
            select: { id: true, name: true, measurementNo: true },
        });

        if (existing) {
            return NextResponse.json({
                exists: true,
                message: "The number already exists, use another",
                customer: { id: existing.id, name: existing.name },
            });
        }

        return NextResponse.json({ exists: false });
    } catch (error) {
        console.error("Failed to check measurement number:", error);
        return NextResponse.json(
            { error: "Failed to check measurement number" },
            { status: 500 }
        );
    }
}

