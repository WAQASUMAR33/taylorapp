import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { scopeBranchParam } from "@/lib/branchScope";
import { calculateReceivingSummary, buildSaleReturnWhere, mapSaleReturnToTransaction } from "@/lib/receivingBreakdown";

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
        const branchIdParam = scopeBranchParam(await getServerSession(authOptions), searchParams.get("branchId"));

        const skip = Math.max(0, (page - 1) * limit);

        // Base filter on receiving model
        const baseWhere = {
            customer: {
                name: { not: "Cash Account" }
            }
        };

        if (branchIdParam && branchIdParam !== "ALL") {
            const bId = parseInt(branchIdParam, 10);
            if (!isNaN(bId)) {
                baseWhere.branchId = bId;
            }
        }

        // Date range filter
        if (dateFrom || dateTo) {
            baseWhere.receivingDate = {};
            if (dateFrom) {
                const fStr = dateFrom.includes("T") ? dateFrom : `${dateFrom}T00:00:00.000Z`;
                baseWhere.receivingDate.gte = new Date(fStr);
            }
            if (dateTo) {
                const tStr = dateTo.includes("T") ? dateTo : `${dateTo}T23:59:59.999Z`;
                baseWhere.receivingDate.lte = new Date(tStr);
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

            baseWhere.AND = baseWhere.AND || [];
            baseWhere.AND.push({ OR: searchOr });
        }

        // Calculate receiving breakdown and summary (deducts sale returns)
        const { summary, bookingAllocationMap } = await calculateReceivingSummary(prisma, baseWhere, search);

        // Build where filter for specific source
        const where = { ...baseWhere };

        if (source === "PRODUCT") {
            const prodRecIds = [];
            for (const [id, alloc] of bookingAllocationMap.entries()) {
                if (alloc.productAmount > 0) {
                    prodRecIds.push(id);
                }
            }
            where.id = { in: prodRecIds };
        } else if (source === "STITCHING") {
            const stitchRecIds = [];
            for (const [id, alloc] of bookingAllocationMap.entries()) {
                if (alloc.stitchingAmount > 0) {
                    stitchRecIds.push(id);
                }
            }
            where.id = { in: stitchRecIds };
        } else if (source === "LEDGER") {
            where.OR = [
                { source: "Ledger" },
                { bookingId: null }
            ];
        } else if (source === "ADVANCE") {
            where.source = "Advance";
        } else if (source === "RECEIVING") {
            where.source = "Receiving";
        } else if (source === "BOOKING") {
            where.OR = [
                { source: { in: ["Advance", "Receiving"] } },
                { bookingId: { not: null } }
            ];
        }

        const saleReturnWhere = buildSaleReturnWhere(baseWhere, search);
        const shouldIncludeReturns = source === "ALL" || source === "PRODUCT";

        const [receivings, saleReturns] = await Promise.all([
            prisma.receiving.findMany({
                where,
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
            shouldIncludeReturns
                ? prisma.sale_return.findMany({
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
                : Promise.resolve([])
        ]);

        const mappedReceivings = receivings.map(rec => {
            const isBooking = !!rec.bookingId;
            const recSource = rec.source || (isBooking ? "Advance" : "Ledger");
            const isTransfer = (recSource || "").toUpperCase() === "TRANSFER";
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

            let paymentMethod = isTransfer ? "Transfer" : "Cash";
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

            const alloc = bookingAllocationMap.get(rec.id) || {
                productAmount: 0,
                stitchingAmount: isBooking ? amountNum : 0,
                ledgerAmount: !isBooking ? amountNum : 0
            };

            return {
                id: rec.id,
                isReturn: false,
                receiptNo,
                rawReceiptNo: rec.receiptNo || `REC-${rec.id}`,
                rawDate: rec.receivingDate.toISOString(),
                formattedDate,
                formattedTime,
                source: recSource,
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

        const mappedReturns = (shouldIncludeReturns ? saleReturns : []).map(mapSaleReturnToTransaction);

        // Merge receivings and returns
        const allTransactions = [...mappedReceivings, ...mappedReturns];

        // Sort all transactions
        if (sortBy === "amount") {
            allTransactions.sort((a, b) => sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount);
        } else if (sortBy === "receiptNo") {
            allTransactions.sort((a, b) => sortOrder === "asc" ? a.receiptNo.localeCompare(b.receiptNo) : b.receiptNo.localeCompare(a.receiptNo));
        } else {
            // default: date desc
            allTransactions.sort((a, b) => {
                const diff = new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
                return sortOrder === "asc" ? -diff : diff;
            });
        }

        const totalCount = allTransactions.length;
        const totalPages = Math.ceil(totalCount / limit) || 1;
        const transactions = allTransactions.slice(skip, skip + limit);

        return NextResponse.json({
            transactions,
            totalCount,
            page,
            limit,
            totalPages,
            totalReceivedSum: summary.total.amount,
            summary
        });
    } catch (error) {
        console.error("Error in receiving-transactions API:", error);
        return NextResponse.json(
            { error: "Failed to fetch receiving transactions", details: error.message },
            { status: 500 }
        );
    }
}
