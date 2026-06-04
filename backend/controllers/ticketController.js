const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const stationCoordinates = require('../utils/stationCoordinates');

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

// @desc    Calculate exact fare using OSRM OpenStreetMap routing
// @route   POST /api/ticket/calculate-fare
// @access  Private
const calculateFare = asyncHandler(async (req, res) => {
  const { source, destination } = req.body;

  if (!source || !destination) {
    res.status(400);
    throw new Error('Source and destination are required');
  }

  if (source === destination) {
    res.status(400);
    throw new Error('Source and destination cannot be the same');
  }

  const srcCoords = stationCoordinates[source];
  const destCoords = stationCoordinates[destination];

  if (!srcCoords || !destCoords) {
    res.status(400);
    throw new Error('Invalid station selected');
  }

  try {
    // OSRM expects: longitude,latitude
    const url = `http://router.project-osrm.org/route/v1/driving/${srcCoords.lon},${srcCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`;
    
    // Using native fetch (Node 18+)
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('Routing engine failed');
    }

    const distanceMeters = data.routes[0].distance;
    const distanceKm = Number((distanceMeters / 1000).toFixed(1));
    
    // ₹2.5 per km
    let fare = Math.ceil(distanceKm * 2.5);
    // Minimum fare of ₹10
    if (fare < 10) fare = 10;

    res.status(200).json({
      distance: distanceKm,
      fare: fare
    });
  } catch (error) {
    console.error('OSRM Routing Error:', error);
    // Fallback if OSRM fails
    res.status(200).json({
      distance: 15,
      fare: 50
    });
  }
});

module.exports = {
  bookTicket,
  getTickets,
  calculateFare,
};
