import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
    try {
        const branches = await prisma.branch.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        customers: true,
                        bookings: true,
                        ledgerEntries: true,
                        receivings: true,
                    }
                }
            },
            orderBy: [{ isActive: "desc" }, { createdAt: "asc" }]
        });

        return NextResponse.json(branches);
    } catch (error) {
        console.error("Failed to fetch branches:", error);
        return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "MANAGER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { name, code, phone, address, slogan, logo, notes, isActive } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
        }

        const trimmedName = name.trim();
        const trimmedCode = code && code.trim() ? code.trim().toUpperCase() : null;

        // Check if name or code already exists
        const existing = await prisma.branch.findFirst({
            where: {
                OR: [
                    { name: trimmedName },
                    ...(trimmedCode ? [{ code: trimmedCode }] : [])
                ]
            }
        });

        if (existing) {
            return NextResponse.json(
                { error: existing.name === trimmedName ? "A branch with this name already exists" : "A branch with this code already exists" },
                { status: 400 }
            );
        }

        const branch = await prisma.branch.create({
            data: {
                name: trimmedName,
                code: trimmedCode,
                phone: phone ? phone.trim() : null,
                address: address ? address.trim() : null,
                slogan: slogan ? slogan.trim() : null,
                logo: logo ? logo.trim() : null,
                notes: notes ? notes.trim() : null,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
            }
        });

        return NextResponse.json(branch, { status: 201 });
    } catch (error) {
        console.error("Failed to create branch:", error);
        return NextResponse.json({ error: error.message || "Failed to create branch" }, { status: 500 });
    }
}
