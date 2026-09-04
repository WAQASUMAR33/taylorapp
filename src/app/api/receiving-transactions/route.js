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

        // Base filter: All customer credit entries (representing receiving transactions)
        const where = {
            type: "CREDIT",
            customer: {
                name: { not: "Cash Account" }
            }
        };

        // Source filter
        if (source === "BOOKING") {
            where.OR = [
                { bookingId: { not: null } },
                { description: { contains: "Booking" } },
                { description: { contains: "booking" } }
            ];
        } else if (source === "LEDGER") {
            where.AND = where.AND || [];
            where.AND.push({
                bookingId: null,
                NOT: [
                    { description: { contains: "Booking" } },
                    { description: { contains: "booking" } }
                ]
            });
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.entryDate = {};
            if (dateFrom) {
                where.entryDate.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                where.entryDate.lte = toDate;
            }
        }

        // Search filter
        if (search) {
            const searchOr = [
                { description: { contains: search } },
                {
                    customer: {
                        OR: [
                            { name: { contains: search } },
                            { phone: { contains: search } },
                            { code: { contains: search } },
                            { fatherName: { contains: search } }
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
            orderBy = [{ bookingId: sortOrder === "asc" ? "desc" : "asc" }, { entryDate: "desc" }];
        } else {
            // Default: by date
            orderBy = [{ entryDate: sortOrder }, { id: sortOrder }];
        }

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
                orderBy,
                skip,
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

            // Extract or resolve booking number
            let bookingNum = entry.booking?.bookingNumber;
            if (!bookingNum && entry.description) {
                const match = entry.description.match(/Booking[#:\s]+([A-Za-z0-9-]+)/i);
                if (match) bookingNum = match[1];
            }

            // Customer account secondary subtext: "over [digits / code]"
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

            // Pending balance calculation
            const rawPending = entry.booking?.remainingAmount !== undefined && entry.booking?.remainingAmount !== null
                ? parseFloat(entry.booking.remainingAmount.toString())
                : (entry.customer?.balance !== undefined && entry.customer?.balance !== null
                    ? parseFloat(entry.customer.balance.toString())
                    : 0);

            const pendingBalance = Math.max(0, rawPending);
            const amountNum = parseFloat(entry.amount.toString());

            // Build human-friendly description matching design
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

            // Determine payment method
            let paymentMethod = "Cash";
            if (entry.description && /bank/i.test(entry.description)) {
                paymentMethod = "Bank Account";
            }

            // Format date as DD/M/YYYY or DD/MM/YYYY matching screenshot style
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
