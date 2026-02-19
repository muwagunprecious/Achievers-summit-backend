const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// GET /api/faq
router.get('/', async (req, res) => {
    try {
        const faqs = await prisma.fAQ.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(faqs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
});

// POST /api/faq
router.post('/', async (req, res) => {
    try {
        const faq = await prisma.fAQ.create({
            data: req.body
        });
        res.status(201).json(faq);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create FAQ' });
    }
});

// PUT /api/faq
router.put('/', async (req, res) => {
    try {
        const { id, ...data } = req.body;
        const faq = await prisma.fAQ.update({
            where: { id },
            data
        });
        res.json(faq);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update FAQ' });
    }
});

// DELETE /api/faq
router.delete('/', async (req, res) => {
    try {
        const { id } = req.query;
        await prisma.fAQ.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete FAQ' });
    }
});

module.exports = router;
