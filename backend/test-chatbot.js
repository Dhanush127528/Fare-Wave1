require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const user = await User.findOne({ email: 'dhanush@example.com' });
    
    // Simulate req
    const req = {
      body: { message: "Book ticket from Silk Institute to Vijaynagar" },
      user: user
    };
    
    const res = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { console.log(JSON.stringify(data, null, 2)); }
    };
    
    const { processMessage } = require('./controllers/chatbotController');
    await processMessage(req, res);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});
