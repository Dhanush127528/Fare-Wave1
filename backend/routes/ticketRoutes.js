const express = require('express');
const router = express.Router();
const { bookTicket, getTickets } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.post('/book', protect, bookTicket);
router.get('/history', protect, getTickets);

module.exports = router;
