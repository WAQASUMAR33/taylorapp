import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNextCustomerId, getRandomAvailableCustomerId } from "@/lib/customerHelper";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const isRandom = searchParams.get("random") === "true";

        if (isRandom) {
            const randomId = await getRandomAvailableCustomerId();
            return NextResponse.json({
                nextId: randomId,
                isRandom: true,
            });
        }

        const maxResult = await prisma.$queryRawUnsafe("SELECT MAX(id) AS maxId FROM customer");
        const currentMax = maxResult[0]?.maxId != null ? Number(maxResult[0].maxId) : 0;
        const nextId = await getNextCustomerId();

        return NextResponse.json({
            currentMax,
            nextId,
        });
    } catch (error) {
        console.error("Failed to fetch next customer ID:", error);
        return NextResponse.json({ error: "Failed to generate next customer ID" }, { status: 500 });
    }
}

