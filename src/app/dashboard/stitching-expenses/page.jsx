import { Suspense } from "react";
import prisma from "@/lib/prisma";
import StitchingExpenseClient from "./StitchingExpenseClient";
import { Box, Typography } from "@mui/material";
import { Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Stitching Expenses | GRACE TAILORS",
    description: "Track and manage all stitching-related expenses.",
};

export default async function StitchingExpensesPage() {
    const [expenses, titles] = await Promise.all([
        prisma.stitchingExpense.findMany({
            include: {
                title: { select: { id: true, name: true } },
                addedByUser: { select: { id: true, fullName: true } },
            },
            orderBy: { date: "desc" },
        }),
        prisma.stitchingExpenseTitle.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        }),
    ]);

    const serializedExpenses = expenses.map((e) => ({
        ...e,
        amount: e.amount.toString(),
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
    }));

    const serializedTitles = JSON.parse(JSON.stringify(titles));

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
                    boxShadow:
                        "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                        sx={{
                            p: 1.5,
                            bgcolor: "primary.light",
                            borderRadius: 3,
                            color: "primary.main",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Receipt size={28} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Stitching Expenses
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Track and manage all stitching-related expenses.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Suspense fallback={<div>Loading...</div>}>
                <StitchingExpenseClient
                    initialExpenses={serializedExpenses}
                    expenseTitles={serializedTitles}
                />
            </Suspense>
        </Box>
    );
}
