const express = require('express');
const router = express.Router();
const { createTicket, getTicket, validateTicket, getTicketCategories } = require('../controllers/ticketController');

/**
 * POST /api/tickets/create
 * Create a new ticket
 */
router.post('/create', createTicket);

/**
 * GET /api/tickets/:id
 * Get ticket by ID
 */
router.get('/:id', getTicket);

/**
 * POST /api/tickets/validate
 * Validate ticket for check-in
 */
router.post('/validate', validateTicket);

/**
 * GET /api/tickets/categories
 * Get all active ticket categories
 */
router.get('/categories', getTicketCategories);

module.exports = router;
