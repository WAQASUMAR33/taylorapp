import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getNextMeasurementNo, getRandomAvailableMeasurementNo } from "@/lib/measurementHelper";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const isRandom = searchParams.get("random") === "true";

        if (isRandom) {
            const randomNo = await getRandomAvailableMeasurementNo();
            return NextResponse.json({
                nextMeasurementNo: randomNo,
                isRandom: true,
            });
        }

        const maxResult = await prisma.$queryRawUnsafe(`
            SELECT MAX(CAST(measurementNo AS UNSIGNED)) AS maxNo 
            FROM customer 
            WHERE measurementNo IS NOT NULL 
              AND measurementNo REGEXP '^[0-9]+$' 
              AND CAST(measurementNo AS UNSIGNED) < 1000000000
        `);

        const highestNo = maxResult[0]?.maxNo != null ? Number(maxResult[0].maxNo) : 0;
        const nextMeasurementNo = await getNextMeasurementNo();

        return NextResponse.json({
            nextMeasurementNo,
            highestNo,
        });
    } catch (error) {
        console.error("Failed to get next measurement number:", error);
        return NextResponse.json(
            { error: "Failed to calculate next measurement number" },
            { status: 500 }
        );
    }
}
