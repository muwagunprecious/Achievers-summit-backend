const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

/**
 * POST /api/payments/initialize
 * Creates a pending transaction record before sending user to Paystack
 */
router.post('/initialize', async (req, res) => {
    try {
        const { reference, email, fullName, phone, amount, ticketType } = req.body;

        if (!reference || !email || !amount || !ticketType) {
            return res.status(400).json({ error: 'Missing required payment fields' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                reference,
                email,
                fullName: fullName || '',
                phone: phone || '',
                amount: parseFloat(amount),
                ticketType,
                status: 'PENDING'
            }
        });

        console.log(`💳 Transaction initialized: ${reference}`);
        res.status(201).json(transaction);
    } catch (error) {
        console.error('❌ Payment initialization error:', error);
        res.status(500).json({ error: 'Failed to initialize payment' });
    }
});

/**
 * GET /api/payments/status
 * Check the status of a transaction for frontend polling
 */
router.get('/status', async (req, res) => {
    try {
        const { reference } = req.query;

        if (!reference) {
            return res.status(400).json({ error: 'Reference is required' });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { reference }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({
            status: transaction.status,
            reference: transaction.reference,
            updatedAt: transaction.updatedAt
        });
    } catch (error) {
        console.error('❌ Status check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
