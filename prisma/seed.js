require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // Hash the password
    const passwordHash = await bcrypt.hash('786ninja', 10);

    // Create admin user
    const admin = await prisma.user.upsert({
        where: { username: 'theitxprts@gmail.com' },
        update: {},
        create: {
            fullName: 'Admin User',
            username: 'theitxprts@gmail.com',
            email: 'theitxprts@gmail.com',
            phone: null,
            role: 'ADMIN',
            passwordHash: passwordHash,
            isActive: true,
        },
    });

    console.log('Admin user created:', admin);

    // Create default categories
    const categories = [
        { name: 'Stitched', description: 'Readymade items' },
        { name: 'Suit', description: 'Items requiring stitching (needs breakdown)' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: cat,
        });
    }
    console.log('Default categories created/verified');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
