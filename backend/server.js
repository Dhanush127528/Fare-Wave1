const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
// Note: We'll uncomment this once MongoDB is actually running, 
// for now we want the server to start without crashing if Mongo isn't up.
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/userRoutes'));
app.use('/api/ticket', require('./routes/ticketRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/rides', require('./routes/rideRoutes'));
// app.use('/api/wallet', require('./routes/walletRoutes'));
// app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

app.get('/', (req, res) => {
  res.send('Fare Wave API is running...');
});

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
