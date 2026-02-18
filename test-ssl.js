require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Testing with SSL and explicit connection parameters
const testUrl = "postgresql://postgres.fmftcjrjzlhtcjstvklu:dtee00DIgf5V2qnU@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true";

console.log('Testing URL:', testUrl.substring(0, 30) + '...');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: testUrl
        }
    }
});

async function test() {
    try {
        console.log('Attempting DB connection (Manual URL)...');
        await prisma.$connect();
        console.log('✅ Database connection successful');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

test();
