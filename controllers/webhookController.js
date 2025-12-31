const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Handle Paystack Webhook
 * POST /api/payments/webhook
 */
async function handlePaystackWebhook(req, res) {
    try {
        // 1. Verify Signature
        const signature = req.headers['x-paystack-signature'];
        if (!signature) {
            return res.status(400).send('Missing signature');
        }

        const payload = JSON.stringify(req.body);
        const hash = crypto.createHmac('sha512', SECRET_KEY)
            .update(payload)
            .digest('hex');

        if (hash !== signature) {
            console.error('❌ Webhook Signature Verification Failed');
            return res.status(400).send('Invalid signature');
        }

        // 2. Handle Event
        const event = req.body;
        console.log(`🔔 Webhook received: ${event.event} for reference ${event.data.reference}`);

        if (event.event === 'charge.success') {
            await handleChargeSuccess(event.data);
        }

        // Always return 200 OK to Paystack
        res.sendStatus(200);

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.sendStatus(500);
    }
}

/**
 * Handle successful charge event
 */
async function handleChargeSuccess(data) {
    const { reference, metadata, amount, currency, paid_at, customer } = data;
    const { fullName, phone, ticketType } = metadata || {};

    try {
        // 1. Check Idempotency (Does ticket already exist?)
        const existingTicket = await prisma.eventTicket.findFirst({
            where: { reference }
        });

        if (existingTicket) {
            console.log(`ℹ️ Ticket already exists for reference: ${reference}`);
            return;
        }

        console.log(`🆕 Creating ticket from webhook for: ${reference}`);

        // 2. Find Category
        // Note: We trust metadata's ticketType or default to something safe if missing?
        // If metadata is missing, we might have an issue.
        if (!ticketType) {
            console.error('⚠️ Missing ticketType in webhook metadata');
            return;
        }

        const category = await prisma.ticketCategory.findFirst({
            where: { name: ticketType }
        });

        if (!category) {
            console.error(`❌ Category not found for webhook ticket: ${ticketType}`);
            return;
        }

        // 3. Generate Ticket ID
        const generateTicketId = () => {
            const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
            return `AS2026-${randomPart}`;
        };

        let ticketId = generateTicketId();
        // Ensure uniqueness
        let isUnique = false;
        let retries = 0;
        while (!isUnique && retries < 5) {
            const check = await prisma.eventTicket.findUnique({ where: { ticketId } });
            if (!check) isUnique = true;
            else {
                ticketId = generateTicketId();
                retries++;
            }
        }

        // 4. Create Ticket
        const ticket = await prisma.eventTicket.create({
            data: {
                fullName: fullName || customer.first_name + ' ' + (customer.last_name || '') || 'Unknown',
                email: customer.email,
                phone: phone || '',
                ticketType: category.name,
                ticketPrice: String(category.price),
                ticketId,
                reference,
                status: 'VALID',
                purchaseDate: new Date(paid_at || new Date())
            }
        });

        console.log(`✅ Ticket created via Webhook: ${ticketId}`);

    } catch (error) {
        console.error('❌ Failed to create ticket in webhook:', error);
        // We catch here so we don't crash the main webhook handler (which needs to return 200)
    }
}

module.exports = {
    handlePaystackWebhook
};
