import prisma from "@/lib/prisma";
import CashManagementClient from "./CashManagementClient";

export const metadata = {
    title: "Cash Management | TailorFlow",
};

export default async function CashPage() {
    // Find or create "Cash Account"
    let cashAccount = await prisma.customer.findFirst({
        where: { name: 'Cash Account' }
    });

    if (!cashAccount) {
        cashAccount = await prisma.customer.create({
            data: {
                name: 'Cash Account',
                code: 'CASH-001',
                notes: 'System account for tracking cash transactions'
            }
        });
    }

    const [ledgerEntries, bookings] = await Promise.all([
        prisma.ledgerentry.findMany({
            where: { customerId: cashAccount.id },
            include: {
                customer: true,
                purchase: {
                    include: { supplierRel: true }
                },
                booking: {
                    include: { customer: true }
                },
            },
            orderBy: { entryDate: "asc" },
        }),
        prisma.booking.findMany({
            include: {
                customer: {
                    include: {
                        accountCategory: true
                    }
                }
            },
            orderBy: { bookingDate: "desc" },
        }),
    ]);

    // Filter out bookings for customers in employee categories (Cutter, Tailor)
    const filteredBookings = bookings.filter(b => {
        const catName = b.customer?.accountCategory?.name?.toLowerCase() || "";
        return !catName.includes("cutter") && !catName.includes("tailor");
    });

    // Serialize Decimal fields
    const serializedEntries = ledgerEntries.map(entry => ({
        ...entry,
        amount: entry.amount.toString(),
        customer: entry.customer ? {
            ...entry.customer,
            balance: entry.customer.balance.toString()
        } : null,
        booking: entry.booking ? {
            ...entry.booking,
            totalAmount: entry.booking.totalAmount.toString(),
            bookingNumber: entry.booking.bookingNumber
        } : null,
        purchase: entry.purchase ? {
            ...entry.purchase,
            totalAmount: entry.purchase.totalAmount ? entry.purchase.totalAmount.toString() : "0"
        } : null
    }));

    const serializedAccount = {
        ...cashAccount,
        balance: cashAccount.balance.toString()
    };

    return <CashManagementClient initialEntries={serializedEntries} cashAccount={serializedAccount} bookings={filteredBookings} />;
}
