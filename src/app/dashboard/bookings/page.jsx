import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BookingManagementClient from "./BookingManagementClient";
import { Box, Container, Typography, Paper } from "@mui/material";
import { Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Booking Management | GRACE TAILORS",
    description: "Manage suit and stitching bookings with product billing.",
};

async function getBookings(branchId = null) {
    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const where = {
            bookingDate: {
                gte: new Date(`${todayStr}T00:00:00.000Z`),
                lte: new Date(`${todayStr}T23:59:59.999Z`),
            }
        };

        if (branchId) {
            where.branchId = branchId;
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                branch: true,
                customer: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        phone: true,
                        email: true,
                        address: true,
                        balance: true,
                        measurementNo: true,
                        measurements: {
                            orderBy: { takenAt: "desc" },
                            take: 1
                        }
                    }
                },
                tailor: {
                    select: { id: true, name: true, accountCategory: { select: { name: true } } }
                },
                cutter: {
                    select: { id: true, name: true, accountCategory: { select: { name: true } } }
                },
                staff: {
                    include: {
                        customer: {
                            select: { id: true, name: true, accountCategory: { select: { name: true } } }
                        }
                    }
                },
                billingCustomer: {
                    select: { id: true, code: true, name: true, phone: true, address: true, balance: true }
                },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                        selectedOptions: { include: { stitchingOption: true } }
                    }
                },
                ledgerEntries: {
                    select: {
                        id: true,
                        type: true,
                        amount: true,
                        description: true,
                        entryDate: true,
                        customerId: true
                    },
                    orderBy: { entryDate: "desc" }
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
            take: 100,
            select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                measurementNo: true,
                balance: true,
                measurements: {
                    orderBy: { takenAt: "desc" },
                    take: 1
                }
            }
        });
        return JSON.parse(JSON.stringify(customers));
    } catch (error) {
        console.error("Database error fetching customers:", error);
        return [];
    }
}

async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, sku: true, unitPrice: true, quantity: true }
        });
        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error("Database error fetching products:", error);
        return [];
    }
}

async function getStitchingOptions() {
    try {
        const options = await prisma.stitching_option.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "asc" }
        });
        return JSON.parse(JSON.stringify(options));
    } catch (error) {
        console.error("Database error fetching stitching options:", error);
        return [];
    }
}

async function getStaffCustomers() {
    try {
        const staff = await prisma.customer.findMany({
            where: {
                accountCategory: {
                    name: { in: ["Tailor", "Cutter", "tailor", "cutter", "TAILOR", "CUTTER"] }
                }
            },
            orderBy: { name: "asc" },
            select: { id: true, name: true, accountCategory: { select: { name: true } } }
        });
        return JSON.parse(JSON.stringify(staff));
    } catch (error) {
        console.error("Database error fetching staff customers:", error);
        return [];
    }
}

async function getBanks() {
    try {
        const banks = await prisma.bank.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, accountNumber: true, branch: true }
        });
        return JSON.parse(JSON.stringify(banks));
    } catch (error) {
        console.error("Database error fetching banks:", error);
        return [];
    }
}

async function getBranches() {
    try {
        const branches = await prisma.branch.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, code: true }
        });
        return JSON.parse(JSON.stringify(branches));
    } catch (error) {
        console.error("Database error fetching branches:", error);
        return [];
    }
}

export default async function BookingsPage() {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN";
    const userBranchId = session?.user?.branchId;
    const branches = await getBranches();
    const initialBranchFilter = userBranchId || (branches[0]?.id || null);

    const [bookings, customers, products, employees, stitchingOptions, banks] = await Promise.all([
        getBookings(initialBranchFilter),
        getCustomers(),
        getProducts(),
        getStaffCustomers(),
        getStitchingOptions(),
        getBanks(),
    ]);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{
                py: 3,
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
                        p: 1.5,
                        bgcolor: 'primary.lighter',
                        backgroundColor: '#eff6ff',
                        borderRadius: 2,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Calendar size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Booking Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Create bookings with product billing and team assignment.
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
                    stitchingOptions={stitchingOptions}
                    banks={banks}
                    branches={branches}
                    userBranchId={userBranchId}
                />
            </Box>
        </Box>
    );
}
