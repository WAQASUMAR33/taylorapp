import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getScopedBranchId, filterBranches } from "@/lib/branchScope";
import ExpenseManagementClient from "./ExpenseManagementClient";
import { Box, Typography } from "@mui/material";
import { Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Expenses | GRACE TAILORS",
};

export default async function ExpensesPage() {
    const session = await getServerSession(authOptions);
    const bid = getScopedBranchId(session);
    const [expenses, allBranches] = await Promise.all([
        prisma.expense.findMany({
            where: bid !== null ? { branchId: bid } : undefined,
            include: {
                addedByUser: { select: { id: true, fullName: true } },
                branch: { select: { id: true, name: true, code: true } },
            },
            orderBy: { date: "desc" },
        }),
        prisma.branch.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true },
            orderBy: { name: "asc" }
        })
    ]);

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
                <ExpenseManagementClient initialExpenses={serialized} branches={filterBranches(session, allBranches)} />
            </Suspense>
        </Box>
    );
}
