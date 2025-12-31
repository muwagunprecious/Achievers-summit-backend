const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/bookings
 * Fetch all stand bookings (Admin)
 */
router.get('/', async (req, res) => {
    try {
        const bookings = await prisma.standBooking.findMany({
            orderBy: {
                submissionDate: 'desc'
            }
        });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

/**
 * POST /api/bookings/create
 * Create a new stand booking
 */
router.post('/create', async (req, res) => {
    try {
        const { bookingId, orgName, contactName, email, phone, standType, notes } = req.body;

        if (!bookingId || !orgName || !contactName || !email) {
            return res.status(400).json({
                error: 'Missing required fields',
                code: 'MISSING_FIELDS'
            });
        }

        const booking = await prisma.standBooking.create({
            data: {
                bookingId,
                orgName,
                contactName,
                email,
                phone: phone || '',
                standType,
                notes: notes || '',
                status: 'Pending',
                submissionDate: new Date()
            }
        });

        console.log(`✅ Booking created: ${bookingId}`);
        res.status(201).json(booking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({
            error: 'Failed to create booking',
            code: 'BOOKING_CREATION_FAILED'
        });
    }
});

/**
 * PATCH /api/bookings/:id
 * Update booking status (Admin)
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const booking = await prisma.standBooking.update({
            where: { id },
            data: { status }
        });

        res.json(booking);
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

module.exports = router;
