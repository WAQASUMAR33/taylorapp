import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const RESET_PASSWORD = "DildilPakistan786@786@waqas";

const ALLOWED_TABLES = [
    "ledgerentry",
    "purchase_payment",
    "purchase_item",
    "booking_item_stitching_option",
    "booking_item",
    "booking_staff",
    "stockmovement",
    "materialmovement",
    "bill_item",
    "bill",
    "measurement",
    "order",
    "booking",
    "purchase",
    "material",
    "product",
    "bank",
    "employee",
    "customer",
    "accountcategory",
    "category",
    "expense",
    "stitching_option"
];

export async function POST(req) {
    try {
        const { password, tables } = await req.json();

        if (password !== RESET_PASSWORD) {
            return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
        }

        // If no tables are provided or empty, delete all allowed tables
        let tablesToDelete = [];
        if (!tables || !Array.isArray(tables) || tables.length === 0) {
            tablesToDelete = ALLOWED_TABLES;
        } else {
            // Validate all passed tables are in the whitelist
            for (const table of tables) {
                if (!ALLOWED_TABLES.includes(table)) {
                    return NextResponse.json({ error: `Invalid table selection: ${table}` }, { status: 400 });
                }
            }
            tablesToDelete = tables;
        }

        // Sort tables to delete based on dependency order (children first)
        const orderMap = {};
        ALLOWED_TABLES.forEach((table, index) => {
            orderMap[table] = index;
        });
        tablesToDelete.sort((a, b) => orderMap[a] - orderMap[b]);

        // Run deletion sequentially inside a transaction on a single connection
        await prisma.$transaction(async (tx) => {
            await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");
            for (const table of tablesToDelete) {
                await tx.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
            }
            await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset data error:", error);
        return NextResponse.json({ error: "Failed to reset data. Please try again." }, { status: 500 });
    }
}

