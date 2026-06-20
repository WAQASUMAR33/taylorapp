import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { customers } = body;

        if (!Array.isArray(customers) || customers.length === 0) {
            return NextResponse.json(
                { error: "No customer records provided" },
                { status: 400 }
            );
        }

        // 1. Resolve and pre-create categories in bulk
        const dbCategories = await prisma.accountCategory.findMany();
        const categoriesMap = new Map(
            dbCategories.map(c => [c.name.toLowerCase().trim(), c.id])
        );

        const inputCategories = Array.from(new Set(
            customers.map(c => c.category?.toString().trim()).filter(Boolean)
        ));
        
        const missingCategories = inputCategories.filter(
            cat => !categoriesMap.has(cat.toLowerCase())
        );

        if (missingCategories.length > 0) {
            await prisma.accountCategory.createMany({
                data: missingCategories.map(name => ({ name })),
                skipDuplicates: true
            });
            // Re-fetch category mappings
            const updatedDbCategories = await prisma.accountCategory.findMany();
            updatedDbCategories.forEach(c => categoriesMap.set(c.name.toLowerCase().trim(), c.id));
        }

        // 2. Prepare customer records list
        const customersToInsert = [];
        const uniqueBatchPrefix = `TEMP-IMP-${Date.now()}`;
        let successCount = 0;
        let skippedCount = 0;
        const skippedDetails = [];

        customers.forEach((cust, idx) => {
            const name = cust.name?.toString().trim();
            if (!name) {
                skippedCount++;
                skippedDetails.push({ name: "Unnamed Row", reason: "Missing Name field" });
                return;
            }

            const code = cust.code?.toString().trim() || null;
            // Generate a temporary code if none is provided to match auto-increment IDs later
            const resolvedCode = code || `${uniqueBatchPrefix}-${idx}`;
            const balance = parseFloat(cust.balance) || 0;
            const category = cust.category?.toString().trim() || "";
            const accountCategoryId = category ? categoriesMap.get(category.toLowerCase()) : null;

            customersToInsert.push({
                name,
                code: resolvedCode,
                phone: cust.phone?.toString().trim() || null,
                email: cust.email?.toString().trim() || null,
                address: cust.address?.toString().trim() || null,
                fatherName: cust.fatherName?.toString().trim() || null,
                measurementNo: cust.measurementNo?.toString().trim() || null,
                accountCategoryId,
                notes: cust.notes?.toString().trim() || null,
                balance: balance,
            });
            successCount++;
        });

        if (customersToInsert.length === 0) {
            return NextResponse.json({
                success: true,
                imported: 0,
                skipped: skippedCount,
                skippedDetails
            });
        }

        // 3. Batch insert using transaction for database integrity
        const totalImported = await prisma.$transaction(async (tx) => {
            // A. Create customers in bulk
            await tx.customer.createMany({
                data: customersToInsert
            });

            // B. Fetch generated auto-increment IDs using the lookups
            const insertedCodes = customersToInsert.map(c => c.code);
            const dbCustomers = await tx.customer.findMany({
                where: { code: { in: insertedCodes } },
                select: { id: true, code: true }
            });
            const dbCustomersMap = new Map(dbCustomers.map(c => [c.code, c.id]));

            // C. Create ledger entries for opening balances in bulk
            const ledgerEntriesToInsert = [];
            customersToInsert.forEach(cust => {
                const balance = parseFloat(cust.balance) || 0;
                if (balance !== 0) {
                    const dbId = dbCustomersMap.get(cust.code);
                    if (dbId) {
                        ledgerEntriesToInsert.push({
                            customerId: dbId,
                            type: balance > 0 ? "DEBIT" : "CREDIT",
                            amount: Math.abs(balance),
                            description: "Opening Balance",
                            entryDate: new Date(),
                        });
                    }
                }
            });

            if (ledgerEntriesToInsert.length > 0) {
                await tx.ledgerentry.createMany({
                    data: ledgerEntriesToInsert
                });
            }

            // D. Set the temporary codes back to null
            const tempCodes = insertedCodes.filter(c => c.startsWith("TEMP-IMP-"));
            if (tempCodes.length > 0) {
                await tx.customer.updateMany({
                    where: { code: { in: tempCodes } },
                    data: { code: null }
                });
            }

            return dbCustomers.length;
        }, {
            maxWait: 15000,
            timeout: 60000
        });

        return NextResponse.json({
            success: true,
            imported: totalImported,
            skipped: skippedCount,
            skippedDetails
        });

    } catch (error) {
        console.error("Error importing customers:", error);
        return NextResponse.json(
            { error: "Internal Server Error during customer import: " + error.message },
            { status: 500 }
        );
    }
}
