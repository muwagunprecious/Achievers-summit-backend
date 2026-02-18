const prisma = require('../config/db');

/**
 * GET - Fetch active popups/announcements
 */
const getPopups = async (req, res, next) => {
    try {
        const activePopups = await prisma.popup.findMany({
            where: {
                isEnabled: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ popups: activePopups });
    } catch (error) {
        console.error('Error fetching popups:', error);
        next(error);
    }
};

/**
 * POST - Create new announcement/popup (Admin only)
 */
const createPopup = async (req, res, next) => {
    try {
        const { title, body, ctaText, ctaLink, targetPage, duration } = req.body;

        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const popup = await prisma.popup.create({
            data: {
                id: `popup_${Date.now()}`,
                title,
                body,
                ctaText: ctaText || null,
                ctaLink: ctaLink || null,
                targetPage: targetPage || 'all',
                duration: duration || 5000,
                isEnabled: true
            }
        });

        res.status(201).json({ success: true, popup });
    } catch (error) {
        console.error('Error creating popup:', error);
        next(error);
    }
};

module.exports = {
    getPopups,
    createPopup
};
