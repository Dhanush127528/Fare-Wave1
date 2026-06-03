const express = require('express');
const router = express.Router();
const { getRideHistory, getRideAnalytics } = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');

router.get('/history', protect, getRideHistory);
router.get('/analytics', protect, getRideAnalytics);

module.exports = router;
