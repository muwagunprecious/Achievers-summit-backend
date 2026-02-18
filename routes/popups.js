const express = require('express');
const router = express.Router();
const { getPopups, createPopup } = require('../controllers/popupController');

/**
 * GET /api/popups
 * Fetch active popups/announcements
 */
router.get('/', getPopups);

/**
 * POST /api/popups
 * Create a new announcement/popup
 */
router.post('/', createPopup);

module.exports = router;
