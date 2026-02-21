const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAccountCategories() {
    console.log('Seeding account categories...');

    const categories = [
        { name: 'Regular' },
        { name: 'VIP' },
        { name: 'Wholesale' },
        { name: 'Corporate' },
    ];

    for (const category of categories) {
        await prisma.accountCategory.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
        console.log(`✓ Created/Updated category: ${category.name}`);
    }

    console.log('Account categories seeded successfully!');
}

seedAccountCategories()
    .catch((e) => {
        console.error('Error seeding account categories:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
