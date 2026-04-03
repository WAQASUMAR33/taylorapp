import prisma from "@/lib/prisma";
import SaleListClient from "./SaleListClient";
import { Box, Typography } from "@mui/material";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Sale History | RAPID TAILOR",
    description: "View all sales, bills and revenue statistics.",
};

export default async function SaleListPage() {
    const bills = await prisma.bill.findMany({
        include: {
            customer: { select: { id: true, name: true, phone: true } },
            items: {
                include: {
                    product: { select: { id: true, name: true, sku: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
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
                            All bills, revenue stats and date-range filters.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <SaleListClient initialBills={JSON.parse(JSON.stringify(bills))} />
        </Box>
    );
}
