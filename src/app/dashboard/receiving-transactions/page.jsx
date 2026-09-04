import { Suspense } from "react";
import prisma from "@/lib/prisma";
import ReceivingTransactionsClient from "./ReceivingTransactionsClient";
import { Box, CircularProgress } from "@mui/material";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Transaction Roster | GRACE TAILORS",
    description: "View and filter all receiving transactions from customer accounts and bookings."
};

export default async function ReceivingTransactionsPage() {
    let initialData = {
        transactions: [],
        totalCount: 0,
        totalPages: 1,
        totalReceivedSum: 0
    };

    try {
        const limit = 12;
        const where = {
            type: "CREDIT",
            customer: {
                name: { not: "Cash Account" }
            }
        };

        const [entries, totalCount, totalAmountAgg] = await Promise.all([
            prisma.ledgerentry.findMany({
                where,
                include: {
                    customer: true,
                    booking: {
                        select: {
                            id: true,
                            bookingNumber: true,
                            totalAmount: true,
                            remainingAmount: true,
                            advanceAmount: true,
                            status: true
                        }
                    }
                },
                orderBy: [
                    { entryDate: "desc" },
                    { id: "desc" }
                ],
                take: limit
            }),
            prisma.ledgerentry.count({ where }),
            prisma.ledgerentry.aggregate({
                where,
                _sum: { amount: true }
            })
        ]);

        const transactions = entries.map(entry => {
            const isBooking = !!entry.bookingId || (entry.description && /booking/i.test(entry.description));
            const receivingType = isBooking ? "From Booking" : "Received through Ledger";

            let bookingNum = entry.booking?.bookingNumber;
            if (!bookingNum && entry.description) {
                const match = entry.description.match(/Booking[#:\s]+([A-Za-z0-9-]+)/i);
                if (match) bookingNum = match[1];
            }

            let accountOver = "";
            if (entry.customer?.phone && entry.customer.phone.trim().length >= 4) {
                const cleanPhone = entry.customer.phone.trim();
                accountOver = `over ${cleanPhone.slice(-4)}`;
            } else if (entry.customer?.code) {
                const cleanCode = entry.customer.code.replace(/^CUST-/i, "");
                accountOver = `over ${cleanCode}`;
            } else if (entry.customer?.id) {
                accountOver = `over ${entry.customer.id}`;
            } else {
                accountOver = "over --";
            }

            const rawPending = entry.booking?.remainingAmount !== undefined && entry.booking?.remainingAmount !== null
                ? parseFloat(entry.booking.remainingAmount.toString())
                : (entry.customer?.balance !== undefined && entry.customer?.balance !== null
                    ? parseFloat(entry.customer.balance.toString())
                    : 0);

            const pendingBalance = Math.max(0, rawPending);
            const amountNum = parseFloat(entry.amount.toString());

            let formattedDescription = "";
            if (isBooking) {
                const bTag = bookingNum ? `Booking-${bookingNum}` : "Booking";
                formattedDescription = `Received Rs. ${amountNum.toLocaleString()} | ${bTag} | Pending Balance: Rs. ${pendingBalance.toLocaleString()}`;
            } else {
                const cstTag = entry.customer?.code ? entry.customer.code.replace(/^CUST-/i, "CST-") : "CST (Ledger)";
                if (entry.description && entry.description.toLowerCase().includes("received")) {
                    formattedDescription = `${entry.description} | Pending Balance: Rs. ${pendingBalance.toLocaleString()}`;
                } else if (entry.description && !entry.description.startsWith("Payment") && entry.description.length > 2) {
                    formattedDescription = `Received Rs. ${amountNum.toLocaleString()} (${entry.description}) | Pending Balance: Rs. ${pendingBalance.toLocaleString()}`;
                } else {
                    formattedDescription = `Received through ${cstTag} | Pending Balance: Rs. ${pendingBalance.toLocaleString()}`;
                }
            }

            let paymentMethod = "Cash";
            if (entry.description && /bank/i.test(entry.description)) {
                paymentMethod = "Bank Account";
            }

            const d = new Date(entry.entryDate);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1);
            const year = d.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;

            return {
                id: entry.id,
                rawDate: entry.entryDate.toISOString(),
                formattedDate,
                receivingType,
                accountName: entry.customer?.name || "Customer",
                accountOver,
                description: formattedDescription,
                rawDescription: entry.description || "",
                paymentMethod,
                amount: amountNum,
                amountDisplay: `${amountNum.toLocaleString()} PKR`,
                pendingBalance,
                bookingId: entry.bookingId,
                bookingNumber: bookingNum || null,
                customerId: entry.customerId
            };
        });

        initialData = {
            transactions,
            totalCount,
            totalPages: Math.ceil(totalCount / limit) || 1,
            totalReceivedSum: parseFloat(totalAmountAgg._sum.amount || 0)
        };
    } catch (error) {
        console.error("Database error on Receiving Transactions page:", error);
    }

    return (
        <Box sx={{ width: "100%", minHeight: "100%" }}>
            <Suspense
                fallback={
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                        <CircularProgress />
                    </Box>
                }
            >
                <ReceivingTransactionsClient initialData={initialData} />
            </Suspense>
        </Box>
    );
}
