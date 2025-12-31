const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

module.exports = router;
