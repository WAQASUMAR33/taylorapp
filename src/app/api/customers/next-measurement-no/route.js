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

        const maxResult = await prisma.$queryRawUnsafe(`
            SELECT MAX(CAST(measurementNo AS UNSIGNED)) AS maxNo 
            FROM customer 
            WHERE measurementNo IS NOT NULL 
              AND measurementNo REGEXP '^[0-9]+$' 
              AND CAST(measurementNo AS UNSIGNED) < 1000000000
        `);

        let nextNum = (maxResult[0]?.maxNo != null ? Number(maxResult[0].maxNo) : 0) + 1;
        while (await prisma.customer.findFirst({ where: { measurementNo: String(nextNum) }, select: { id: true } })) {
            nextNum++;
        }

        return NextResponse.json({
            nextMeasurementNo: String(nextNum),
            highestNo: maxResult[0]?.maxNo != null ? Number(maxResult[0].maxNo) : 0,
        });
    } catch (error) {
        console.error("Failed to get next measurement number:", error);
        return NextResponse.json(
            { error: "Failed to calculate next measurement number" },
            { status: 500 }
        );
    }
}

