const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const companySchema = new mongoose.Schema({
  companyId:      { type: String, required: true, unique: true, index: true },
  companyName:    { type: String, required: true, trim: true },

  // Company head (admin)
  headName:       { type: String, required: true, trim: true },
  headEmail:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  headPassword:   { type: String, required: true, minlength: 6 },

  // Google Sheets URLs
  hrmsSheetUrl:    { type: String, required: true },
  financeSheetUrl: { type: String, required: true },

  // Company travel policy
  policy: {
    budgetLimits: {
      employee:  { type: Number, default: 50000 },
      manager:   { type: Number, default: 150000 },
      finance:   { type: Number, default: 150000 },
      admin:     { type: Number, default: 500000 }
    },
    minAdvanceNoticeDays: { type: Number, default: 2 },
    maxTripDurationDays:  { type: Number, default: 30 },
    allowedModes: {
      employee:  { type: [String], default: ['train', 'bus', 'mixed'] },
      manager:   { type: [String], default: ['flight', 'train', 'bus', 'mixed'] },
      finance:   { type: [String], default: ['flight', 'train', 'bus', 'mixed'] },
      admin:     { type: [String], default: ['flight', 'train', 'bus', 'mixed'] }
    },
    flightClass: {
      employee:  { type: [String], default: ['economy'] },
      manager:   { type: [String], default: ['economy', 'business'] },
      finance:   { type: [String], default: ['economy', 'business'] },
      admin:     { type: [String], default: ['economy', 'business', 'first'] }
    },
    customNotes: { type: String, default: '' }
  },

  isActive: { type: Boolean, default: true },

  // Tracks when sheets were last synced
  lastSheetSync: { type: Date }
}, { timestamps: true });

// Hash head password before save
companySchema.pre('save', async function (next) {
  if (!this.isModified('headPassword')) return next();
  this.headPassword = await bcrypt.hash(this.headPassword, 12);
  next();
});

companySchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.headPassword);
};

// Strip password from JSON output
companySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.headPassword;
  return obj;
};

module.exports = mongoose.model('Company', companySchema);
