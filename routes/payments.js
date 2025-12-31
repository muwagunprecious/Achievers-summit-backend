const express = require('express');
const router = express.Router();
const { verifyPayment } = require('../services/paystackService');
const { handlePaystackWebhook } = require('../controllers/webhookController');

/**
 * GET /api/payments/reference
 * Generate a unique payment reference
 */
router.get('/reference', (req, res) => {
    const reference = 'AS-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    res.json({ reference });
});

/**
 * POST /api/payments/webhook
 * Handle Paystack Webhook events
 */
router.post('/webhook', handlePaystackWebhook);

/**
 * POST /api/payments/verify
 * Verify a Paystack payment
 */
router.post('/verify', async (req, res) => {
    try {
        const { reference } = req.body;

        if (!reference) {
            return res.status(400).json({
                error: 'Payment reference is required',
                code: 'MISSING_REFERENCE'
            });
        }

        const result = await verifyPayment(reference);

        if (!result.success) {
            return res.status(400).json({
                verified: false,
                message: result.message,
                code: 'PAYMENT_FAILED'
            });
        }

        res.json({
            verified: true,
            payment: result
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            error: 'Payment verification failed',
            code: 'VERIFICATION_ERROR',
            message: error.message
        });
    }
});

module.exports = router;
