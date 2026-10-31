const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true, lowercase: true, trim: true, index: true },
  state: { type: String, default: null },
  price: { type: String, default: null },
  rating: { type: Number, default: null },
  amenities: [{ type: String }],
  source: { type: String, default: 'serpapi' },
  address: { type: String, default: null },
}, { timestamps: true });

// Ensure fast lookups by city
hotelSchema.index({ city: 1, createdAt: -1 });

module.exports = mongoose.model('Hotel', hotelSchema);
