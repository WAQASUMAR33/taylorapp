import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchIdParam = searchParams.get("branchId");
        const targetBranchId = branchIdParam && branchIdParam !== "ALL" ? parseInt(branchIdParam) : null;

        // Fetch all active branches
        const branches = await prisma.branch.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true }
        });

        // Fetch products with their branchStocks and booking items
        const products = await prisma.product.findMany({
            include: {
                category: { select: { id: true, name: true } },
                branchStocks: {
                    include: {
                        branch: { select: { id: true, name: true, code: true } }
                    }
                },
                bookingItems: {
                    take: 50,
                    orderBy: { createdAt: "desc" },
                    include: {
                        booking: {
                            select: {
                                id: true,
                                bookingNumber: true,
                                bookingDate: true,
                                branchId: true,
                                status: true,
                                customer: { select: { id: true, name: true, phone: true } },
                                branch: { select: { id: true, name: true, code: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { name: "asc" }
        });

        const soldOutRecords = [];

        for (const prod of products) {
            const applicableBranches = targetBranchId
                ? branches.filter(b => b.id === targetBranchId)
                : branches;

            for (const br of applicableBranches) {
                // Determine branch stock
                const stockRec = (prod.branchStocks || []).find(bs => bs.branchId === br.id);
                let currentStock = stockRec ? parseFloat(stockRec.quantity || 0) : 0;
                
                // Fallback for legacy branch 1 if branchStocks record hasn't been initialized
                if ((!prod.branchStocks || prod.branchStocks.length === 0) && br.id === 1) {
                    currentStock = parseFloat(prod.quantity || 0);
                }

                // Filter sales/booking items for this specific branch
                const branchSales = (prod.bookingItems || []).filter(bi => {
                    const bBranchId = bi.booking?.branchId;
                    return bBranchId ? bBranchId === br.id : br.id === 1;
                });

                const totalSoldUnits = branchSales.reduce((sum, bi) => sum + (parseFloat(bi.quantity) || 1), 0);

                // If stock is depleted (0 or negative) OR if this product has sales history at this branch
                if (currentStock <= 0) {
                    const lastSale = branchSales[0] || null;

                    soldOutRecords.push({
                        productId: prod.id,
                        name: prod.name,
                        sku: prod.sku,
                        category: prod.category?.name || "Uncategorized",
                        unitPrice: prod.unitPrice ? parseFloat(prod.unitPrice) : 0,
                        costPrice: prod.costPrice ? parseFloat(prod.costPrice) : 0,
                        branchId: br.id,
                        branchName: br.name,
                        branchCode: br.code,
                        currentStock,
                        isSoldOut: true,
                        totalSoldUnits,
                        lastSoldDate: lastSale?.booking?.bookingDate ? lastSale.booking.bookingDate.toISOString() : null,
                        lastCustomer: lastSale?.booking?.customer?.name || "—",
                        lastBookingNumber: lastSale?.booking?.bookingNumber || null,
                        recentSales: branchSales.slice(0, 10).map(s => ({
                            id: s.id,
                            bookingNumber: s.booking?.bookingNumber,
                            customerName: s.booking?.customer?.name,
                            customerPhone: s.booking?.customer?.phone,
                            date: s.booking?.bookingDate ? s.booking.bookingDate.toISOString() : s.createdAt.toISOString(),
                            quantity: parseFloat(s.quantity) || 1,
                            unitPrice: parseFloat(s.unitPrice) || 0,
                            totalPrice: parseFloat(s.totalPrice) || 0,
                            status: s.booking?.status
                        }))
                    });
                }
            }
        }

        return NextResponse.json({
            soldOutCount: soldOutRecords.length,
            records: soldOutRecords
        });
    } catch (error) {
        console.error("Failed to fetch sold-out history:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch sold out records" }, { status: 500 });
    }
}
