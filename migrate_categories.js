const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting category migration...');

    // 1. Create target categories
    const stitched = await prisma.category.upsert({
        where: { name: 'Stitched' },
        update: {},
        create: { name: 'Stitched', description: 'Readymade items' }
    });
    console.log('Category "Stitched" ready (ID:', stitched.id, ')');

    const suit = await prisma.category.upsert({
        where: { name: 'Suit' },
        update: {},
        create: { name: 'Suit', description: 'Items requiring stitching (needs breakdown)' }
    });
    console.log('Category "Suit" ready (ID:', suit.id, ')');

    // 2. Map existing categories
    // Map 'stitching' and 'unstitched' to 'Suit'
    // Map 'Bottoms' and 'OuterWears' to 'Stitched'

    // Update products currently in 'stitching' or 'unstitched' to 'Suit'
    const suitUpdate = await prisma.product.updateMany({
        where: {
            category: {
                name: { in: ['stitching', 'unstitched'] }
            }
        },
        data: { categoryId: suit.id }
    });
    console.log(`Migrated ${suitUpdate.count} products to "Suit"`);

    // Update products currently in 'Bottoms' or 'OuterWears' to 'Stitched'
    const stitchedUpdate = await prisma.product.updateMany({
        where: {
            category: {
                name: { in: ['Bottoms', 'OuterWears'] }
            }
        },
        data: { categoryId: stitched.id }
    });
    console.log(`Migrated ${stitchedUpdate.count} products to "Stitched"`);

    // 3. Delete old categories if they are empty
    const oldCatNames = ['stitching', 'unstitched', 'Bottoms', 'OuterWears'];
    for (const name of oldCatNames) {
        try {
            const cat = await prisma.category.findUnique({ where: { name } });
            if (cat) {
                // Double check if any products still link to it
                const count = await prisma.product.count({ where: { categoryId: cat.id } });
                if (count === 0) {
                    await prisma.category.delete({ where: { id: cat.id } });
                    console.log(`Deleted empty category: ${name}`);
                } else {
                    console.log(`Skipped deleting ${name}: still has ${count} products (ID: ${cat.id})`);
                }
            }
        } catch (err) {
            console.error(`Error handling category ${name}:`, err.message);
        }
    }

    console.log('Migration complete!');
}

migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
