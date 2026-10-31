const mongoose = require('mongoose');

const segmentSchema = new mongoose.Schema({
  mode:        { type: String, enum: ['flight', 'train', 'metro', 'bus', 'cab', 'walk'] },
  from:        String,
  to:          String,
  operator:    String,  // airline, railway, etc.
  flightNo:    String,
  departureTime: String,
  arrivalTime:   String,
  durationMins:  Number,
  cost:          Number,
  class:         String  // economy, business, sleeper, etc.
}, { _id: false });

const planSchema = new mongoose.Schema({
  tripId:    { type: String, required: true, index: true },
  planType:  { type: String, enum: ['lowest_cost', 'fastest', 'most_comfortable'], required: true },
  rank:      { type: Number },

  segments:      [segmentSchema],
  totalCost:     { type: Number, required: true },
  totalDuration: { type: Number, required: true }, // minutes
  comfortScore:  { type: Number, min: 0, max: 10 },
  costScore:     { type: Number, min: 0, max: 10 },
  speedScore:    { type: Number, min: 0, max: 10 },
  overallScore:  { type: Number, min: 0, max: 10 },

  summary:     { type: String },
  highlights:  [String],
  warnings:    [String],

  isSelected:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
