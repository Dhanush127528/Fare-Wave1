require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

razorpay.orders.create({
  amount: 10000,
  currency: 'INR',
  receipt: 'receipt_64ab1c2d3e4f5g6h7i8j9k0l_1716491955000',
}).then(order => {
  console.log("Order Success:", order);
}).catch(err => {
  console.error("Order Error:", err);
});
