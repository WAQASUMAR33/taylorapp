import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!checkPermission(session, "products", "view")) {
            return NextResponse.json(
                { error: "Permission Denied: You do not have permission to view products" },
                { status: 403 }
            );
        }

        let products = [];
        try {
            products = await prisma.product.findMany({
                include: {
                    category: true,
                    branchStocks: {
                        include: {
                            branch: {
                                select: { id: true, name: true, code: true, isActive: true }
                            }
                        }
                    }
                },
                orderBy: { name: "asc" },
            });
        } catch (includeErr) {
            console.warn("Retrying api products without branchStocks:", includeErr.message);
            products = await prisma.product.findMany({
                include: { category: true },
                orderBy: { name: "asc" },
            });
        }

        return NextResponse.json(products);
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!checkPermission(session, "products", "create")) {
            return NextResponse.json(
                { error: "Permission Denied: You do not have permission to create products" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { sku, name, description, costPrice, unitPrice, branchStocks, quantity, branchId } = body;

        if (!sku || !name) {
            return NextResponse.json(
                { error: "Code and Name are required" },
                { status: 400 }
            );
        }

        // Calculate branch-wise stocks
        let branchStockEntries = [];
        let totalQuantity = 0;

        if (branchStocks && typeof branchStocks === "object") {
            // Can be { "1": 5, "2": 3 } or array
            if (Array.isArray(branchStocks)) {
                branchStockEntries = branchStocks.map(bs => ({
                    branchId: parseInt(bs.branchId),
                    quantity: parseFloat(bs.quantity) || 0
                }));
            } else {
                branchStockEntries = Object.entries(branchStocks).map(([bId, qty]) => ({
                    branchId: parseInt(bId),
                    quantity: parseFloat(qty) || 0
                }));
            }
            totalQuantity = branchStockEntries.reduce((sum, item) => sum + item.quantity, 0);
        } else if (quantity !== undefined) {
            const qtyNum = parseFloat(quantity) || 0;
            const bId = branchId ? parseInt(branchId) : (session?.user?.branchId || 1);
            branchStockEntries = [{ branchId: bId, quantity: qtyNum }];
            totalQuantity = qtyNum;
        }

        const product = await prisma.$transaction(async (tx) => {
            const newProd = await tx.product.create({
                data: {
                    sku,
                    name,
                    description,
                    quantity: totalQuantity,
                    costPrice: costPrice ? parseFloat(costPrice) : null,
                    unitPrice: unitPrice ? parseFloat(unitPrice) : null,
                },
            });

            // If we have branch stock entries, insert them
            if (branchStockEntries.length > 0) {
                for (const item of branchStockEntries) {
                    if (item.branchId) {
                        await tx.branch_product_stock.create({
                            data: {
                                branchId: item.branchId,
                                productId: newProd.id,
                                quantity: item.quantity
                            }
                        });

                        // Optionally record initial stock movement
                        if (item.quantity > 0) {
                            await tx.stockmovement.create({
                                data: {
                                    productId: newProd.id,
                                    branchId: item.branchId,
                                    type: "IN",
                                    quantity: item.quantity,
                                    unitCost: costPrice ? parseFloat(costPrice) : null,
                                    notes: "Initial branch store stock",
                                    userId: session?.user?.id ? parseInt(session.user.id) : null
                                }
                            });
                        }
                    }
                }
            }

            return tx.product.findUnique({
                where: { id: newProd.id },
                include: {
                    branchStocks: {
                        include: {
                            branch: {
                                select: { id: true, name: true, code: true, isActive: true }
                            }
                        }
                    }
                }
            });
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Failed to create product:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A product with this SKU already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!checkPermission(session, "products", "edit")) {
            return NextResponse.json(
                { error: "Permission Denied: You do not have permission to edit products" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { id, sku, name, description, costPrice, unitPrice, branchStocks, quantity, branchId } = body;

        if (!id || !sku || !name) {
            return NextResponse.json(
                { error: "ID, Code and Name are required" },
                { status: 400 }
            );
        }

        const prodId = parseInt(id);

        const updatedProduct = await prisma.$transaction(async (tx) => {
            // Process branch-wise stock updates if provided
            if (branchStocks && typeof branchStocks === "object") {
                let entries = [];
                if (Array.isArray(branchStocks)) {
                    entries = branchStocks.map(bs => ({
                        branchId: parseInt(bs.branchId),
                        quantity: parseFloat(bs.quantity) || 0
                    }));
                } else {
                    entries = Object.entries(branchStocks).map(([bId, qty]) => ({
                        branchId: parseInt(bId),
                        quantity: parseFloat(qty) || 0
                    }));
                }

                for (const item of entries) {
                    if (item.branchId) {
                        await tx.branch_product_stock.upsert({
                            where: {
                                branchId_productId: {
                                    branchId: item.branchId,
                                    productId: prodId
                                }
                            },
                            create: {
                                branchId: item.branchId,
                                productId: prodId,
                                quantity: item.quantity
                            },
                            update: {
                                quantity: item.quantity
                            }
                        });
                    }
                }
            } else if (quantity !== undefined && branchId) {
                const bId = parseInt(branchId);
                const qty = parseFloat(quantity) || 0;
                await tx.branch_product_stock.upsert({
                    where: {
                        branchId_productId: {
                            branchId: bId,
                            productId: prodId
                        }
                    },
                    create: {
                        branchId: bId,
                        productId: prodId,
                        quantity: qty
                    },
                    update: {
                        quantity: qty
                    }
                });
            }

            // Recalculate total stock from all branch stores
            const allBranchStocks = await tx.branch_product_stock.findMany({
                where: { productId: prodId }
            });

            const totalQuantity = allBranchStocks.reduce(
                (sum, bs) => sum + parseFloat(bs.quantity || 0),
                0
            );

            return tx.product.update({
                where: { id: prodId },
                data: {
                    sku,
                    name,
                    description,
                    quantity: allBranchStocks.length > 0 ? totalQuantity : (quantity ? parseFloat(quantity) : 0),
                    costPrice: costPrice !== undefined && costPrice !== "" ? parseFloat(costPrice) : null,
                    unitPrice: unitPrice !== undefined && unitPrice !== "" ? parseFloat(unitPrice) : null,
                },
                include: {
                    branchStocks: {
                        include: {
                            branch: {
                                select: { id: true, name: true, code: true, isActive: true }
                            }
                        }
                    }
                }
            });
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("Failed to update product:", error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "A product with this SKU already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!checkPermission(session, "products", "delete")) {
            return NextResponse.json(
                { error: "Permission Denied: You do not have permission to delete products" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        const prodId = parseInt(id);

        // Check if product is being used in any purchase items or booking items
        const product = await prisma.product.findUnique({
            where: { id: prodId },
            include: {
                _count: {
                    select: {
                        purchaseItems: true,
                        bookingItems: true
                    }
                }
            }
        });

        if (product?._count.purchaseItems > 0 || product?._count.bookingItems > 0) {
            return NextResponse.json(
                { error: "Cannot delete product that has purchase or booking history" },
                { status: 400 }
            );
        }

        await prisma.product.delete({
            where: { id: prodId },
        });

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Failed to delete product:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
