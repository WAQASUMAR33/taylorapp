import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        const body = await req.json();
        const { fullName, username, email, phone, role, password, permissions } = body;

        if (!fullName || !username || !password) {
            return NextResponse.json(
                { error: "Full name, username and password are required" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                fullName,
                username,
                email,
                phone,
                role: role || 'STAFF',
                passwordHash: hashedPassword,
                isActive: true,
                permissions: permissions || null,
            },
        });

        const { passwordHash, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (error) {
        console.error("Failed to create user:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "Username or Email already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, fullName, username, email, phone, role, password, isActive, permissions } = body;

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const updateData = {
            fullName,
            username,
            email,
            phone,
            role,
            isActive: isActive !== undefined ? isActive : true,
        };

        if (permissions !== undefined) {
            updateData.permissions = permissions;
        }

        if (password && password.trim() !== "") {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        const { passwordHash, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error("Failed to update user:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "Username or Email already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        await prisma.user.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
