const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    const cashAccount = await prisma.customer.findFirst({ where: { name: 'Cash Account' } });
    if (!cashAccount) {
        console.log('Cash Account not found. Run ensure-cash-account script first.');
        return;
    }

    // Find all ledger entries that look like booking advances
    const entries = await prisma.ledgerentry.findMany({
        where: {
            description: { contains: 'Advance Payment' },
            NOT: { customerId: cashAccount.id }
        },
        include: { customer: true }
    });

    console.log(`Found ${entries.length} potential cash entries.`);

    for (const entry of entries) {
        // Check if duplicate already exists in cash account
        const duplicate = await prisma.ledgerentry.findFirst({
            where: {
                customerId: cashAccount.id,
                amount: entry.amount,
                entryDate: entry.entryDate,
                description: { contains: entry.customer.name }
            }
        });

        if (!duplicate) {
            console.log(`Migrating entry: ${entry.description} for ${entry.customer.name}`);
            const amount = parseFloat(entry.amount.toString());

            await prisma.$transaction([
                prisma.ledgerentry.create({
                    data: {
                        customerId: cashAccount.id,
                        type: 'DEBIT', // Advances are cash in
                        amount: amount,
                        description: `Advance from ${entry.customer.name} (Migrated)`,
                        entryDate: entry.entryDate
                    }
                }),
                prisma.customer.update({
                    where: { id: cashAccount.id },
                    data: { balance: { increment: amount } }
                })
            ]);
        }
    }

    console.log('Migration complete.');
    await prisma.$disconnect();
}

migrate();
