import { Suspense } from "react";
import prisma from "@/lib/prisma";
import LedgerManagementClient from "./LedgerManagementClient";

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
            orderBy: { name: "asc" },
        }),
    ]);

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

    const serializedCustomers = customers.map(customer => ({
        ...customer,
        balance: customer.balance ? parseFloat(customer.balance.toString()) : 0
    }));

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LedgerManagementClient initialEntries={serializedEntries} customers={serializedCustomers} />
        </Suspense>
    );
}
