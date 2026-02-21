import prisma from "@/lib/prisma";
import BookingManagementClient from "../bookings/BookingManagementClient";
import { Container, Box, Typography } from "@mui/material";
import { Scissors } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Stitching Orders | TailorFlow",
    description: "Manage bookings with booking type 'STITCHING'.",
};

async function getBookings() {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                bookingType: 'STITCHING'
            },
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
            select: { id: true, name: true, sku: true, unitPrice: true, quantity: true }
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

export default async function StitchingOrdersPage() {
    const bookings = await getBookings();
    const customers = await getCustomers();
    const products = await getProducts();
    const employees = await getEmployees();

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{
                py: 1.5,
                px: 3,
                mb: 3,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 1,
                        bgcolor: '#3b82f6',
                        borderRadius: 2,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Scissors size={22} color="white" />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Stitching Orders
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            All bookings marked specifically for &apos;Stitching&apos;.
                        </Typography>
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
        </Box>
    );
}
