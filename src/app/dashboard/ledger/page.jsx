import { Suspense } from "react";
import prisma from "@/lib/prisma";
import LedgerManagementClient from "./LedgerManagementClient";
import { Container, Box, Typography } from "@mui/material";
import { BookText } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: "Ledger | GRACE TAILORS",
};

export default async function LedgerPage() {
    // 1. Fetch initial 50 ledger entries
    const initialEntries = await prisma.ledgerentry.findMany({
        where: {
            customer: {
                name: { not: "Cash Account" }
            }
        },
        include: {
            customer: true,
            purchase: true,
            booking: {
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true,
                            selectedOptions: {
                                include: {
                                    stitchingOption: true
                                }
                            }
                        }
                    },
                    staff: {
                        include: {
                            customer: true
                        }
                    }
                }
            },
            saleReturn: {
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            }
        },
        orderBy: [
            { entryDate: "asc" },
            { id: "asc" }
        ],
        take: 50,
    });

    // 2. Fetch count of all matching entries
    const totalCount = await prisma.ledgerentry.count({
        where: {
            customer: {
                name: { not: "Cash Account" }
            }
        }
    });

    // 3. Calculate initial totals (debit & credit)
    const [debitSum, creditSum] = await Promise.all([
        prisma.ledgerentry.aggregate({
            where: { customer: { name: { not: "Cash Account" } }, type: "DEBIT" },
            _sum: { amount: true }
        }),
        prisma.ledgerentry.aggregate({
            where: { customer: { name: { not: "Cash Account" } }, type: "CREDIT" },
            _sum: { amount: true }
        })
    ]);

    const initialTotals = {
        debit: parseFloat(debitSum._sum.amount || 0),
        credit: parseFloat(creditSum._sum.amount || 0)
    };

    // 4. Fetch initial 50 customers to populate dropdowns initially (excluding cutter & tailor)
    const initialCustomers = await prisma.customer.findMany({
        where: {
            NOT: { name: 'Cash Account' },
            AND: [
                {
                    OR: [
                        { accountCategory: null },
                        {
                            accountCategory: {
                                name: {
                                    not: { contains: "cutter" }
                                }
                            }
                        }
                    ]
                },
                {
                    OR: [
                        { accountCategory: null },
                        {
                            accountCategory: {
                                name: {
                                    not: { contains: "tailor" }
                                }
                            }
                        }
                    ]
                }
            ]
        },
        include: {
            accountCategory: true
        },
        orderBy: { name: "asc" },
        take: 50,
    });

    // Serialize Decimal fields
    const serializedEntries = initialEntries.map(entry => ({
        ...entry,
        amount: entry.amount.toString(),
        customer: entry.customer ? {
            ...entry.customer,
            balance: entry.customer.balance ? parseFloat(entry.customer.balance.toString()) : 0
        } : null,
        purchase: entry.purchase ? {
            ...entry.purchase,
            totalAmount: entry.purchase.totalAmount.toString()
        } : null,
        booking: entry.booking ? {
            ...entry.booking,
            totalAmount: entry.booking.totalAmount.toString(),
            advanceAmount: entry.booking.advanceAmount.toString(),
            remainingAmount: entry.booking.remainingAmount.toString(),
            items: (entry.booking.items || []).map(i => ({
                ...i,
                unitPrice: i.unitPrice.toString(),
                totalPrice: i.totalPrice.toString(),
                discount: i.discount.toString()
            }))
        } : null,
        saleReturn: entry.saleReturn ? {
            ...entry.saleReturn,
            totalAmount: entry.saleReturn.totalAmount.toString(),
            items: (entry.saleReturn.items || []).map(i => ({
                ...i,
                quantity: parseFloat(i.quantity.toString()),
                unitPrice: parseFloat(i.unitPrice.toString()),
                totalPrice: parseFloat(i.totalPrice.toString())
            }))
        } : null
    }));

    const serializedCustomers = initialCustomers.map(customer => ({
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
                <LedgerManagementClient 
                    initialEntries={serializedEntries} 
                    initialCustomers={serializedCustomers}
                    initialTotalCount={totalCount}
                    initialTotals={initialTotals}
                />
            </Suspense>
        </Box>
    );
}
