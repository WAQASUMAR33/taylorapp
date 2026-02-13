const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Ensure a "Cash Account" customer exists for tracking petty cash / cash in hand
    let cashAccount = await prisma.customer.findFirst({
        where: { name: 'Cash Account' }
    });

    if (!cashAccount) {
        console.log('Creating Cash Account customer...');
        cashAccount = await prisma.customer.create({
            data: {
                name: 'Cash Account',
                code: 'CASH-001',
                notes: 'System account for tracking cash transactions'
            }
        });
    }

    console.log('Cash Account ID:', cashAccount.id);
    await prisma.$disconnect();
}

main();
