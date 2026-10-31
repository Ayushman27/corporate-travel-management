const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  segmentIndex:  Number,
  mode:          String,
  from:          String,
  to:            String,
  operator:      String,
  refNo:         String,    // PNR / ticket number
  departureTime: String,
  arrivalTime:   String,
  passengerName: String,
  seat:          String,
  class:         String,
  cost:          Number
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingId:   { type: String, required: true, unique: true, index: true },
  tripId:      { type: String, required: true, index: true },
  employeeId:  { type: String, required: true },
  planId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },

  tickets:     [ticketSchema],
  totalCost:   { type: Number, required: true },

  status:      { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },

  bookedAt:    { type: Date, default: Date.now },

  // Notification flags
  employeeNotified: { type: Boolean, default: false },
  managerNotified:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
