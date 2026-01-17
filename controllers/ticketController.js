const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new ticket
exports.createTicket = async (req, res) => {
    try {
        console.log('🎟️ Create Ticket Request:', req.body);
        const { ticketType, fullName, email, phone, paymentReference } = req.body;

        // 1. Find or Create User
        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('👤 Creating new user for ticket...');
            user = await prisma.user.create({
                data: {
                    id: 'usr_' + Math.random().toString(36).substr(2, 9),
                    name: fullName,
                    email,
                    phone
                }
            });
            console.log('✅ User created:', user.id);
        } else {
            console.log('✅ Existing user found:', user.id);
        }

        // 2. Resolve Ticket Category
        console.log('🔍 Resolving category for:', ticketType);
        // Try to find by ID first (if ticketType is ID), otherwise by Name
        let category = await prisma.ticketCategory.findFirst({
            where: {
                OR: [
                    { id: ticketType },
                    { name: ticketType }
                ]
            }
        });

        if (!category) {
            // Fallback: Try matching by name containing the string (e.g. "REGULAR" in "REGULAR PASS")
            // This is a fuzzy match attempt if exact match fails
            console.log('⚠️ Exact match failed, trying fuzzy match...');
            category = await prisma.ticketCategory.findFirst({
                where: {
                    name: { contains: ticketType.split(' ')[0] }
                }
            });
        }

        if (!category) {
            console.error('❌ Invalid ticket category:', ticketType);
            return res.status(400).json({ error: 'Invalid ticket category' });
        }
        console.log('✅ Category resolved:', category.name);

        // 3. Generate Ticket
        const ticketNumber = 'TICKET-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const ticket = await prisma.ticket.create({
            data: {
                id: 'tkt_' + Math.random().toString(36).substr(2, 9),
                ticketNumber,
                userId: user.id,
                ticketCategoryId: category.id,
                status: 'VALID'
            },
            include: {
                category: true,
                user: true
            }
        });

        console.log('✅ Ticket created successfully:', ticket.ticketNumber);
        res.status(201).json(ticket);
    } catch (error) {
        console.error('❌ Create Ticket Error:', error);
        res.status(500).json({ error: 'Error creating ticket', details: error.message });
    }
};

// Get ticket by ID
exports.getTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                category: true,
                user: true
            }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching ticket', details: error.message });
    }
};

// Validate ticket
exports.validateTicket = async (req, res) => {
    try {
        const { ticketNumber } = req.body;
        const ticket = await prisma.ticket.findUnique({
            where: { ticketNumber },
            include: { user: true, category: true }
        });

        if (!ticket) {
            return res.status(404).json({ valid: false, message: 'Invalid ticket number' });
        }

        res.status(200).json({ valid: true, ticket });
    } catch (error) {
        res.status(500).json({ error: 'Error validating ticket', details: error.message });
    }
};

// Get all ticket categories
exports.getTicketCategories = async (req, res) => {
    try {
        const categories = await prisma.ticketCategory.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { price: 'asc' }
        });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching categories', details: error.message });
    }
};
