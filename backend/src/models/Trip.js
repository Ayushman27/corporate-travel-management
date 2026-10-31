const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripId:        { type: String, required: true, unique: true, index: true },
  companyId:     { type: String, required: true, index: true },
  employeeId:    { type: String, required: true, index: true },
  employeeName:  { type: String, required: true },
  department:    { type: String, required: true },

  // Travel details
  fromCity:      { type: String, required: true },
  toCity:        { type: String, required: true },
  travelDate:    { type: Date, required: true },
  returnDate:    { type: Date },
  purpose:       { type: String, required: true },
  travelMode:    { type: String, enum: ['flight', 'train', 'bus', 'mixed'], default: 'mixed' },
  preferenceNote:{ type: String, default: '' },

  // Budget
  estimatedBudget: { type: Number, default: 0 },
  approvedBudget:  { type: Number, default: 0 },
  actualCost:      { type: Number, default: 0 },

  // References
  selectedPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  selectedHotel: {
    name: String,
    pricePerNight: Number,
    nights: Number,
    foodingIncluded: Boolean,
    totalCost: Number
  },

  // Status flow
  status: {
    type: String,
    enum: ['draft', 'pending_hrms', 'pending_manager', 'pending_finance',
           'approved', 'booked', 'completed', 'rejected', 'cancelled'],
    default: 'draft',
    index: true
  },

  bookingId:      { type: String },

  // Timestamps
  submittedAt:  { type: Date },
  completedAt:  { type: Date },

  // Chat context stored as array of messages
  chatHistory: [{
    role:    { type: String, enum: ['user', 'assistant'] },
    content: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
