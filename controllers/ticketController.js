const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Legacy ticket creation (Disabled in favor of Next.js API route)
 */
async function createTicket(req, res) {
    return res.status(410).json({
        error: 'This endpoint is deprecated. Use the frontend registration flow.',
        code: 'ENDPOINT_DEPRECATED'
    });
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
            return res.json({ status: 'INVALID', message: 'Ticket not found' });
        }

        if (ticket.status === 'USED') {
            return res.json({ status: 'USED', ticket, message: 'Ticket already used' });
        }

        const updatedTicket = await prisma.eventTicket.update({
            where: { ticketId },
            data: { status: 'USED' }
        });

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
