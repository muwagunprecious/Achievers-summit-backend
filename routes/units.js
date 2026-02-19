const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// GET /api/units
router.get('/', async (req, res) => {
    try {
        const units = await prisma.volunteerUnit.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch units' });
    }
});

// POST /api/units
router.post('/', async (req, res) => {
    try {
        const unit = await prisma.volunteerUnit.create({
            data: req.body
        });
        res.status(201).json(unit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create unit' });
    }
});

// PUT /api/units
router.put('/', async (req, res) => {
    try {
        const { id, ...data } = req.body;
        const unit = await prisma.volunteerUnit.update({
            where: { id },
            data
        });
        res.json(unit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update unit' });
    }
});

// DELETE /api/units
router.delete('/', async (req, res) => {
    try {
        const { id } = req.query;
        await prisma.volunteerUnit.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete unit' });
    }
});

module.exports = router;
