import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "12", 10);
        const search = (searchParams.get("search") || "").trim();
        const source = (searchParams.get("source") || "ALL").toUpperCase();
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";
        const sortBy = searchParams.get("sortBy") || "date";
        const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

        const skip = Math.max(0, (page - 1) * limit);

        // Base filter on receiving model
        const where = {
            customer: {
                name: { not: "Cash Account" }
            }
        };

        // Source filter
        if (source === "BOOKING") {
            where.bookingId = { not: null };
        } else if (source === "LEDGER") {
            where.bookingId = null;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.receivingDate = {};
            if (dateFrom) {
                where.receivingDate.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                where.receivingDate.lte = toDate;
            }
        }

        // Search filter
        if (search) {
            const searchOr = [
                { receiptNo: { contains: search } },
                { description: { contains: search } },
                {
                    customer: {
                        OR: [
                            { name: { contains: search } },
                            { phone: { contains: search } },
                            { code: { contains: search } },
                            { fatherName: { contains: search } },
                            { address: { contains: search } }
                        ]
                    }
                },
                {
                    booking: {
                        bookingNumber: { contains: search }
                    }
                }
            ];

            const searchNum = parseFloat(search.replace(/[^0-9.]/g, ""));
            if (!isNaN(searchNum) && searchNum > 0) {
                searchOr.push({ amount: searchNum });
            }

            where.AND = where.AND || [];
            where.AND.push({ OR: searchOr });
        }

        // Determine orderBy
        let orderBy = [];
        if (sortBy === "amount") {
            orderBy = [{ amount: sortOrder }, { id: sortOrder }];
        } else if (sortBy === "type") {
            orderBy = [{ bookingId: sortOrder === "asc" ? "desc" : "asc" }, { receivingDate: "desc" }];
        } else if (sortBy === "receiptNo") {
            orderBy = [{ receiptNo: sortOrder }, { id: sortOrder }];
        } else {
            // Default: by date
            orderBy = [{ receivingDate: sortOrder }, { id: sortOrder }];
        }

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
                orderBy,
                skip,
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

            // Customer account secondary subtext: "over [digits / code]"
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

            // Pending balance calculation
            const rawPending = rec.booking?.remainingAmount !== undefined && rec.booking?.remainingAmount !== null
                ? parseFloat(rec.booking.remainingAmount.toString())
                : (rec.customer?.balance !== undefined && rec.customer?.balance !== null
                    ? parseFloat(rec.customer.balance.toString())
                    : 0);

            const pendingBalance = Math.max(0, rawPending);
            const amountNum = parseFloat(rec.amount.toString());

            // Clean formatted receipt number
            let receiptNo = rec.receiptNo || `REC-${rec.id}`;
            if (receiptNo.startsWith("REC-LEGACY-")) {
                receiptNo = receiptNo.replace("REC-LEGACY-", "REC-");
            }

            const sourceRef = isBooking 
                ? (bookingNum ? `Booking #${bookingNum}` : `Booking #${rec.bookingId}`)
                : "Customer Ledger";

            // Description: actual description from the receiving model/table
            const actualDescription = (rec.description && rec.description.trim())
                ? rec.description.trim()
                : (isBooking ? `Payment received for ${sourceRef}` : "Payment received through Ledger");

            // Determine payment method
            let paymentMethod = "Cash";
            if (rec.paymentMode === "BANK" || (rec.bank && rec.bank.name)) {
                paymentMethod = rec.bank ? `Bank (${rec.bank.name})` : "Bank Account";
            } else if (rec.description && /bank/i.test(rec.description)) {
                paymentMethod = "Bank Account";
            }

            // Format date and time
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

        const totalPages = Math.ceil(totalCount / limit) || 1;

        return NextResponse.json({
            transactions,
            totalCount,
            page,
            limit,
            totalPages,
            totalReceivedSum: parseFloat(totalAmountAgg._sum.amount || 0)
        });
    } catch (error) {
        console.error("Error in receiving-transactions API:", error);
        return NextResponse.json(
            { error: "Failed to fetch receiving transactions", details: error.message },
            { status: 500 }
        );
    }
}
