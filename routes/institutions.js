const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// GET /api/institutions
router.get('/', async (req, res) => {
    try {
        const institutions = await prisma.institution.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(institutions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch institutions' });
    }
});

// POST /api/institutions
router.post('/', async (req, res) => {
    try {
        const inst = await prisma.institution.create({
            data: req.body
        });
        res.status(201).json(inst);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create institution' });
    }
});

// PUT /api/institutions
router.put('/', async (req, res) => {
    try {
        const { id, ...data } = req.body;
        const inst = await prisma.institution.update({
            where: { id },
            data
        });
        res.json(inst);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update institution' });
    }
});

// DELETE /api/institutions
router.delete('/', async (req, res) => {
    try {
        const { id } = req.query;
        await prisma.institution.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete institution' });
    }
});

module.exports = router;
