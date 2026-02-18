const { Client } = require('pg');
require('dotenv').config();

async function test() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting via pg...');
        await client.connect();
        console.log('✅ pg connection successful');
        const res = await client.query('SELECT NOW()');
        console.log('Result:', res.rows[0]);
    } catch (err) {
        console.error('❌ pg connection failed:', err.message);
    } finally {
        await client.end();
    }
}

test();
