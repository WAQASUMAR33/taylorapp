const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateBalances() {
    console.log("Starting balance recalculation...");

    try {
        const customers = await prisma.customer.findMany({
            include: {
                ledgerEntries: true
            }
        });

        console.log(`Found ${customers.length} customers.`);

        for (const customer of customers) {
            let runningBalance = 0;

            for (const entry of customer.ledgerEntries) {
                const amount = parseFloat(entry.amount);
                if (entry.type === 'DEBIT') {
                    runningBalance += amount;
                } else if (entry.type === 'CREDIT') {
                    runningBalance -= amount;
                }
            }

            // Update the customer balance
            await prisma.customer.update({
                where: { id: customer.id },
                data: {
                    balance: runningBalance
                }
            });

            console.log(`Updated Customer ID ${customer.id} (${customer.name}): New Balance = ${runningBalance.toFixed(2)}`);
        }

        console.log("Balance recalculation completed successfully!");
    } catch (error) {
        console.error("Error during recalculation:", error);
    } finally {
        await prisma.$disconnect();
    }
}

recalculateBalances();
