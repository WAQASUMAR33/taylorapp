const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Sorting by name asc:");
    const ascList = await prisma.customer.findMany({
        where: {
            AND: [
                { OR: [ { accountCategory: null }, { accountCategory: { name: { not: { contains: "cutter" } } } } ] },
                { OR: [ { accountCategory: null }, { accountCategory: { name: { not: { contains: "tailor" } } } } ] }
            ]
        },
        orderBy: { name: 'asc' },
        take: 5
    });
    console.log(ascList.map(c => c.name));

    console.log("\nSorting by name desc:");
    const descList = await prisma.customer.findMany({
        where: {
            AND: [
                { OR: [ { accountCategory: null }, { accountCategory: { name: { not: { contains: "cutter" } } } } ] },
                { OR: [ { accountCategory: null }, { accountCategory: { name: { not: { contains: "tailor" } } } } ] }
            ]
        },
        orderBy: { name: 'desc' },
        take: 5
    });
    console.log(descList.map(c => c.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
