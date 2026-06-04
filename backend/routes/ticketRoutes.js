const express = require('express');
const router = express.Router();
const { bookTicket, getTickets, calculateFare } = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.post('/book', protect, bookTicket);
router.get('/history', protect, getTickets);
router.post('/calculate-fare', protect, calculateFare);

module.exports = router;
