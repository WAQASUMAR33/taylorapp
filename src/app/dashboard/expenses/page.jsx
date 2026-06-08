import { Suspense } from "react";
import prisma from "@/lib/prisma";
import ExpenseManagementClient from "./ExpenseManagementClient";
import { Box, Typography } from "@mui/material";
import { Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Expenses | GRACE TAILORS",
};

export default async function ExpensesPage() {
    const expenses = await prisma.expense.findMany({
        include: {
            addedByUser: { select: { id: true, fullName: true } },
        },
        orderBy: { date: "desc" },
    });

    const serialized = expenses.map((e) => ({
        ...e,
        amount: e.amount.toString(),
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
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
                            Expenses
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Track and manage all business expenses.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Suspense fallback={<div>Loading...</div>}>
                <ExpenseManagementClient initialExpenses={serialized} />
            </Suspense>
        </Box>
    );
}
