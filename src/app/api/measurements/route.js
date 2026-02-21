import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get("customerId");

        if (customerId) {
            const measurements = await prisma.measurement.findMany({
                where: { customerId: parseInt(customerId) },
                orderBy: { takenAt: "desc" },
            });
            return NextResponse.json(measurements);
        }

        const measurements = await prisma.measurement.findMany({
            include: {
                customer: {
                    select: { name: true, phone: true }
                }
            },
            orderBy: { takenAt: "desc" },
        });
        return NextResponse.json(measurements);
    } catch (error) {
        console.error("Failed to fetch measurements:", error);
        return NextResponse.json(
            { error: "Failed to fetch measurements" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            customerId,
            unit,
            notes,
            // Shalwar Qameez
            qameez_lambai,
            bazoo,
            teera,
            galaa,
            chaati,
            gheera,
            kaf,
            shalwar_lambai,
            puhncha,
            shalwar_gheera,
            chaati_around,
            kamar_around,
            hip_around,
            kandha,
            // Wskot
            wskot_lambai,
            wskot_teera,
            wskot_gala,
            wskot_chaati,
            wskot_kamar,
            wskot_hip
        } = body;

        if (!customerId) {
            return NextResponse.json(
                { error: "Customer ID is required" },
                { status: 400 }
            );
        }

        const measurement = await prisma.measurement.create({
            data: {
                customerId: parseInt(customerId),
                unit: unit || "in",
                notes,
                qameez_lambai: qameez_lambai ? parseFloat(qameez_lambai) : null,
                bazoo: bazoo ? parseFloat(bazoo) : null,
                teera: teera ? parseFloat(teera) : null,
                galaa: galaa ? parseFloat(galaa) : null,
                chaati: chaati ? parseFloat(chaati) : null,
                gheera: gheera ? parseFloat(gheera) : null,
                kaf: kaf ? parseFloat(kaf) : null,
                shalwar_lambai: shalwar_lambai ? parseFloat(shalwar_lambai) : null,
                puhncha: puhncha ? parseFloat(puhncha) : null,
                shalwar_gheera: shalwar_gheera ? parseFloat(shalwar_gheera) : null,
                chaati_around: chaati_around ? parseFloat(chaati_around) : null,
                kamar_around: kamar_around ? parseFloat(kamar_around) : null,
                hip_around: hip_around ? parseFloat(hip_around) : null,
                kandha: kandha ? parseFloat(kandha) : null,
                wskot_lambai: wskot_lambai ? parseFloat(wskot_lambai) : null,
                wskot_teera: wskot_teera ? parseFloat(wskot_teera) : null,
                wskot_gala: wskot_gala ? parseFloat(wskot_gala) : null,
                wskot_chaati: wskot_chaati ? parseFloat(wskot_chaati) : null,
                wskot_kamar: wskot_kamar ? parseFloat(wskot_kamar) : null,
                wskot_hip: wskot_hip ? parseFloat(wskot_hip) : null,
            },
        });

        return NextResponse.json(measurement, { status: 201 });
    } catch (error) {
        console.error("Failed to create measurement:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Measurement ID is required" },
                { status: 400 }
            );
        }

        // Clean up data for update
        const updateData = {};
        const fields = [
            'unit', 'notes', 'qameez_lambai', 'bazoo', 'teera', 'galaa', 'chaati',
            'gheera', 'kaf', 'shalwar_lambai', 'puhncha', 'shalwar_gheera',
            'chaati_around', 'kamar_around', 'hip_around', 'kandha',
            'wskot_lambai', 'wskot_teera', 'wskot_gala', 'wskot_chaati',
            'wskot_kamar', 'wskot_hip'
        ];

        fields.forEach(field => {
            if (data[field] !== undefined) {
                if (field === 'unit' || field === 'notes') {
                    updateData[field] = data[field];
                } else {
                    updateData[field] = data[field] === "" || data[field] === null ? null : parseFloat(data[field]);
                }
            }
        });

        const updatedMeasurement = await prisma.measurement.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        return NextResponse.json(updatedMeasurement);
    } catch (error) {
        console.error("Failed to update measurement:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Measurement ID is required" },
                { status: 400 }
            );
        }

        await prisma.measurement.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Measurement deleted successfully" });
    } catch (error) {
        console.error("Failed to delete measurement:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
