const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.accountCategory.findMany();
    console.log('Account Categories:', JSON.stringify(categories, null, 2));

    const suppliers = await prisma.customer.findMany({
        include: { accountCategory: true }
    });
    console.log('All Customers/Suppliers:', JSON.stringify(suppliers.map(s => ({
        id: s.id,
        name: s.name,
        category: s.accountCategory?.name
    })), null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
