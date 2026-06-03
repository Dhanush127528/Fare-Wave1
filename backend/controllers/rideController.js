const asyncHandler = require('express-async-handler');
const Ride = require('../models/Ride');

// @desc    Get user ride history
// @route   GET /api/rides/history
// @access  Private
const getRideHistory = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(rides);
});

// @desc    Get user ride analytics
// @route   GET /api/rides/analytics
// @access  Private
const getRideAnalytics = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ user: req.user._id, status: 'Completed' });
  
  const totalRides = rides.length;
  const totalSpent = rides.reduce((acc, ride) => acc + ride.fare, 0);
  const totalDistance = rides.reduce((acc, ride) => acc + ride.distance, 0);
  const coinsEarned = rides.reduce((acc, ride) => acc + ride.coinsEarned, 0);

  // Group by month for chart
  const monthlyData = {};
  rides.forEach(ride => {
    const month = new Date(ride.createdAt).toLocaleString('default', { month: 'short' });
    if (!monthlyData[month]) {
      monthlyData[month] = { name: month, rides: 0, spent: 0 };
    }
    monthlyData[month].rides += 1;
    monthlyData[month].spent += ride.fare;
  });

  res.status(200).json({
    totalRides,
    totalSpent,
    totalDistance,
    coinsEarned,
    monthlyChart: Object.values(monthlyData)
  });
});

module.exports = {
  getRideHistory,
  getRideAnalytics
};
