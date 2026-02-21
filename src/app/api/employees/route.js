import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, fatherName, role, phone, address, salary, isActive } = body;

        if (!name || !role) {
            return NextResponse.json(
                { error: "Name and Role are required" },
                { status: 400 }
            );
        }

        const employee = await prisma.employee.create({
            data: {
                name,
                fatherName,
                role,
                phone,
                address,
                salary: salary ? parseFloat(salary) : 0,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json(employee, { status: 201 });
    } catch (error) {
        console.error("Failed to create employee:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const employees = await prisma.employee.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch employees" },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, name, fatherName, role, phone, address, salary, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Employee ID is required" },
                { status: 400 }
            );
        }

        const updatedEmployee = await prisma.employee.update({
            where: { id: parseInt(id) },
            data: {
                name,
                fatherName,
                role,
                phone,
                address,
                salary: salary ? parseFloat(salary) : 0,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json(updatedEmployee);
    } catch (error) {
        console.error("Failed to update employee:", error);
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
                { error: "Employee ID is required" },
                { status: 400 }
            );
        }

        // Check if employee is assigned to any bookings (as Tailor or Cutter)
        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: {
                        tailorBookings: true,
                        cutterBookings: true
                    }
                }
            }
        });

        if (employee?._count.tailorBookings > 0 || employee?._count.cutterBookings > 0) {
            return NextResponse.json(
                { error: "Cannot delete employee who is assigned to bookings" },
                { status: 400 }
            );
        }

        await prisma.employee.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Failed to delete employee:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
