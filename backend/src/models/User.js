const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, index: true },
  companyId:  { type: String, required: true, index: true },
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, lowercase: true, trim: true },
  password:    { type: String, default: null },  // null for email-only employees
  department:  { type: String, required: true },
  role:        { type: String, enum: ['employee', 'manager', 'finance', 'admin'], default: 'employee' },
  loginType:   { type: String, enum: ['email_only', 'password'], default: 'email_only' },
  managerId:   { type: String, default: null },
  travelBudgetUsed:  { type: Number, default: 0 },
  travelBudgetLimit: { type: Number, default: 50000 },
  isActive:    { type: Boolean, default: true },
  lastLogin:   { type: Date }
}, { timestamps: true });

// Compound unique index — employeeId is unique within a company
userSchema.index({ companyId: 1, employeeId: 1 }, { unique: true });
userSchema.index({ companyId: 1, email: 1 },      { unique: true });

// Hash password before save (only if set)
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Strip password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
