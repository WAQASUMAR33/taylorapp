import prisma from "@/lib/prisma";
import SaleListClient from "./SaleListClient";
import { Box, Typography } from "@mui/material";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Sale History | GRACE TAILORS",
    description: "View all product sales from bookings.",
};

export default async function SaleListPage() {
    // Fetch bookings that contain at least one product item
    const bookings = await prisma.booking.findMany({
        where: {
            items: { some: { productId: { not: null } } }
        },
        include: {
            customer: { select: { id: true, name: true, phone: true } },
            items: {
                where: { productId: { not: null } },
                include: {
                    product: { select: { id: true, name: true, sku: true } }
                }
            }
        },
        orderBy: { bookingDate: "desc" },
    });

    // Transform bookings into the bill-shaped records the client expects
    const bills = bookings.map((b) => {
        const items = b.items.map((i) => ({
            id: i.id,
            quantity: parseFloat(i.quantity.toString()),
            unitPrice: parseFloat(i.unitPrice.toString()),
            discount: parseFloat((i.discount || 0).toString()),
            total: parseFloat(i.totalPrice.toString()),
            product: i.product,
        }));

        const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        const discount = items.reduce((s, i) => s + i.discount, 0);
        const total = items.reduce((s, i) => s + i.total, 0);

        return {
            id: b.id,
            billNumber: b.bookingNumber || `BK-${b.id}`,
            createdAt: b.bookingDate,
            customerId: b.customerId,
            customer: b.customer,
            items,
            subtotal,
            discount,
            total,
            notes: b.notes || null,
        };
    });

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{
                py: 3, px: 3, mb: 3,
                bgcolor: "background.paper",
                borderBottom: 1, borderColor: "divider",
                borderRadius: 2,
                boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: "primary.light", borderRadius: 3, color: "primary.main", display: "flex", alignItems: "center" }}>
                        <ClipboardList size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">Sale History</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Product sales from bookings — revenue stats and date-range filters.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <SaleListClient initialBills={bills} />
        </Box>
    );
}
