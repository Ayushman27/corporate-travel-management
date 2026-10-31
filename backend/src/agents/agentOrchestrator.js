/**
 * Agent Orchestrator
 * Coordinates all agents in sequence for the trip lifecycle.
 * This is the single entry point for complex multi-step operations.
 */

const { v4: uuidv4 } = require('uuid');

const planningAgent      = require('./planningAgent');
const optimizationAgent  = require('./optimizationAgent');
const bookingAgent       = require('./bookingAgent');
const financeAgent       = require('./financeAgent');
const hrmsAgent          = require('./hrmsAgent');
const notificationAgent  = require('./notificationAgent');

const Trip     = require('../models/Trip');
const Approval = require('../models/Approval');
const { checkPolicy }  = require('../services/policyService');
const { audit }        = require('../services/auditService');
const logger = require('../utils/logger');

// ── Step 1: Submit & validate ─────────────────────────────────────────────────

const submitTripRequest = async (tripData, user, req) => {
  const tripId = `TRIP-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`;
  const companyId = user.companyId;

  logger.info(`[Orchestrator] Submitting trip ${tripId} for employee ${user.employeeId} (company ${companyId})`);

  // 1a. HRMS validation
  const hrmsResult = await hrmsAgent.validateEmployee(companyId, user.employeeId);
  if (!hrmsResult.valid) {
    throw Object.assign(new Error(`HRMS validation failed: ${hrmsResult.errors.join(', ')}`), { statusCode: 422 });
  }

  // 1b. Create Trip document
  const trip = await Trip.create({
    tripId,
    companyId,
    employeeId:   user.employeeId,
    employeeName: user.name,
    department:   user.department,
    ...tripData,
    status:      'draft',
    submittedAt: new Date()
  });

  await audit('HRMS_VALIDATED', { tripId, actor: user, details: hrmsResult, req });

  // 1c. Generate route plans
  const routes = await planningAgent.generateRoutes(tripData, user.role);
  const plans  = await optimizationAgent.optimizeRoutes(tripId, routes);

  // Cheapest plan cost as estimated budget (for policy check only)
  const cheapestPlan = plans.reduce((prev, curr) => prev.totalCost < curr.totalCost ? prev : curr);
  const lowestCost = cheapestPlan.totalCost;
  trip.estimatedBudget = lowestCost;
  
  // 1d. Policy check (async, company-specific)
  const policy = await checkPolicy(trip, user.role, lowestCost, companyId);
  await audit('POLICY_CHECK', { tripId, actor: user, details: policy, req });

  if (!policy.passed) {
    trip.status = 'rejected';
    await trip.save();
    throw Object.assign(
      new Error(`Policy violation: ${policy.violations.join('; ')}`),
      { statusCode: 422, policy }
    );
  }

  await audit('PLANS_GENERATED', { tripId, actor: user, details: { count: plans.length }, req });

  await trip.save();

  // 1f. Notify employee
  await notificationAgent.notifyTripSubmitted(
    { name: user.name, email: user.email },
    trip
  );

  await audit('TRIP_CREATED', { tripId, actor: user, details: { tripId, status: trip.status }, req });

  return { trip, plans, hrmsResult, policy };
};

// ── Step 2: Manager approval ──────────────────────────────────────────────────

const managerApprove = async (tripId, decision, manager, comments, req) => {
  logger.info(`[Orchestrator] Manager ${decision} for trip ${tripId}`);

  const trip = await Trip.findOne({ tripId });
  if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
  if (trip.status !== 'pending_manager') {
    throw Object.assign(new Error(`Trip is in status '${trip.status}' — not awaiting manager approval`), { statusCode: 409 });
  }

  const approval = await Approval.findOneAndUpdate(
    { tripId, approvalType: 'manager' },
    { status: decision, approverId: manager.employeeId, approverName: manager.name, comments, decidedAt: new Date() },
    { new: true }
  );

  if (decision === 'approved') {
    trip.status = 'pending_finance';
    await trip.save();

    // Create finance approval record
    await Approval.create({
      tripId,
      approvalType:    'finance',
      status:          'pending',
      budgetRequested: trip.estimatedBudget
    });

    await notificationAgent.notifyManagerApproved({ name: trip.employeeName, email: '' }, trip);
    await audit('MANAGER_APPROVED', { tripId, actor: manager, details: { comments }, req });
  } else {
    trip.status = 'rejected';
    await trip.save();
    await notificationAgent.notifyManagerRejected({ name: trip.employeeName, email: '' }, trip, comments);
    await audit('MANAGER_REJECTED', { tripId, actor: manager, details: { comments }, req });
  }

  return { trip, approval };
};

