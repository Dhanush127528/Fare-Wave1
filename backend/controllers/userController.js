const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      walletBalance: user.walletBalance,
      fareWaveCoins: user.fareWaveCoins,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      walletBalance: user.walletBalance,
      fareWaveCoins: user.fareWaveCoins,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

// @desc    Create Razorpay Order
// @route   POST /api/auth/create-razorpay-order
// @access  Private
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid amount');
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount: amount * 100, // Razorpay uses paise
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500);
    throw new Error('Error creating Razorpay order');
  }
});

// @desc    Verify Razorpay Payment & Add to Wallet
// @route   POST /api/auth/verify-razorpay-payment
// @access  Private
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Payment is mathematically valid, now prevent replay attacks!
    const user = await User.findById(req.user._id);
    
    if (user) {
      if (user.processedPayments && user.processedPayments.includes(razorpay_payment_id)) {
        res.status(400);
        throw new Error('This payment has already been processed (Replay Attack blocked)');
      }

      user.walletBalance += Number(amount);
      user.processedPayments.push(razorpay_payment_id);
      await user.save();
      
      res.status(200).json({
        message: "Payment verified successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          walletBalance: user.walletBalance,
          fareWaveCoins: user.fareWaveCoins,
        }
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } else {
    res.status(400);
    throw new Error('Invalid payment signature');
  }
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
