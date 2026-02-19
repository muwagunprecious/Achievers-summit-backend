const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// GET /api/ambassador-status
router.get('/', async (req, res) => {
    try {
        const statuses = await prisma.ambassadorStatus.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch status options' });
    }
});

// POST /api/ambassador-status
router.post('/', async (req, res) => {
    try {
        const status = await prisma.ambassadorStatus.create({
            data: req.body
        });
        res.status(201).json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create status' });
    }
});

// PUT /api/ambassador-status
router.put('/', async (req, res) => {
    try {
        const { id, ...data } = req.body;
        const status = await prisma.ambassadorStatus.update({
            where: { id },
            data
        });
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// DELETE /api/ambassador-status
router.delete('/', async (req, res) => {
    try {
        const { id } = req.query;
        await prisma.ambassadorStatus.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete status' });
    }
});

module.exports = router;
