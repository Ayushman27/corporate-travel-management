const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  tripId:       { type: String, required: true, index: true },
  approvalType: { type: String, enum: ['manager', 'finance', 'hrms'], required: true },
  approverId:   { type: String },
  approverName: { type: String },

  status:   { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comments: { type: String, default: '' },

  // Finance-specific fields
  budgetRequested: { type: Number },
  budgetApproved:  { type: Number },

  decidedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Approval', approvalSchema);
