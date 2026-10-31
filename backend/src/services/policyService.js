/**
 * Company travel policy engine.
 * Validates a trip against the company's configurable rules.
 * Falls back to defaults if no company policy is loaded.
 */

const Company = require('../models/Company');

const DEFAULT_POLICY = {
  budgetLimits: {
    employee:  50000,
    manager:   150000,
    finance:   150000,
    admin:     500000
  },
  minAdvanceNoticeDays: 2,
  maxTripDurationDays: 30,
  allowedModes: {
    employee:  ['train', 'bus', 'mixed'],
    manager:   ['flight', 'train', 'bus', 'mixed'],
    finance:   ['flight', 'train', 'bus', 'mixed'],
    admin:     ['flight', 'train', 'bus', 'mixed']
  },
  flightClass: {
    employee:  ['economy'],
    manager:   ['economy', 'business'],
    finance:   ['economy', 'business'],
    admin:     ['economy', 'business', 'first']
  }
};

/**
 * Loads the policy for a company. Falls back to defaults.
 */
const loadPolicy = async (companyId) => {
  if (!companyId) return DEFAULT_POLICY;
  try {
    const company = await Company.findOne({ companyId });
    if (company && company.policy) {
      return {
        budgetLimits: { ...DEFAULT_POLICY.budgetLimits, ...(company.policy.budgetLimits || {}) },
        minAdvanceNoticeDays: company.policy.minAdvanceNoticeDays ?? DEFAULT_POLICY.minAdvanceNoticeDays,
        maxTripDurationDays: company.policy.maxTripDurationDays ?? DEFAULT_POLICY.maxTripDurationDays,
        allowedModes: { ...DEFAULT_POLICY.allowedModes, ...(company.policy.allowedModes || {}) },
        flightClass: { ...DEFAULT_POLICY.flightClass, ...(company.policy.flightClass || {}) }
      };
    }
  } catch (_) { /* fall through to default */ }
  return DEFAULT_POLICY;
};

/**
 * @returns {{ passed: boolean, violations: string[], warnings: string[] }}
 */
const checkPolicy = async (trip, userRole, estimatedCost, companyId) => {
  const POLICY = await loadPolicy(companyId);
  const violations = [];
  const warnings   = [];

  // 1. Budget limit
  const limit = POLICY.budgetLimits[userRole] || POLICY.budgetLimits.employee;
  if (estimatedCost > limit) {
    violations.push(`Estimated cost ₹${estimatedCost.toLocaleString()} exceeds policy limit ₹${limit.toLocaleString()} for role '${userRole}'`);
  }

  // 2. Advance notice
  const travelDate = new Date(trip.travelDate);
  const today      = new Date();
  const diffDays   = Math.ceil((travelDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays < POLICY.minAdvanceNoticeDays) {
    violations.push(`Travel date must be at least ${POLICY.minAdvanceNoticeDays} days from today. Current gap: ${diffDays} day(s)`);
  }

  // 3. Trip duration
  if (trip.returnDate) {
    const duration = Math.ceil((new Date(trip.returnDate) - travelDate) / (1000 * 60 * 60 * 24));
    if (duration > POLICY.maxTripDurationDays) {
      violations.push(`Trip duration ${duration} days exceeds maximum allowed ${POLICY.maxTripDurationDays} days`);
    }
    if (duration > 14) {
      warnings.push(`Long trip (${duration} days) — consider scheduling a mid-trip check-in`);
    }
  }

  // 4. Travel mode
  const allowedModes = POLICY.allowedModes[userRole] || POLICY.allowedModes.employee;
  if (trip.travelMode && !allowedModes.includes(trip.travelMode)) {
    violations.push(`Travel mode '${trip.travelMode}' not permitted for role '${userRole}'`);
  }

  // 5. Budget warning at 80%
  if (estimatedCost > limit * 0.8 && estimatedCost <= limit) {
    warnings.push(`Cost is above 80% of your policy limit — consider a lower-cost option`);
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
    budgetLimit: limit,
    policyVersion: '2.0.0'
  };
};

const getBudgetLimit = async (role, companyId) => {
  const policy = await loadPolicy(companyId);
  return policy.budgetLimits[role] || policy.budgetLimits.employee;
};

const getAllowedModes = async (role, companyId) => {
  const policy = await loadPolicy(companyId);
  return policy.allowedModes[role] || policy.allowedModes.employee;
};

module.exports = { checkPolicy, getBudgetLimit, getAllowedModes, DEFAULT_POLICY, loadPolicy };
