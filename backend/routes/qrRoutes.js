const express = require('express');
const router = express.Router();
const { checkIn, checkOut } = require('../controllers/qrController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);

module.exports = router;
