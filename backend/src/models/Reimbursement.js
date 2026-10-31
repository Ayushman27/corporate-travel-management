const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billUrl: { type: String, required: true },
  extractedAmount: { type: Number, required: true },
  extractedCategory: { type: String, default: 'General' },
  extractedDate: { type: String },
  merchant: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectReason: { type: String }
});

const reimbursementSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['draft', 'pending_finance', 'processed'], default: 'draft' },
  bills: [billSchema],
  totalRequestedAmount: { type: Number, default: 0 },
  totalApprovedAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Reimbursement', reimbursementSchema);
