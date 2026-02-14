import prisma from "@/lib/prisma";
import BookingManagementClient from "./BookingManagementClient";
import { Box } from "@mui/material";
import { Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Booking Management | TailorFlow",
    description: "Manage suit and stitching bookings with product billing.",
};

async function getBookings() {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                customer: {
                    select: { id: true, name: true, phone: true, email: true }
                },
                tailor: {
                    select: { id: true, name: true, role: true }
                },
                cutter: {
                    select: { id: true, name: true, role: true }
                },
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, sku: true }
                        }
                    }
                }
            },
            orderBy: { bookingDate: "desc" },
        });
        return JSON.parse(JSON.stringify(bookings));
    } catch (error) {
        console.error("Database error fetching bookings:", error);
        return [];
    }
}

async function getCustomers() {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, phone: true }
        });
        return customers;
    } catch (error) {
        console.error("Database error fetching customers:", error);
        return [];
    }
}

async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            where: { quantity: { gt: 0 } },
            orderBy: { name: "asc" },
            select: { id: true, name: true, sku: true, unitPrice: true, quantity: true, category: { select: { name: true } } }
        });
        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error("Database error fetching products:", error);
        return [];
    }
}

async function getEmployees() {
    try {
        const employees = await prisma.employee.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, role: true }
        });
        return employees;
    } catch (error) {
        console.error("Database error fetching employees:", error);
        return [];
    }
}

export default async function BookingsPage() {
    const bookings = await getBookings();
    const customers = await getCustomers();
    const products = await getProducts();
    const employees = await getEmployees();

    return (
        <div className="space-y-6">
            <Box sx={{ mb: 4, px: 3, pt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{
                        p: 1.5,
                        bgcolor: '#f5f3ff',
                        borderRadius: 3,
                        color: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Calendar size={28} />
                    </Box>
                    <Box>
                        <h1 className="text-3xl font-bold text-zinc-900">Booking Management</h1>
                        <p className="text-zinc-500 mt-1">Create bookings with product billing and team assignment.</p>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ px: 3 }}>
                <BookingManagementClient
                    initialBookings={bookings}
                    customers={customers}
                    products={products}
                    employees={employees}
                />
            </Box>
        </div>
    );
}
