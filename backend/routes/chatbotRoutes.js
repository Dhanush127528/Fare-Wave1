const express = require('express');
const router = express.Router();
const { processMessage } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

router.post('/message', protect, processMessage);

module.exports = router;
