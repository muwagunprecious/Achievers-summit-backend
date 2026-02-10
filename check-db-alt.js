require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function check(url, label) {
    console.log(`\n--- Testing ${label} ---`);
    console.log(`URL: ${url.substring(0, 50)}...`);
    const prisma = new PrismaClient({
        datasources: { db: { url } }
    });
    try {
        await prisma.$connect();
        console.log(`✅ ${label} WORKED!`);
        return true;
    } catch (e) {
        console.log(`❌ ${label} FAILED: ${e.message}`);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function run() {
    const pooler = "postgresql://postgres.fmftcjrjzlhtcjstvklu:dtee00DIgf5V2qnU@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
    const direct = "postgresql://postgres.fmftcjrjzlhtcjstvklu:dtee00DIgf5V2qnU@db.fmftcjrjzlhtcjstvklu.supabase.com:5432/postgres";

    await check(pooler, "Pooler (6543)");
    await check(direct, "Direct (5432)");
}

run();
