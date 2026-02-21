import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const tailorId = searchParams.get("tailorId");
        const cutterId = searchParams.get("cutterId");

        const where = {};

        if (from || to) {
            where.bookingDate = {};
            if (from) where.bookingDate.gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                where.bookingDate.lte = toDate;
            }
        }
        if (tailorId) where.tailorId = parseInt(tailorId);
        if (cutterId) where.cutterId = parseInt(cutterId);

        // --- Bookings with full relations ---
        const bookings = await prisma.booking.findMany({
            where,
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                tailor: { select: { id: true, name: true, role: true } },
                cutter: { select: { id: true, name: true, role: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } }
                    }
                }
            },
            orderBy: { bookingDate: "desc" }
        });

        // --- Purchases (for payables) ---
        const purchases = await prisma.purchase.findMany({
            include: {
                payments: true,
                supplierRel: { select: { id: true, name: true } }
            },
            orderBy: { purchaseDate: "desc" }
        });

        // --- Customers receivables (non-supplier, positive balance) ---
        const customers = await prisma.customer.findMany({
            where: { balance: { gt: 0 } },
            select: { id: true, name: true, balance: true }
        });

        // --- Aggregate booking totals ---
        let totalBookingAmount = 0;
        let totalReceived = 0;
        let totalPending = 0;
        let totalCost = 0;

        // Tailor map: tailorId → { name, amount, count }
        const tailorMap = {};
        // Cutter map: cutterId → { name, amount, count }
        const cutterMap = {};

        for (const b of bookings) {
            const total = parseFloat(b.totalAmount) || 0;
            const advance = parseFloat(b.advanceAmount) || 0;
            const remaining = parseFloat(b.remainingAmount) || 0;
            const itemCost = b.items.reduce((sum, i) => sum + (parseFloat(i.costPrice) || 0), 0);

            totalBookingAmount += total;
            totalReceived += advance;
            totalPending += remaining;
            totalCost += itemCost;

            // Tailor breakdown
            if (b.tailor) {
                if (!tailorMap[b.tailorId]) {
                    tailorMap[b.tailorId] = { id: b.tailorId, name: b.tailor.name, amount: 0, count: 0 };
                }
                tailorMap[b.tailorId].amount += total;
                tailorMap[b.tailorId].count += 1;
            }

            // Cutter breakdown
            if (b.cutter) {
                if (!cutterMap[b.cutterId]) {
                    cutterMap[b.cutterId] = { id: b.cutterId, name: b.cutter.name, amount: 0, count: 0 };
                }
                cutterMap[b.cutterId].amount += total;
                cutterMap[b.cutterId].count += 1;
            }
        }

        const totalProfit = totalBookingAmount - totalCost;

        // --- Payables from purchases ---
        let totalPayable = 0;
        for (const p of purchases) {
            const paid = p.payments.reduce((s, pay) => s + parseFloat(pay.amount), 0);
            const payable = parseFloat(p.totalAmount) - paid;
            if (payable > 0) totalPayable += payable;
        }

        // --- Receivables from customer balances ---
        const totalReceivables = customers.reduce((s, c) => s + parseFloat(c.balance), 0);

        return NextResponse.json({
            bookings: JSON.parse(JSON.stringify(bookings)),
            summary: {
                totalBookingAmount,
                totalReceived,
                totalPending,
                totalCost,
                totalProfit,
                totalPayable,
                totalReceivables,
                bookingCount: bookings.length
            },
            tailorBreakdown: Object.values(tailorMap).sort((a, b) => b.amount - a.amount),
            cutterBreakdown: Object.values(cutterMap).sort((a, b) => b.amount - a.amount),
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics: " + error.message }, { status: 500 });
    }
}
