import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getScopedBranchId, filterBranches } from "@/lib/branchScope";
import ReceivingTransactionsClient from "./ReceivingTransactionsClient";
import { Box, CircularProgress } from "@mui/material";
import { calculateReceivingSummary, buildSaleReturnWhere, mapSaleReturnToTransaction } from "@/lib/receivingBreakdown";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Transaction Roster | GRACE TAILORS",
    description: "View and filter all receiving transactions from customer accounts and bookings."
};

export default async function ReceivingTransactionsPage() {
    const session = await getServerSession(authOptions);
    const bid = getScopedBranchId(session);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    let initialData = {
        transactions: [],
        totalCount: 0,
        totalPages: 1,
        totalReceivedSum: 0,
        dateFrom: todayStr,
        dateTo: todayStr,
        datePreset: "TODAY",
        summary: {
            total: { amount: 0, count: 0 },
            product: { amount: 0, count: 0 },
            stitching: { amount: 0, count: 0 },
            ledger: { amount: 0, count: 0 },
            cash: { amount: 0, count: 0 },
            bank: { amount: 0, count: 0 },
            returns: { amount: 0, count: 0 }
        }
    };

    try {
        const limit = 12;
        const baseWhere = {
            ...(bid !== null ? { branchId: bid } : {}),
            customer: {
                name: { not: "Cash Account" }
            },
            receivingDate: {
                gte: new Date(`${todayStr}T00:00:00.000Z`),
                lte: new Date(`${todayStr}T23:59:59.999Z`)
            }
        };

        const { summary, bookingAllocationMap } = await calculateReceivingSummary(prisma, baseWhere);
        const saleReturnWhere = buildSaleReturnWhere(baseWhere);

        const [receivings, saleReturns] = await Promise.all([
            prisma.receiving.findMany({
                where: baseWhere,
                include: {
                    customer: true,
                    bank: true,
                    branch: true,
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
                }
            }),
            prisma.sale_return.findMany({
                where: saleReturnWhere,
                include: {
                    customer: true,
                    bank: true,
                    branch: true,
                    items: {
                        include: {
                            product: { select: { id: true, name: true, sku: true } }
                        }
                    }
                }
            })
        ]);

        const mappedReceivings = receivings.map(rec => {
            const isBooking = !!rec.bookingId;
            const source = rec.source || (isBooking ? "Advance" : "Ledger");
            const isTransfer = (source || "").toUpperCase() === "TRANSFER";
            const receivingType = isTransfer ? "Billing Transfer" : (isBooking ? "From Booking" : "Received through Ledger");

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

            // Simple Transaction Roster ID (e.g. TR-0001)
            const simpleId = `TR-${String(rec.id).padStart(4, "0")}`;
            const rawReceipt = rec.receiptNo || `REC-${rec.id}`;

            const sourceRef = isBooking 
                ? (bookingNum ? `Booking #${bookingNum}` : `Booking #${rec.bookingId}`)
                : "Customer Ledger";

            const actualDescription = (rec.description && rec.description.trim())
                ? rec.description.trim()
                : (isBooking ? `Payment received for ${sourceRef}` : "Payment received through Ledger");

            let paymentMethod = isTransfer ? "Transfer" : "Cash";
            if (rec.paymentMode === "BANK" || (rec.bank && rec.bank.name)) {
                paymentMethod = rec.bank ? `Bank (${rec.bank.name})` : "Bank Account";
            } else if (rec.description && /bank/i.test(rec.description)) {
                paymentMethod = "Bank Account";
            }

            // Exact timestamp when transaction occurred in Pakistan Standard Time (Asia/Karachi)
            const exactDate = rec.createdAt || rec.receivingDate || new Date();
            const d = new Date(exactDate);
            const formattedDate = d.toLocaleDateString("en-GB", {
                timeZone: "Asia/Karachi",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
            const formattedTime = d.toLocaleTimeString("en-US", {
                timeZone: "Asia/Karachi",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });

            const alloc = bookingAllocationMap.get(rec.id) || {
                productAmount: 0,
                stitchingAmount: isBooking ? amountNum : 0,
                ledgerAmount: !isBooking ? amountNum : 0
            };

            return {
                id: rec.id,
                isReturn: false,
                receiptNo: simpleId,
                rawReceiptNo: rawReceipt,
                rawDate: d.toISOString(),
                formattedDate,
                formattedTime,
                source,
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
                productAmount: alloc.productAmount,
                stitchingAmount: alloc.stitchingAmount,
                ledgerAmount: alloc.ledgerAmount,
                pendingBalance,
                bookingId: rec.bookingId,
                bookingNumber: bookingNum || null,
                customerId: rec.customerId,
                receivingId: rec.id,
                branch: rec.branch ? { id: rec.branch.id, name: rec.branch.name, code: rec.branch.code } : null
            };
        });

        const mappedReturns = saleReturns.map(mapSaleReturnToTransaction);
        const allTransactions = [...mappedReceivings, ...mappedReturns];

        // Sort descending by date
        allTransactions.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

        const totalCount = allTransactions.length;
        const transactions = allTransactions.slice(0, limit);

        initialData = {
            transactions,
            totalCount,
            totalPages: Math.ceil(totalCount / limit) || 1,
            dateFrom: todayStr,
            dateTo: todayStr,
            datePreset: "TODAY",
            summary
        };
    } catch (error) {
        console.error("Database error on Receiving Transactions page:", error);
    }

    const branches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true, phone: true, address: true, slogan: true, logo: true }
    });

    return (
        <Suspense fallback={
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                <CircularProgress />
            </Box>
        }>
            <ReceivingTransactionsClient initialData={initialData} branches={branches} />
        </Suspense>
    );
}
