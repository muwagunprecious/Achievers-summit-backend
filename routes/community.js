const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// POST /api/community/volunteer
router.post('/volunteer', async (req, res) => {
    try {
        const body = req.body;
        const volunteer = await prisma.volunteer.create({
            data: {
                fullName: body.fullName,
                email: body.email,
                phone1: body.phone1,
                state: body.state,
                lga: body.lga,
                phone2: body.phone2,
                unitSection: body.unitSection,
                unitSubSection: body.unitSubSection,
                whyVolunteer: body.whyVolunteer,
                availableWorkshop: body.availableWorkshop,
                unavailableWhy: body.unavailableWhy || null,
            }
        });

        // Track activity
        await prisma.activity.create({
            data: {
                title: 'New Volunteer Application',
                description: `${body.fullName} applied for ${body.unitSubSection}`,
                type: 'info'
            }
        });

        res.status(201).json({ success: true, volunteer });
    } catch (error) {
        console.error('Backend Volunteer Error:', error);
        res.status(500).json({ error: 'Failed to save application' });
    }
});

// POST /api/community/ambassador
router.post('/ambassador', async (req, res) => {
    try {
        const body = req.body;
        const ambassador = await prisma.ambassador.create({
            data: {
                fullName: body.fullName,
                email: body.email,
                phone1: body.phone1,
                state: body.state,
                lga: body.lga,
                phone2: body.phone2,
                status: body.status,
                institution: body.institution || null,
                outsideLagosInst: body.outsideLagosInst || null,
                profGraduateInfo: body.profGraduateInfo || null,
                availableActivation: body.availableActivation,
                unavailableWhy: body.unavailableWhy || null,
            }
        });

        // Track activity
        await prisma.activity.create({
            data: {
                title: 'New Ambassador Application',
                description: `${body.fullName} applied as ${body.status}`,
                type: 'info'
            }
        });

        res.status(201).json({ success: true, ambassador });
    } catch (error) {
        console.error('Backend Ambassador Error:', error);
        res.status(500).json({ error: 'Failed to save application' });
    }
});

// GET /api/community/volunteers (Admin only potentially, but currently no auth in backend)
router.get('/volunteers', async (req, res) => {
    try {
        const volunteers = await prisma.volunteer.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(volunteers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch volunteers' });
    }
});

// GET /api/community/ambassadors
router.get('/ambassadors', async (req, res) => {
    try {
        const ambassadors = await prisma.ambassador.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(ambassadors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ambassadors' });
    }
});

module.exports = router;
