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

        // Fetch existing codes, phones, and categories to perform efficient matching
        const existingCustomers = await prisma.customer.findMany({
            select: { code: true, phone: true }
        });
        const existingCodes = new Set(
            existingCustomers.map(c => c.code?.toLowerCase().trim()).filter(Boolean)
        );
        const existingPhones = new Set(
            existingCustomers.map(c => c.phone?.toLowerCase().trim()).filter(Boolean)
        );

        const dbCategories = await prisma.accountCategory.findMany();
        const categoriesMap = new Map(
            dbCategories.map(c => [c.name.toLowerCase().trim(), c.id])
        );

        let successCount = 0;
        let skippedCount = 0;
        const skippedDetails = [];

        // Process imports in a transaction to ensure integrity
        const result = await prisma.$transaction(async (tx) => {
            const importedList = [];

            for (const cust of customers) {
                const name = cust.name?.toString().trim();
                const code = cust.code?.toString().trim() || "";
                const phone = cust.phone?.toString().trim() || "";
                const email = cust.email?.toString().trim() || "";
                const address = cust.address?.toString().trim() || "";
                const fatherName = cust.fatherName?.toString().trim() || "";
                const measurementNo = cust.measurementNo?.toString().trim() || "";
                const category = cust.category?.toString().trim() || "";
                const notes = cust.notes?.toString().trim() || "";
                const openingBalance = parseFloat(cust.balance) || 0;

                // 1. Validation: Name is required
                if (!name) {
                    skippedCount++;
                    skippedDetails.push({ name: "Unnamed Row", reason: "Missing Name field" });
                    continue;
                }


                // 3. Validation: Phone must be unique (if provided)
                if (phone && existingPhones.has(phone.toLowerCase())) {
                    skippedCount++;
                    skippedDetails.push({ name, phone, reason: `Phone number "${phone}" already exists` });
                    continue;
                }

                // 4. Resolve account category
                let accountCategoryId = null;
                if (category) {
                    const key = category.toLowerCase();
                    if (categoriesMap.has(key)) {
                        accountCategoryId = categoriesMap.get(key);
                    } else {
                        // Create the category on the fly if it doesn't exist
                        const newCat = await tx.accountCategory.create({
                            data: { name: category }
                        });
                        categoriesMap.set(key, newCat.id);
                        accountCategoryId = newCat.id;
                    }
                }

                const resolvedCode = code || null;
                if (phone) existingPhones.add(phone.toLowerCase());

                // 5. Create customer
                const newCustomer = await tx.customer.create({
                    data: {
                        name,
                        code: resolvedCode,
                        phone: phone || null,
                        email: email || null,
                        address: address || null,
                        fatherName: fatherName || null,
                        measurementNo: measurementNo || null,
                        accountCategoryId,
                        notes: notes || null,
                        balance: 0, // set by ledger opening entry if non-zero
                    }
                });

                // 6. Handle opening balance and ledger entry
                if (openingBalance !== 0) {
                    await tx.ledgerentry.create({
                        data: {
                            customerId: newCustomer.id,
                            type: openingBalance > 0 ? "DEBIT" : "CREDIT",
                            amount: Math.abs(openingBalance),
                            description: "Opening Balance",
                            entryDate: new Date(),
                        }
                    });

                    await tx.customer.update({
                        where: { id: newCustomer.id },
                        data: { balance: openingBalance }
                    });
                }

                successCount++;
                importedList.push(newCustomer);
            }

            return importedList;
        }, {
            maxWait: 10000,
            timeout: 60000
        });

        return NextResponse.json({
            success: true,
            imported: successCount,
            skipped: skippedCount,
            skippedDetails
        });

    } catch (error) {
        console.error("Error importing customers:", error);
        return NextResponse.json(
            { error: "Internal Server Error during customer import" },
            { status: 500 }
        );
    }
}
