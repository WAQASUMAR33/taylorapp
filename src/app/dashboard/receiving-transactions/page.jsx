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
            customer: {
                name: { not: "Cash Account" }
            }
        };

        const [receivings, totalCount, totalAmountAgg] = await Promise.all([
            prisma.receiving.findMany({
                where,
                include: {
                    customer: true,
                    bank: true,
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
                    { receivingDate: "desc" },
                    { id: "desc" }
                ],
                take: limit
            }),
            prisma.receiving.count({ where }),
            prisma.receiving.aggregate({
                where,
                _sum: { amount: true }
            })
        ]);

        const transactions = receivings.map(rec => {
            const isBooking = !!rec.bookingId;
            const receivingType = isBooking ? "From Booking" : "Received through Ledger";

            let bookingNum = rec.booking?.bookingNumber;
            if (!bookingNum && rec.description) {
                const match = rec.description.match(/Booking[#:\s]+([A-Za-z0-9-]+)/i);
                if (match) bookingNum = match[1];
            }

            let accountOver = "";
            if (rec.customer?.phone && rec.customer.phone.trim().length >= 4) {
                const cleanPhone = rec.customer.phone.trim();
                accountOver = `over ${cleanPhone.slice(-4)}`;
            } else if (rec.customer?.code) {
                const cleanCode = rec.customer.code.replace(/^CUST-/i, "");
                accountOver = `over ${cleanCode}`;
            } else if (rec.customer?.id) {
                accountOver = `over ${rec.customer.id}`;
            } else {
                accountOver = "over --";
            }

            const rawPending = rec.booking?.remainingAmount !== undefined && rec.booking?.remainingAmount !== null
                ? parseFloat(rec.booking.remainingAmount.toString())
                : (rec.customer?.balance !== undefined && rec.customer?.balance !== null
                    ? parseFloat(rec.customer.balance.toString())
                    : 0);

            const pendingBalance = Math.max(0, rawPending);
            const amountNum = parseFloat(rec.amount.toString());

            let receiptNo = rec.receiptNo || `REC-${rec.id}`;
            if (receiptNo.startsWith("REC-LEGACY-")) {
                receiptNo = receiptNo.replace("REC-LEGACY-", "REC-");
            }

            const sourceRef = isBooking 
                ? (bookingNum ? `Booking #${bookingNum}` : `Booking #${rec.bookingId}`)
                : "Customer Ledger";

            const actualDescription = (rec.description && rec.description.trim())
                ? rec.description.trim()
                : (isBooking ? `Payment received for ${sourceRef}` : "Payment received through Ledger");

            let paymentMethod = "Cash";
            if (rec.paymentMode === "BANK" || (rec.bank && rec.bank.name)) {
                paymentMethod = rec.bank ? `Bank (${rec.bank.name})` : "Bank Account";
            } else if (rec.description && /bank/i.test(rec.description)) {
                paymentMethod = "Bank Account";
            }

            const d = new Date(rec.receivingDate);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1);
            const year = d.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            const formattedTime = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

            return {
                id: rec.id,
                receiptNo,
                rawReceiptNo: rec.receiptNo || `REC-${rec.id}`,
                rawDate: rec.receivingDate.toISOString(),
                formattedDate,
                formattedTime,
                receivingType,
                sourceRef,
                accountName: rec.customer?.name || "Customer",
                accountOver,
                address: rec.customer?.address || "",
                description: actualDescription,
                rawDescription: rec.description || "",
                paymentMethod,
                amount: amountNum,
                amountDisplay: `${amountNum.toLocaleString()} PKR`,
                pendingBalance,
                bookingId: rec.bookingId,
                bookingNumber: bookingNum || null,
                customerId: rec.customerId,
                receivingId: rec.id
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
