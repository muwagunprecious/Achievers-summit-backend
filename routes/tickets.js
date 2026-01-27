const express = require('express');
const router = express.Router();
const { createTicket, getTicket, validateTicket, getTicketCategories, searchTicket } = require('../controllers/ticketController');

/**
 * POST /api/tickets/create
 * Create a new ticket
 */
router.post('/create', createTicket);

/**
 * GET /api/tickets/categories
 * Get all active ticket categories
 */
router.get('/categories', getTicketCategories);

/**
 * GET /api/tickets/debug-db
 * Debug database connection and tables
 */
router.get('/debug-db', async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const result = await prisma.$queryRawUnsafe("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        const tables = result.map(row => row.tablename);

        // Mask the database URL for security, reveal host
        const dbUrl = process.env.DATABASE_URL || 'NOT SET';
        const hostPart = dbUrl.split('@')[1] || 'UNKNOWN';
        const host = hostPart.split('/')[0];

        res.json({
            status: 'ok',
            database_host: host,
            tables,
            env: process.env.NODE_ENV
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            db_env_set: !!process.env.DATABASE_URL,
            host_detected: process.env.DATABASE_URL ? (process.env.DATABASE_URL.split('@')[1] || '').split('/')[0] : 'NONE'
        });
    }
});

/**
 * GET /api/tickets/search
 * Search for tickets
 */
router.get('/search', searchTicket);

/**
 * POST /api/tickets/validate
 * Validate ticket for check-in
 */
router.post('/validate', validateTicket);

/**
 * GET /api/tickets/:id
 * Get ticket by ID
 */
router.get('/:id', getTicket);

module.exports = router;
