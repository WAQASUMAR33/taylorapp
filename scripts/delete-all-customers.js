const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllCustomers() {
    console.log("Starting deletion of all customer records...");

    try {
        await prisma.$transaction(async (tx) => {
            console.log("Disabling foreign key checks...");
            await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

            console.log("Deleting all records from 'customer' table...");
            const deleteCount = await tx.$executeRawUnsafe("DELETE FROM `customer`;");
            console.log(`Deleted customer records.`);

            // Optionally, we also delete related ledger entries and measurements to avoid orphan records
            console.log("Deleting related customer data (ledgerentry, measurement)...");
            await tx.$executeRawUnsafe("DELETE FROM `ledgerentry`;");
            await tx.$executeRawUnsafe("DELETE FROM `measurement`;");

            console.log("Enabling foreign key checks...");
            await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
        }, {
            timeout: 30000
        });

        console.log("Successfully deleted all customer accounts and their direct ledger entries & measurements!");
    } catch (error) {
        console.error("Error deleting customer accounts:", error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllCustomers();
