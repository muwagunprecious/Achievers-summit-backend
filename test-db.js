require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@/]+@/, ':***@'));

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Attempting DB connection...');
        await prisma.$connect();
        console.log('✅ Database connection successful');

        const counts = await Promise.all([
            prisma.ticketCategory.count(),
            prisma.popup.count()
        ]);
        console.log('Categories count:', counts[0]);
        console.log('Popups count:', counts[1]);

    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(error.message);
        if (error.code) console.error('Error Code:', error.code);
    } finally {
        await prisma.$disconnect();
    }
}

test();
