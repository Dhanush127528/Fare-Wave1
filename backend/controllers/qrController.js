const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');
const Ride = require('../models/Ride');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Check in with QR code
// @route   POST /api/qr/check-in
// @access  Private
const checkIn = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;
  try {
    // 1. Mathematically verify the QR code signature offline first!
    const decoded = jwt.verify(qrCode, process.env.JWT_SECRET);
    
    if (decoded.type !== 'TRANSIT_TICKET') {
      throw new Error('Invalid ticket type');
    }
    
    // 2. Lookup the ticket in the DB to ensure it hasn't already been used
    const ticket = await Ticket.findOne({ qrCode, status: 'Active' });

    if (!ticket) {
      res.status(400);
      throw new Error('Ticket has already been used or does not exist');
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.name === 'TokenExpiredError' ? 'Ticket has expired' : 'Invalid or forged ticket signature');
  }

  // Create a new ongoing ride
  const ride = await Ride.create({
    user: ticket.user,
    ticket: ticket._id,
    source: ticket.source,
    destination: ticket.destination,
    fare: ticket.fareEstimate,
    distance: ticket.distanceEstimate,
    checkInTime: new Date(),
    status: 'Ongoing'
  });

  // Mark ticket as Used
  ticket.status = 'Used';
  await ticket.save();

  res.status(200).json({ message: 'Checked in successfully', ride });
});

// @desc    Check out with QR code
// @route   POST /api/qr/check-out
// @access  Private
const checkOut = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;
  try {
    // Mathematically verify the QR signature
    jwt.verify(qrCode, process.env.JWT_SECRET);
    
    const ticket = await Ticket.findOne({ qrCode });
    if (!ticket) {
      res.status(400);
      throw new Error('Invalid ticket data');
    }

    const ride = await Ride.findOne({ ticket: ticket._id, status: 'Ongoing' });

    if (!ride) {
      res.status(400);
      throw new Error('Invalid ride or already checked out');
    }

    const user = await User.findById(ride.user);

    // Deduct fare
  if (user.walletBalance < ride.fare) {
    res.status(400);
    throw new Error('Insufficient wallet balance. Please recharge.');
  }

  user.walletBalance -= ride.fare;
  
  // Add reward coins (e.g., 10% of fare)
  const earnedCoins = Math.floor(ride.fare * 0.1);
  user.fareWaveCoins += earnedCoins;
  await user.save();

    // Complete ride
    ride.checkOutTime = new Date();
    ride.status = 'Completed';
    ride.coinsEarned = earnedCoins;
    await ride.save();

    res.status(200).json({ message: 'Checked out successfully', ride, userBalance: user.walletBalance, coins: earnedCoins });
  } catch (error) {
    res.status(400);
    throw new Error(error.name === 'TokenExpiredError' ? 'Ticket has expired' : error.message || 'Invalid ticket signature');
  }
});

module.exports = {
  checkIn,
  checkOut
};
