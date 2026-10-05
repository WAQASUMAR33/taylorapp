/**
 * Helper to compute receiving breakdown according to the business logic:
 * "Developer Notes - Receiving Logic:
 *  First put amount in Product Receiving, and when that gets cleared, add amount in Stitching Receiving.
 *  Formula:
 *  Total Receiving = Product Receiving + Stitching Receiving + Ledger Receiving."
 */

export async function calculateReceivingSummary(prisma, baseWhere) {
    // 1. Fetch matching receivings
    const receivings = await prisma.receiving.findMany({
        where: baseWhere,
        select: {
            id: true,
            amount: true,
            bookingId: true,
            receivingDate: true,
            paymentMode: true
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
                select: { id: true, amount: true, receivingDate: true },
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
    let totalCount = receivings.length;
    let prodAmount = 0;
    let prodCount = 0;
    let stitchAmount = 0;
    let stitchCount = 0;
    let ledgerAmount = 0;
    let ledgerCount = 0;
    let cashAmount = 0;
    let bankAmount = 0;

    for (const rec of receivings) {
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

    return {
        summary: {
            total: { amount: totalAmount, count: totalCount },
            product: { amount: prodAmount, count: prodCount },
            stitching: { amount: stitchAmount, count: stitchCount },
            ledger: { amount: ledgerAmount, count: ledgerCount },
            cash: { amount: cashAmount, count: 0 },
            bank: { amount: bankAmount, count: 0 }
        },
        bookingAllocationMap
    };
}
