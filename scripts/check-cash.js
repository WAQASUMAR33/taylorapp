const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCash() {
    const banks = await prisma.bank.findMany();
    console.log('Banks:', JSON.stringify(banks, null, 2));

    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { name: { contains: 'Cash' } },
                { code: { contains: 'Cash' } }
            ]
        }
    });
    console.log('Cash Customers:', JSON.stringify(customers, null, 2));

    const accountCategories = await prisma.accountCategory.findMany();
    console.log('Account Categories:', JSON.stringify(accountCategories, null, 2));

    await prisma.$disconnect();
}

checkCash();
