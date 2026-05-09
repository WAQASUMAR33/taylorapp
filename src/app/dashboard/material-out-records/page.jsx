import prisma from "@/lib/prisma";
import StockOutRecordsClient from "./StockOutRecordsClient";
import { Box, Typography } from "@mui/material";
import { TrendingDown } from "lucide-react";

export const metadata = {
    title: "Stock Out Records | GRACE TAILORS",
};

export default async function StockOutRecordsPage() {
    const [movements, materials] = await Promise.all([
        prisma.materialmovement.findMany({
            where: { type: "OUT" },
            orderBy: { movedAt: "desc" },
            include: {
                material: {
                    select: { id: true, title: true, price: true },
                },
            },
        }),
        prisma.material.findMany({
            orderBy: { title: "asc" },
            select: { id: true, title: true },
        }),
    ]);

    const serializedRecords = movements.map((mv) => ({
        ...mv,
        quantity: parseFloat(mv.quantity.toString()),
        movedAt: mv.movedAt.toISOString(),
        createdAt: mv.createdAt.toISOString(),
        material: {
            ...mv.material,
            price: parseFloat(mv.material.price.toString()),
        },
    }));

    return (
        <Box sx={{ width: "100%" }}>
            <Box
                sx={{
                    py: 3,
                    px: 3,
                    mb: 3,
                    bgcolor: "background.paper",
                    borderBottom: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                        sx={{
                            p: 1.5,
                            bgcolor: "error.light",
                            borderRadius: 3,
                            color: "error.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <TrendingDown size={28} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Stock Out Records
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Full history of all material stock-out transactions.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ px: 3 }}>
                <StockOutRecordsClient initialRecords={serializedRecords} materials={materials} />
            </Box>
        </Box>
    );
}
