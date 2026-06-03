require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
const Ride = require('./models/Ride');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const user = await User.findOne({ email: 'dhanush@example.com' });
    if (!user) throw new Error("User not found");

    // 1. Create a ticket
    const ticket = await Ticket.create({
      user: user._id,
      source: 'Station A',
      destination: 'Station B',
      qrCode: 'test_qr_12345',
      fareEstimate: 50,
      distanceEstimate: 10,
      status: 'Active'
    });
    console.log("Ticket created:", ticket.qrCode);

    // 2. Check In
    const activeTicket = await Ticket.findOne({ qrCode: 'test_qr_12345', status: 'Active' });
    if (!activeTicket) throw new Error("Ticket not active");
    
    const ride = await Ride.create({
      user: activeTicket.user,
      ticket: activeTicket._id,
      source: activeTicket.source,
      destination: activeTicket.destination,
      fare: activeTicket.fareEstimate,
      distance: activeTicket.distanceEstimate,
      checkInTime: new Date(),
      status: 'Ongoing'
    });
    activeTicket.status = 'Used';
    await activeTicket.save();
    console.log("Check-in successful");

    // 3. Check Out
    const outTicket = await Ticket.findOne({ qrCode: 'test_qr_12345' });
    const ongoingRide = await Ride.findOne({ ticket: outTicket._id, status: 'Ongoing' });
    if (!ongoingRide) throw new Error("Ride not found");

    const rideUser = await User.findById(ongoingRide.user);
    if (rideUser.walletBalance < ongoingRide.fare) {
      console.log("Insufficient balance!");
      // artificially give balance
      rideUser.walletBalance = 1000;
    }
    
    rideUser.walletBalance -= ongoingRide.fare;
    const earnedCoins = Math.floor(ongoingRide.fare * 0.1);
    rideUser.fareWaveCoins += earnedCoins;
    await rideUser.save();

    ongoingRide.checkOutTime = new Date();
    ongoingRide.status = 'Completed';
    ongoingRide.coinsEarned = earnedCoins;
    await ongoingRide.save();

    console.log("Check-out successful! Balance:", rideUser.walletBalance, "Coins:", rideUser.fareWaveCoins);
  } catch (err) {
    console.error("Test Error:", err);
  }
  process.exit(0);
}).catch(console.error);
