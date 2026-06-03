require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const user = await User.findOne({});
    if (!user) {
      console.log("No user found");
      process.exit(1);
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    
    const cookie = `jwt=${token};`;
    
    const fakeOrderId = "order_12345";
    const fakePaymentId = "pay_67890";
    const sign = fakeOrderId + "|" + fakePaymentId;
    const fakeSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    const verifyRes = await axios.post('http://localhost:5000/api/auth/verify-razorpay-payment', {
      razorpay_order_id: fakeOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: fakeSignature,
      amount: "100"
    }, {
      headers: { Cookie: cookie }
    });

    console.log("Success:", verifyRes.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
  process.exit(0);
}).catch(console.error);
