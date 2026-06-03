const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// @desc    Book a new ticket
// @route   POST /api/ticket/book
// @access  Private
const bookTicket = asyncHandler(async (req, res) => {
  const { source, destination, fareEstimate, distanceEstimate } = req.body;

  if (!source || !destination) {
    res.status(400);
    throw new Error('Source and destination are required');
  }

  if (source === destination) {
    res.status(400);
    throw new Error('Source and destination cannot be the same');
  }

  if (req.user.walletBalance < 80) {
    res.status(400);
    throw new Error('Insufficient wallet balance. Minimum ₹80 required to book a ticket.');
  }

  // Generate a Cryptographically Verifiable QR Code using JWT
  const qrPayload = {
    source,
    destination,
    userId: req.user._id,
    fareEstimate: fareEstimate || 50,
    distanceEstimate: distanceEstimate || 15,
    jti: uuidv4(),
    type: 'TRANSIT_TICKET'
  };

  const qrString = jwt.sign(qrPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

  const ticket = await Ticket.create({
    user: req.user._id,
    source,
    destination,
    qrCode: qrString,
    status: 'Active',
    fareEstimate: fareEstimate || 50, // default dummy fare if not provided
    distanceEstimate: distanceEstimate || 15,
  });

  res.status(201).json(ticket);
});

// @desc    Get user tickets
// @route   GET /api/ticket/history
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(tickets);
});

module.exports = {
  bookTicket,
  getTickets,
};
