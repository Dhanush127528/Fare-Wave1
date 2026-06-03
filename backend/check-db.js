require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({});
  users.forEach(u => {
    console.log(`User: ${u.email}, Wallet: ${u.walletBalance}`);
  });
  process.exit(0);
}).catch(console.error);
