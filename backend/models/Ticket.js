const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    source: {
      type: String,
      required: [true, 'Please add a source location'],
    },
    destination: {
      type: String,
      required: [true, 'Please add a destination location'],
    },
    qrCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Used', 'Expired', 'Cancelled'],
      default: 'Active',
    },
    fareEstimate: {
      type: Number,
      required: true,
    },
    distanceEstimate: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);
