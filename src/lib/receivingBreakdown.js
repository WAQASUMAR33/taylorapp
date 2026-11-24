/**
 * Helper to compute receiving breakdown according to the business logic:
 * "Developer Notes - Receiving Logic:
 *  First put amount in Product Receiving, and when that gets cleared, add amount in Stitching Receiving.
 *  Formula:
 *  Total Receiving = Product Receiving + Stitching Receiving + Ledger Receiving.
 *  Sale returns:
 *  Subtracted from Total Receiving, Product Receiving, and Cash/Bank."
 */

export function buildSaleReturnWhere(baseWhere = {}, search = "") {
    const saleReturnWhere = {
        customer: {
            name: { not: "Cash Account" }
        }
    };

    if (baseWhere.branchId) {
        saleReturnWhere.branchId = baseWhere.branchId;
    }

    if (baseWhere.receivingDate) {
        saleReturnWhere.returnDate = baseWhere.receivingDate;
    }

    if (search && search.trim()) {
        const q = search.trim();
        const searchOr = [
            { returnNumber: { contains: q } },
            { notes: { contains: q } },
            {
                customer: {
                    OR: [
                        { name: { contains: q } },
                        { phone: { contains: q } },
                        { code: { contains: q } },
                        { fatherName: { contains: q } },
                        { address: { contains: q } }
                    ]
                }
            }
        ];
        const searchNum = parseFloat(q.replace(/[^0-9.]/g, ""));
        if (!isNaN(searchNum) && searchNum > 0) {
            searchOr.push({ totalAmount: searchNum });
        }
        const cleanRet = q.replace(/^(RET|TR|REC|TXN)-?/i, "").trim();
        const retNum = parseInt(cleanRet, 10);
        if (!isNaN(retNum) && retNum > 0) {
            searchOr.push({ id: retNum });
        }
        saleReturnWhere.AND = [{ OR: searchOr }];
    }

    return saleReturnWhere;
}

export function mapSaleReturnToTransaction(ret) {
    const amtNum = parseFloat(ret.totalAmount ? ret.totalAmount.toString() : 0);
    const negativeAmt = -Math.abs(amtNum);
    const exactDate = ret.createdAt || ret.returnDate || new Date();
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

    const simpleId = `RET-${String(ret.id).padStart(4, "0")}`;

    let accountOver = "";
    if (ret.customer?.phone && ret.customer.phone.trim().length >= 4) {
        accountOver = `over ${ret.customer.phone.trim().slice(-4)}`;
    } else if (ret.customer?.code) {
        accountOver = `over ${ret.customer.code.replace(/^CUST-/i, "")}`;
    } else if (ret.customer?.id) {
        accountOver = `over ${ret.customer.id}`;
    } else {
        accountOver = "over --";
    }

    const itemsSummary = (ret.items || [])
        .map(i => `${i.product?.name || 'Product'} (x${i.quantity})`)
        .join(', ');

    const actualDescription = ret.notes 
        ? `Sale Return: ${ret.notes}${itemsSummary ? ` [${itemsSummary}]` : ''}`
        : (itemsSummary ? `Product Sale Return: ${itemsSummary}` : `Product Sale Return #${simpleId}`);

    let paymentMethod = "Cash";
    if (ret.paymentMode === "BANK" || (ret.bank && ret.bank.name)) {
        paymentMethod = ret.bank ? `Bank (${ret.bank.name})` : "Bank Account";
    } else if (ret.paymentMode === "LEDGER") {
        paymentMethod = "Ledger Adjustment";
    }

    return {
        id: `return-${ret.id}`,
        returnId: ret.id,
        isReturn: true,
        receiptNo: simpleId,
        rawReceiptNo: ret.returnNumber,
        rawDate: d.toISOString(),
        formattedDate,
        formattedTime,
        source: "Sale Return",
        receivingType: "Sale Return (Refund)",
        sourceRef: `Return #${simpleId}`,
        accountName: ret.customer?.name || "Customer",
        accountOver,
        address: ret.customer?.address || "",
        description: actualDescription,
        rawDescription: ret.notes || "",
        paymentMethod,
        amount: negativeAmt,
        amountDisplay: `-${amtNum.toLocaleString()} PKR`,
        productAmount: negativeAmt,
        stitchingAmount: 0,
        ledgerAmount: 0,
        pendingBalance: 0,
        bookingId: null,
        bookingNumber: null,
        customerId: ret.customerId,
        receivingId: null,
        branch: ret.branch ? { id: ret.branch.id, name: ret.branch.name, code: ret.branch.code } : null
    };
}

