import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const branchId = parseInt(id);

        const branch = await prisma.branch.findUnique({
            where: { id: branchId },
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
            }
        });

        if (!branch) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }

        return NextResponse.json(branch);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch branch" }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "MANAGER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const branchId = parseInt(id);

        const body = await req.json();
        const { name, code, phone, address, slogan, logo, notes, isActive } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
        }

        const trimmedName = name.trim();
        const trimmedCode = code && code.trim() ? code.trim().toUpperCase() : null;

        // Check for duplicates excluding self
        const existing = await prisma.branch.findFirst({
            where: {
                id: { not: branchId },
                OR: [
                    { name: trimmedName },
                    ...(trimmedCode ? [{ code: trimmedCode }] : [])
                ]
            }
        });

        if (existing) {
            return NextResponse.json(
                { error: existing.name === trimmedName ? "Another branch with this name already exists" : "Another branch with this code already exists" },
                { status: 400 }
            );
        }

        const branch = await prisma.branch.update({
            where: { id: branchId },
            data: {
                name: trimmedName,
                code: trimmedCode,
                phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
                address: address !== undefined ? (address ? address.trim() : null) : undefined,
                slogan: slogan !== undefined ? (slogan ? slogan.trim() : null) : undefined,
                logo: logo !== undefined ? (logo ? logo.trim() : null) : undefined,
                notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined,
                isActive: isActive !== undefined ? Boolean(isActive) : undefined,
            }
        });

        return NextResponse.json(branch);
    } catch (error) {
        console.error("Failed to update branch:", error);
        return NextResponse.json({ error: error.message || "Failed to update branch" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
        }

        const { id } = await params;
        const branchId = parseInt(id);

        // Check if branch has linked records
        const counts = await prisma.branch.findUnique({
            where: { id: branchId },
            select: {
                _count: {
                    select: {
                        users: true,
                        customers: true,
                        bookings: true,
                        ledgerEntries: true,
                        receivings: true,
                    }
                }
            }
        });

        const totalRecords = (counts?._count?.users || 0) +
            (counts?._count?.customers || 0) +
            (counts?._count?.bookings || 0) +
            (counts?._count?.ledgerEntries || 0) +
            (counts?._count?.receivings || 0);

        if (totalRecords > 0) {
            // Soft deactivate instead of deleting to preserve referential integrity
            await prisma.branch.update({
                where: { id: branchId },
                data: { isActive: false }
            });
            return NextResponse.json({
                message: "Branch has linked records. It was deactivated instead of deleted."
            });
        }

        await prisma.branch.delete({ where: { id: branchId } });
        return NextResponse.json({ message: "Branch deleted successfully" });
    } catch (error) {
        console.error("Failed to delete branch:", error);
        return NextResponse.json({ error: error.message || "Failed to delete branch" }, { status: 500 });
    }
}
