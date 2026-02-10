const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../config/db');
const { generateTicketPDF } = require('../services/pdfService');
const { sendTicketEmail } = require('../services/emailService');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * POST /api/paystack/webhook
 * Single source of truth for payment success
 */
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-paystack-signature'];
        const body = req.body;

        // 1. Verify Signature
        const hash = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(body))
            .digest('hex');

        if (hash !== signature) {
            console.error('❌ Invalid Paystack signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = body.event;
        const data = body.data;

        if (event === 'charge.success') {
            const { reference, customer, metadata } = data;
            const { fullName, phone, ticketType } = metadata || {};

            console.log(`✅ Payment successful for reference: ${reference}`);

            // 2. Update Transaction Status IMMEDIATELY (High Priority for Frontend)
            // This is what the frontend is polling for.
            try {
                await prisma.transaction.update({
                    where: { reference },
                    data: { status: 'SUCCESS' }
                });
                console.log(`📈 Transaction ${reference} status updated to SUCCESS`);
            } catch (e) {
                console.warn(`⚠️ Transaction record not found for reference ${reference}, continuing with ticket creation...`);
            }

            // 3. Avoid Duplicate Tickets
            const existingTicket = await prisma.eventTicket.findFirst({
                where: { reference }
            });

            if (existingTicket) {
                console.log('ℹ️ Ticket already exists for this reference');
                return res.json({ message: 'Ticket already exists' });
            }

            // 4. Resolve Category (Consistency check)
            const category = await prisma.ticketCategory.findFirst({
                where: { name: ticketType }
            });

            if (!category) {
                console.error(`❌ Invalid ticket category: ${ticketType}`);
                return res.status(400).json({ error: 'Invalid ticket category' });
            }

            // 5. Generate Ticket Record
            const ticketId = `AS2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            const ticket = await prisma.eventTicket.create({
                data: {
                    fullName: fullName || `${customer.first_name} ${customer.last_name}`,
                    email: customer.email,
                    phone: phone || '',
                    ticketType: category.name,
                    ticketPrice: String(category.price),
                    ticketId,
                    reference: reference,
                    status: 'VALID',
                    purchaseDate: new Date(),
                }
            });

            console.log(`🎫 Ticket created: ${ticketId}`);

            // 6. Synchronous Fulfillment (PDF & Email)
            // CRITICAL for Vercel: We MUST await this, otherwise the serverless function
            // freezes immediately after res.json() and the email is never sent.
            try {
                await generateAndSendTicket(ticket, category);
            } catch (err) {
                console.error('❌ Fulfillment failed:', err);
                // We typically still return 200 OK to Paystack because the PAYMENT was successful.
                // If we return 500, Paystack will retry, which might be what we want if email failed temporarily.
                // For now, let's log it.
            }

            return res.json({ message: 'Webhook processed successfully' });
        }

        return res.json({ message: 'Event not handled' });

    } catch (error) {
        console.error('❌ Paystack webhook error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            stack: error.stack
        });
    }
});

/**
 * Internal helper for PDF and Email fulfillment
 */
async function generateAndSendTicket(ticket, category) {
    console.log(`🔍 Starting fulfillment for ${ticket.ticketId}`);

    const pdfBuffer = await generateTicketPDF({
        fullName: ticket.fullName,
        ticketType: category.name,
        ticketPrice: `NGN ${category.price.toLocaleString()}`,
        ticketId: ticket.ticketId
    });

    await sendTicketEmail({
        email: ticket.email,
        fullName: ticket.fullName,
        ticketType: category.name,
        ticketId: ticket.ticketId,
        pdfBuffer
    });

    console.log(`✨ Fulfillment complete for ${ticket.ticketId}`);
}

module.exports = router;