// ── Step 3: Finance approval ──────────────────────────────────────────────────

const financeApprove = async (tripId, decision, financeUser, budgetApproved, comments, req) => {
  logger.info(`[Orchestrator] Finance ${decision} for trip ${tripId}`);

  const trip = await Trip.findOne({ tripId });
  if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
  if (trip.status !== 'pending_finance') {
    throw Object.assign(new Error(`Trip is in status '${trip.status}' — not awaiting finance approval`), { statusCode: 409 });
  }

  const companyId = trip.companyId || financeUser.companyId;

  // Finance agent budget check
  const budgetCheck = await financeAgent.checkBudget(companyId, tripId, trip.employeeId, trip.estimatedBudget);

  const approval = await Approval.findOneAndUpdate(
    { tripId, approvalType: 'finance' },
    {
      status:          decision,
      approverId:      financeUser.employeeId,
      approverName:    financeUser.name,
      comments,
      budgetApproved:  decision === 'approved' ? (budgetApproved || trip.estimatedBudget) : 0,
      decidedAt:       new Date()
    },
    { new: true }
  );

  if (decision === 'approved') {
    const approvedAmount = budgetApproved || trip.estimatedBudget;
    trip.status         = 'approved';
    trip.approvedBudget = approvedAmount;
    await trip.save();

    // Apply Excel budget deduction after approval
    await financeAgent.applyApprovedBudget(companyId, tripId, trip.employeeId, approvedAmount);
    await notificationAgent.notifyFinanceApproved({ name: trip.employeeName, email: '' }, trip, approvedAmount);
    await audit('FINANCE_APPROVED', { tripId, actor: financeUser, details: { budgetApproved: approvedAmount, budgetCheck }, req });
    await audit('BUDGET_UPDATED', { tripId, actor: financeUser, details: { amount: approvedAmount }, req });
  } else {
    trip.status = 'rejected';
    await trip.save();
    await audit('FINANCE_REJECTED', { tripId, actor: financeUser, details: { comments, budgetCheck }, req });
  }

  return { trip, approval, budgetCheck };
};

// ── Step 4: Book trip ─────────────────────────────────────────────────────────

const bookTrip = async (tripId, planId, user, req) => {
  logger.info(`[Orchestrator] Booking trip ${tripId}`);

  const trip = await Trip.findOne({ tripId });
  if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
  if (trip.status !== 'approved') {
    throw Object.assign(new Error(`Trip must be approved before booking — current status: ${trip.status}`), { statusCode: 409 });
  }

  const booking = await bookingAgent.book(tripId, planId, {
    employeeId: user.employeeId || trip.employeeId,
    name:       user.name      || trip.employeeName
  });

  await notificationAgent.notifyBookingConfirmed(
    { name: trip.employeeName, email: '' },
    booking,
    booking.tickets
  );

  await audit('BOOKING_CREATED', {
    tripId,
    actor: user,
    details: { bookingId: booking.bookingId, totalCost: booking.totalCost },
    req
  });

  return booking;
};

// ── Step 5: Send for Approval ────────────────────────────────────────────────
const sendForApproval = async (tripId, user, req) => {
  logger.info(`[Orchestrator] Sending trip ${tripId} for approval`);
  const trip = await Trip.findOne({ tripId });
  if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
  if (trip.status !== 'draft') {
    throw Object.assign(new Error(`Trip is in status '${trip.status}' — cannot send for approval`), { statusCode: 409 });
  }

  const hrmsResult = await hrmsAgent.validateEmployee(trip.companyId, trip.employeeId);

  trip.status = 'pending_manager';
  await trip.save();

  await Approval.create({ tripId, approvalType: 'manager', status: 'pending' });

  if (hrmsResult.manager) {
    await notificationAgent.notifyManagerApprovalNeeded(
      { name: hrmsResult.manager.name, email: hrmsResult.manager.email },
      { name: trip.employeeName },
      trip
    );
  }

  await audit('SENT_FOR_APPROVAL', { tripId, actor: user, req });
  return trip;
};

module.exports = { submitTripRequest, managerApprove, financeApprove, bookTrip, sendForApproval };
