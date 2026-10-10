import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");
        const branchId = searchParams.get("branchId");
        const limitParam = searchParams.get("limit") || "100";
        const limit = Math.min(Math.max(parseInt(limitParam) || 50, 1), 500);

        let whereClauses = [];

        if (productId) {
            whereClauses.push(`st.productId = ${parseInt(productId)}`);
        }
        if (branchId && branchId !== "ALL") {
            const bId = parseInt(branchId);
            whereClauses.push(`(st.fromBranchId = ${bId} OR st.toBranchId = ${bId})`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        const transfers = await prisma.$queryRawUnsafe(`
            SELECT 
                st.id,
                st.productId,
                st.fromBranchId,
                st.toBranchId,
                CAST(st.quantity AS CHAR) AS quantity,
                st.notes,
                st.userId,
                st.createdAt,
                p.name AS productName,
                p.sku AS productSku,
                fb.name AS fromBranchName,
                fb.code AS fromBranchCode,
                tb.name AS toBranchName,
                tb.code AS toBranchCode,
                u.fullName AS userName
            FROM stock_transfer st
            JOIN product p ON st.productId = p.id
            JOIN branch fb ON st.fromBranchId = fb.id
            JOIN branch tb ON st.toBranchId = tb.id
            LEFT JOIN user u ON st.userId = u.id
            ${whereSql}
            ORDER BY st.createdAt DESC
            LIMIT ${limit}
        `);

        return NextResponse.json(transfers);
    } catch (error) {
        console.error("Failed to fetch stock transfers:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch stock transfers" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!checkPermission(session, "products", "edit")) {
            return NextResponse.json(
                { error: "Permission Denied: You do not have permission to transfer stock" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { productId, fromBranchId, toBranchId, quantity, notes } = body;

        if (!productId) {
            return NextResponse.json({ error: "Product is required" }, { status: 400 });
        }

        const pId = parseInt(productId);
        const fromId = parseInt(fromBranchId);
        const toId = parseInt(toBranchId);
        const transferQty = parseFloat(quantity);

        if (!fromId || !toId) {
            return NextResponse.json({ error: "Both source (From) and destination (To) branch stores are required" }, { status: 400 });
        }

        if (fromId === toId) {
            return NextResponse.json({ error: "Source and destination branch stores cannot be the same" }, { status: 400 });
        }

        if (isNaN(transferQty) || transferQty <= 0) {
            return NextResponse.json({ error: "Transfer quantity must be greater than 0" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch product with existing branchStocks
            const product = await tx.product.findUnique({
                where: { id: pId },
                include: {
                    branchStocks: {
                        include: { branch: true }
                    }
                }
            });

            if (!product) {
                throw new Error("Product not found");
            }

            // 2. Fetch both branches
            const [fromBranch, toBranch] = await Promise.all([
                tx.branch.findUnique({ where: { id: fromId } }),
                tx.branch.findUnique({ where: { id: toId } })
            ]);

            if (!fromBranch) {
                throw new Error("Source branch not found");
            }
            if (!toBranch) {
                throw new Error("Destination branch not found");
            }

            // 3. Determine available stock at fromBranch
            const fromStockRecord = product.branchStocks?.find(bs => bs.branchId === fromId);
            let currentFromQty = fromStockRecord ? parseFloat(fromStockRecord.quantity || 0) : 0;

            // Handle legacy product with quantity on product model if branchStocks is not yet seeded
            if ((!product.branchStocks || product.branchStocks.length === 0) && fromId === 1) {
                currentFromQty = parseFloat(product.quantity || 0);
            }

            if (currentFromQty < transferQty) {
                throw new Error(`Insufficient stock in "${fromBranch.name}". Available: ${currentFromQty} units, Requested: ${transferQty} units.`);
            }

            // 4. Determine current stock at toBranch
            const toStockRecord = product.branchStocks?.find(bs => bs.branchId === toId);
            let currentToQty = toStockRecord ? parseFloat(toStockRecord.quantity || 0) : 0;

            const newFromQty = Math.max(0, currentFromQty - transferQty);
            const newToQty = currentToQty + transferQty;

            // 5. Update / Upsert source branch stock
            await tx.branch_product_stock.upsert({
                where: {
                    branchId_productId: {
                        branchId: fromId,
                        productId: pId
                    }
                },
                create: {
                    branchId: fromId,
                    productId: pId,
                    quantity: newFromQty
                },
                update: {
                    quantity: newFromQty
                }
            });

            // 6. Update / Upsert destination branch stock
            await tx.branch_product_stock.upsert({
                where: {
                    branchId_productId: {
                        branchId: toId,
                        productId: pId
                    }
                },
                create: {
                    branchId: toId,
                    productId: pId,
                    quantity: newToQty
                },
                update: {
                    quantity: newToQty
                }
            });

            // 7. Recalculate total product network quantity
            const allBranchStocks = await tx.branch_product_stock.findMany({
                where: { productId: pId }
            });

            const totalQuantity = allBranchStocks.reduce(
                (sum, bs) => sum + parseFloat(bs.quantity || 0),
                0
            );

            const updatedProduct = await tx.product.update({
                where: { id: pId },
                data: {
                    quantity: totalQuantity
                },
                include: {
                    category: true,
                    branchStocks: {
                        include: {
                            branch: {
                                select: { id: true, name: true, code: true, isActive: true }
                            }
                        }
                    }
                }
            });

            // 8. Record stock movements for audit history
            const unitCost = product.costPrice ? parseFloat(product.costPrice) : null;
            const userId = session?.user?.id ? parseInt(session.user.id) : null;

            // OUT from source
            await tx.stockmovement.create({
                data: {
                    productId: pId,
                    branchId: fromId,
                    type: "OUT",
                    quantity: transferQty,
                    unitCost,
                    notes: `Transfer OUT to ${toBranch.name}${notes ? ` (${notes})` : ""}`,
                    userId
                }
            });

            // IN to destination
            await tx.stockmovement.create({
                data: {
                    productId: pId,
                    branchId: toId,
                    type: "IN",
                    quantity: transferQty,
                    unitCost,
                    notes: `Transfer IN from ${fromBranch.name}${notes ? ` (${notes})` : ""}`,
                    userId
                }
            });

            // 9. Record in dedicated stock_transfer table
            await tx.$executeRaw`
                INSERT INTO stock_transfer (productId, fromBranchId, toBranchId, quantity, notes, userId, createdAt)
                VALUES (${pId}, ${fromId}, ${toId}, ${transferQty}, ${notes ? notes.trim() : null}, ${userId}, NOW())
            `;

            return updatedProduct;
        });

        return NextResponse.json({
            success: true,
            message: `Successfully transferred ${transferQty} units of "${result.name}"`,
            product: result
        });
    } catch (error) {
        console.error("Stock transfer error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to transfer stock" },
            { status: 400 }
        );
    }
}
