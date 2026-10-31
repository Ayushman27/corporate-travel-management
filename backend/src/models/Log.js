const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  tripId:    { type: String, index: true },
  actorId:   { type: String },
  actorName: { type: String },
  actorRole: { type: String },

  action: {
    type: String,
    enum: [
      'TRIP_CREATED', 'HRMS_VALIDATED', 'PLANS_GENERATED', 'PLAN_SELECTED',
      'CHAT_MESSAGE', 'POLICY_CHECK', 'MANAGER_APPROVED', 'MANAGER_REJECTED',
      'FINANCE_APPROVED', 'FINANCE_REJECTED', 'BOOKING_CREATED',
      'BUDGET_UPDATE_PROPOSED', 'BUDGET_UPDATED', 'NOTIFICATION_SENT',
      'TRIP_CANCELLED', 'TRIP_COMPLETED', 'ERROR', 'LOGIN', 'LOGOUT'
    ],
    required: true,
    index: true
  },

  details:   { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },

  timestamp: { type: Date, default: Date.now, index: true }
}, {
  // Logs should never be updated
  strict: true,
  versionKey: false
});

// TTL: auto-delete logs older than 2 years
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('Log', logSchema);
