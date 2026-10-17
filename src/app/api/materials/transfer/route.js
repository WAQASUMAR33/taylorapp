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
        const materialId = searchParams.get("materialId");
        const branchId = searchParams.get("branchId");
        const limitParam = searchParams.get("limit") || "100";
        const limit = Math.min(Math.max(parseInt(limitParam) || 50, 1), 500);

        const where = {};
        if (materialId) {
            where.materialId = parseInt(materialId);
        }
        if (branchId && branchId !== "ALL") {
            const bId = parseInt(branchId);
            where.OR = [
                { fromBranchId: bId },
                { toBranchId: bId }
            ];
        }

        const transfers = await prisma.material_transfer.findMany({
            where,
            include: {
                material: { select: { id: true, title: true, price: true } },
                fromBranch: { select: { id: true, name: true, code: true } },
                toBranch: { select: { id: true, name: true, code: true } },
                user: { select: { id: true, fullName: true } }
            },
            orderBy: { createdAt: "desc" },
            take: limit
        });

        const formatted = transfers.map(st => ({
            id: st.id,
            materialId: st.materialId,
            fromBranchId: st.fromBranchId,
            toBranchId: st.toBranchId,
            quantity: st.quantity.toString(),
            notes: st.notes,
            userId: st.userId,
            createdAt: st.createdAt.toISOString(),
            materialTitle: st.material?.title,
            fromBranchName: st.fromBranch?.name,
            fromBranchCode: st.fromBranch?.code,
            toBranchName: st.toBranch?.name,
            toBranchCode: st.toBranch?.code,
            userName: st.user?.fullName
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Failed to fetch material transfers:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch material transfers" },
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

        if (!checkPermission(session, "materials", "edit") && !checkPermission(session, "materials", "create")) {
            return NextResponse.json(
                { error: "Permission Denied: You do not have permission to transfer material stock" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { materialId, fromBranchId, toBranchId, quantity, notes } = body;

        if (!materialId) {
            return NextResponse.json({ error: "Material is required" }, { status: 400 });
        }

        const mId = parseInt(materialId);
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
            // 1. Fetch material with existing branchStocks
            const material = await tx.material.findUnique({
                where: { id: mId },
                include: {
                    branchStocks: {
                        include: { branch: true }
                    }
                }
            });

            if (!material) {
                throw new Error("Material not found");
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
            const fromStockRecord = material.branchStocks?.find(bs => bs.branchId === fromId);
            let currentFromQty = fromStockRecord ? parseFloat(fromStockRecord.quantity || 0) : 0;

            // Handle legacy material where branchStocks is not yet seeded (fallback to main branch)
            if ((!material.branchStocks || material.branchStocks.length === 0) && fromId === 1) {
                currentFromQty = parseFloat(material.quantity || 0);
            }

            if (currentFromQty < transferQty) {
                throw new Error(`Insufficient stock in "${fromBranch.name}". Available: ${currentFromQty} units, Requested: ${transferQty} units.`);
            }

            // 4. Determine current stock at toBranch
            const toStockRecord = material.branchStocks?.find(bs => bs.branchId === toId);
            let currentToQty = toStockRecord ? parseFloat(toStockRecord.quantity || 0) : 0;

            const newFromQty = Math.max(0, currentFromQty - transferQty);
            const newToQty = currentToQty + transferQty;

            // 5. Update / Upsert source branch stock
            await tx.branch_material_stock.upsert({
                where: {
                    branchId_materialId: {
                        branchId: fromId,
                        materialId: mId
                    }
                },
                create: {
                    branchId: fromId,
                    materialId: mId,
                    quantity: newFromQty
                },
                update: {
                    quantity: newFromQty
                }
            });

            // 6. Update / Upsert destination branch stock
            await tx.branch_material_stock.upsert({
                where: {
                    branchId_materialId: {
                        branchId: toId,
                        materialId: mId
                    }
                },
                create: {
                    branchId: toId,
                    materialId: mId,
                    quantity: newToQty
                },
                update: {
                    quantity: newToQty
                }
            });

            // 7. Ensure total material quantity reflects total stock across branches
            const allBranchStocks = await tx.branch_material_stock.findMany({
                where: { materialId: mId }
            });

            const totalQuantity = allBranchStocks.reduce(
                (sum, bs) => sum + parseFloat(bs.quantity || 0),
                0
            );

            await tx.material.update({
                where: { id: mId },
                data: { quantity: totalQuantity }
            });

            // 8. Create material_transfer audit record
            const transferRecord = await tx.material_transfer.create({
                data: {
                    materialId: mId,
                    fromBranchId: fromId,
                    toBranchId: toId,
                    quantity: transferQty,
                    notes: notes || null,
                    userId: session?.user?.id ? parseInt(session.user.id) : null
                },
                include: {
                    material: { select: { id: true, title: true } },
                    fromBranch: { select: { id: true, name: true, code: true } },
                    toBranch: { select: { id: true, name: true, code: true } },
                    user: { select: { id: true, fullName: true } }
                }
            });

            // 9. Create materialmovement entries for audit and records
            await tx.materialmovement.create({
                data: {
                    materialId: mId,
                    type: "OUT",
                    quantity: transferQty,
                    notes: `Transfer OUT to ${toBranch.name}${notes ? ` - ${notes}` : ""}`
                }
            });

            await tx.materialmovement.create({
                data: {
                    materialId: mId,
                    type: "IN",
                    quantity: transferQty,
                    notes: `Transfer IN from ${fromBranch.name}${notes ? ` - ${notes}` : ""}`
                }
            });

            return {
                transfer: transferRecord,
                newFromQty,
                newToQty,
                totalQuantity
            };
        });

        return NextResponse.json({
            success: true,
            message: `Successfully transferred ${transferQty} units of ${result.transfer.material?.title} from ${result.transfer.fromBranch?.name} to ${result.transfer.toBranch?.name}`,
            data: result
        }, { status: 201 });

    } catch (error) {
        console.error("Material stock transfer failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process material stock transfer" },
            { status: 400 }
        );
    }
}
