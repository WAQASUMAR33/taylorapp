import { Suspense } from "react";
import prisma from "@/lib/prisma";
import LedgerManagementClient from "./LedgerManagementClient";
import { Container, Box, Typography } from "@mui/material";
import { BookText } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: "Ledger | TailorFlow",
};

export default async function LedgerPage() {
    const [ledgerEntries, customers] = await Promise.all([
        prisma.ledgerentry.findMany({
            where: {
                customer: {
                    NOT: { name: 'Cash Account' }
                }
            },
            include: {
                customer: true,
                purchase: true,
            },
            orderBy: { entryDate: "asc" },
        }),
        prisma.customer.findMany({
            where: {
                NOT: { name: 'Cash Account' }
            },
            include: {
                accountCategory: true
            },
            orderBy: { name: "asc" },
        }),
    ]);

    // Filter out employee categories (Cutter, Tailor)
    const filteredCustomersForList = customers.filter(c => {
        const catName = c.accountCategory?.name?.toLowerCase() || "";
        return !catName.includes("cutter") && !catName.includes("tailor");
    });

    // Serialize Decimal fields
    const serializedEntries = ledgerEntries.map(entry => ({
        ...entry,
        amount: entry.amount.toString(),
        customer: entry.customer ? {
            ...entry.customer,
            balance: entry.customer.balance ? parseFloat(entry.customer.balance.toString()) : 0
        } : null,
        purchase: entry.purchase ? {
            ...entry.purchase,
            totalAmount: entry.purchase.totalAmount.toString()
        } : null
    }));

    const serializedCustomers = filteredCustomersForList.map(customer => ({
        ...customer,
        balance: customer.balance ? parseFloat(customer.balance.toString()) : 0
    }));

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
                        bgcolor: 'primary.light',
                        borderRadius: 3,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <BookText size={28} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Ledger
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Business accounts and transaction records.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Suspense fallback={<div>Loading...</div>}>
                <LedgerManagementClient initialEntries={serializedEntries} customers={serializedCustomers} />
            </Suspense>
        </Box>
    );
}
