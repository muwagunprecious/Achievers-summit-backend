const prisma = require('../config/db');

// Get all speakers
exports.getAllSpeakers = async (req, res) => {
    try {
        const speakers = await prisma.speaker.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(speakers);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching speakers', details: error.message });
    }
};

// Get single speaker
exports.getSpeakerById = async (req, res) => {
    try {
        const { id } = req.params;
        const speaker = await prisma.speaker.findUnique({
            where: { id }
        });

        if (!speaker) {
            return res.status(404).json({ error: 'Speaker not found' });
        }

        res.status(200).json(speaker);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching speaker', details: error.message });
    }
};

// Create new speaker
exports.createSpeaker = async (req, res) => {
    try {
        const { name, title, bio, topic, image, twitter, linkedin, facebook } = req.body;

        const newSpeaker = await prisma.speaker.create({
            data: {
                name,
                title,
                bio,
                topic,
                image,
                twitter,
                linkedin,
                facebook
            }
        });

        res.status(201).json(newSpeaker);
    } catch (error) {
        res.status(500).json({ error: 'Error creating speaker', details: error.message });
    }
};

// Update speaker
exports.updateSpeaker = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, title, bio, topic, image, twitter, linkedin, facebook } = req.body;

        const updatedSpeaker = await prisma.speaker.update({
            where: { id },
            data: {
                name,
                title,
                bio,
                topic,
                image,
                twitter,
                linkedin,
                facebook
            }
        });

        res.status(200).json(updatedSpeaker);
    } catch (error) {
        res.status(500).json({ error: 'Error updating speaker', details: error.message });
    }
};

// Delete speaker
exports.deleteSpeaker = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.speaker.delete({
            where: { id }
        });

        res.status(200).json({ message: 'Speaker deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting speaker', details: error.message });
    }
};
