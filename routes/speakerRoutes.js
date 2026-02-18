const express = require('express');
const router = express.Router();
const speakerController = require('../controllers/speakerController');

// Get all speakers
router.get('/', speakerController.getAllSpeakers);

// Get single speaker
router.get('/:id', speakerController.getSpeakerById);

// Create new speaker
router.post('/', speakerController.createSpeaker);

// Update speaker
router.put('/:id', speakerController.updateSpeaker);

// Delete speaker
router.delete('/:id', speakerController.deleteSpeaker);

module.exports = router;