export async function calculateReceivingSummary(prisma, baseWhere, search = "") {
    // 1. Fetch matching receivings
    const receivings = await prisma.receiving.findMany({
        where: baseWhere,
        select: {
            id: true,
            amount: true,
            bookingId: true,
            receivingDate: true,
            paymentMode: true,
            source: true
        },
        orderBy: [
            { receivingDate: "desc" },
            { id: "desc" }
        ]
    });

    const bookingIds = [...new Set(receivings.map(r => r.bookingId).filter(Boolean))];

    // 2. Fetch bookings with product items and receivings for sequential allocation
    const bookings = bookingIds.length > 0 ? await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        select: {
            id: true,
            items: {
                where: { productId: { not: null } },
                select: { totalPrice: true }
            },
            receivings: {
                select: { id: true, amount: true, receivingDate: true, source: true },
                orderBy: [
                    { receivingDate: "asc" },
                    { id: "asc" }
                ]
            }
        }
    }) : [];

    const bookingAllocationMap = new Map(); // recId -> { productAmount, stitchingAmount, ledgerAmount }

    for (const b of bookings) {
        let productTotal = 0;
        for (const it of b.items) {
            productTotal += parseFloat(it.totalPrice || 0);
        }
        let productRemaining = productTotal;

        for (const rec of b.receivings) {
            if ((rec.source || "").toUpperCase() === "TRANSFER") {
                continue;
            }
            const amt = parseFloat(rec.amount || 0);
            const toProd = Math.min(amt, productRemaining);
            const toStitch = amt - toProd;
            productRemaining = Math.max(0, productRemaining - toProd);

            bookingAllocationMap.set(rec.id, {
                productAmount: toProd,
                stitchingAmount: toStitch,
                ledgerAmount: 0
            });
        }
    }

    let totalAmount = 0;
    let totalCount = 0;
    let prodAmount = 0;
    let prodCount = 0;
    let stitchAmount = 0;
    let stitchCount = 0;
    let ledgerAmount = 0;
    let ledgerCount = 0;
    let cashAmount = 0;
    let bankAmount = 0;

    for (const rec of receivings) {
        if ((rec.source || "").toUpperCase() === "TRANSFER") {
            continue;
        }

        totalCount++;
        const amt = parseFloat(rec.amount || 0);
        totalAmount += amt;

        if ((rec.paymentMode || "").toUpperCase() === "BANK") {
            bankAmount += amt;
        } else {
            cashAmount += amt;
        }

        if (!rec.bookingId) {
            ledgerAmount += amt;
            ledgerCount++;
        } else {
            const alloc = bookingAllocationMap.get(rec.id) || { productAmount: 0, stitchingAmount: amt, ledgerAmount: 0 };
            prodAmount += alloc.productAmount;
            stitchAmount += alloc.stitchingAmount;
            if (alloc.productAmount > 0) prodCount++;
            if (alloc.stitchingAmount > 0) stitchCount++;
        }
    }

    // 3. Fetch matching sale returns to deduct from receiving totals
    const saleReturnWhere = buildSaleReturnWhere(baseWhere, search);
    const saleReturns = await prisma.sale_return.findMany({
        where: saleReturnWhere,
        select: {
            id: true,
            totalAmount: true,
            paymentMode: true,
            returnDate: true
        }
    });

    let returnTotalAmount = 0;
    let returnCashAmount = 0;
    let returnBankAmount = 0;
    const returnCount = saleReturns.length;

    for (const ret of saleReturns) {
        const amt = parseFloat(ret.totalAmount || 0);
        returnTotalAmount += amt;
        if ((ret.paymentMode || "").toUpperCase() === "BANK") {
            returnBankAmount += amt;
        } else {
            returnCashAmount += amt;
        }
    }

    // Subtract sale returns from totals (reflect in minus)
    const finalTotalAmount = totalAmount - returnTotalAmount;
    const finalProductAmount = prodAmount - returnTotalAmount;
    const finalCashAmount = cashAmount - returnCashAmount;
    const finalBankAmount = bankAmount - returnBankAmount;
    const finalTotalCount = totalCount + returnCount;

    return {
        summary: {
            total: { amount: finalTotalAmount, count: finalTotalCount },
            product: { amount: finalProductAmount, count: prodCount + returnCount },
            stitching: { amount: stitchAmount, count: stitchCount },
            ledger: { amount: ledgerAmount, count: ledgerCount },
            cash: { amount: finalCashAmount, count: 0 },
            bank: { amount: finalBankAmount, count: 0 },
            returns: { amount: returnTotalAmount, count: returnCount }
        },
        bookingAllocationMap
    };
}
