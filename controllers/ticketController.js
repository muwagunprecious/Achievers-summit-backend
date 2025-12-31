const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyPayment } = require('../services/paystackService');

/**
 * Create a new ticket after payment verification
 */
/**
 * Create a new ticket after payment verification
 */
async function createTicket(req, res) {
    try {
        console.log("📝 Incoming CreateTicket Body:", JSON.stringify(req.body, null, 2));
        const { fullName, email, phone, ticketType, reference } = req.body;

        if (!fullName || !email || !ticketType || !reference) {
            console.warn("❌ Missing required fields");
            return res.status(400).json({
                error: 'Missing required fields',
                code: 'MISSING_FIELDS'
            });
        }

        // 1. Verify Payment with Paystack
        console.log(`🔐 Verifying payment reference: ${reference}`);
        const verification = await verifyPayment(reference);

        if (!verification.success) {
            return res.status(400).json({
                error: 'Payment verification failed',
                details: verification.message,
                code: 'PAYMENT_FAILED'
            });
        }

        if (verification.status !== 'success') {
            return res.status(400).json({
                error: 'Payment was not successful',
                status: verification.status,
                code: 'PAYMENT_NOT_SUCCESS'
            });
        }

        // 2. Validate Currency
        if (verification.currency !== 'NGN') {
            return res.status(400).json({
                error: 'Invalid currency',
                code: 'INVALID_CURRENCY'
            });
        }

        // 3. Validate Amount against Ticket Category
        // Find category (case-insensitive if possible, or exact)
        const category = await prisma.ticketCategory.findFirst({
            where: {
                name: ticketType
            }
        });

        if (!category) {
            console.warn(`⚠️ Ticket category '${ticketType}' not found for validation. Proceeding with caution.`);
            // Option: Fail strict? Or Allow? 
            // implementation_plan said "Validate amount against ticket category".
            // If we can't find category, we can't validate amount.
            // Let's assume for now we trust the payment if it is "success" BUT log a warning.
            // OR safer: rely on what the user paid.
            // However, strict requirement: "Validate amount against ticket category"
            // If missing, I should probably return error or use a fallback mechanism.
            // I'll return an error to be safe.
            return res.status(400).json({
                error: 'Invalid Ticket Type',
                code: 'INVALID_TICKET_TYPE'
            });
        }

        // Check amount (Paystack returns exact amount paid in NGN)
        // category.price is Float.
        if (verification.amount < category.price) {
            return res.status(400).json({
                error: `Insufficient payment. Expected ${category.price}, got ${verification.amount}`,
                code: 'INSUFFICIENT_FUNDS'
            });
        }

        // 4. Check for Duplicate Reference
        const existingRef = await prisma.eventTicket.findFirst({
            where: { reference }
        });

        if (existingRef) {
            return res.status(200).json(existingRef); // Idempotency: return existing ticket
        }

        // 5. Generate Unique Ticket ID
        const generateTicketId = () => {
            const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
            return `AS2026-${randomPart}`;
        };

        let ticketId = generateTicketId();
        // Ensure uniqueness (paranoid check)
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

        // 6. Create Ticket
        const ticket = await prisma.eventTicket.create({
            data: {
                fullName,
                email,
                phone: phone || '',
                ticketType: category.name, // Normalize name
                ticketPrice: String(category.price), // Store as string per schema
                ticketId,
                reference,
                status: 'VALID',
                purchaseDate: new Date(verification.paidAt || new Date())
            }
        });

        console.log(`✅ Ticket created successfully: ${ticketId}`);

        res.status(201).json(ticket);

    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({
            error: 'Failed to create ticket',
            code: 'TICKET_CREATION_FAILED'
        });
    }
}

/**
 * Get ticket by ID
 */
async function getTicket(req, res) {
    try {
        const { id } = req.params;

        const ticket = await prisma.eventTicket.findUnique({
            where: { ticketId: id }
        });

        if (!ticket) {
            return res.status(404).json({
                error: 'Ticket not found',
                code: 'TICKET_NOT_FOUND'
            });
        }

        res.json(ticket);

    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({
            error: 'Failed to fetch ticket',
            code: 'FETCH_FAILED'
        });
    }
}

/**
 * Validate ticket for check-in
 */
async function validateTicket(req, res) {
    try {
        const { ticketId } = req.body;

        const ticket = await prisma.eventTicket.findUnique({
            where: { ticketId }
        });

        if (!ticket) {
            return res.json({
                status: 'INVALID',
                message: 'Ticket not found'
            });
        }

        if (ticket.status === 'USED') {
            return res.json({
                status: 'USED',
                ticket,
                message: 'Ticket already used'
            });
        }

        // Update to USED
        const updatedTicket = await prisma.eventTicket.update({
            where: { ticketId },
            data: { status: 'USED' }
        });

        console.log(`✅ Ticket validated and marked as USED: ${ticketId}`);

        res.json({
            status: 'VALID',
            ticket: updatedTicket,
            message: 'Ticket valid and checked in'
        });

    } catch (error) {
        console.error('Error validating ticket:', error);
        res.status(500).json({
            error: 'Validation failed',
            code: 'VALIDATION_FAILED'
        });
    }
}

module.exports = {
    createTicket,
    getTicket,
    validateTicket
};
