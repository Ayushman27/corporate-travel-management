/**
 * Booking Agent
 * Finalises the selected plan, confirms each segment via mock APIs,
 * generates tickets and a booking record.
 */

const { v4: uuidv4 } = require('uuid');
const Plan    = require('../models/Plan');
const Booking = require('../models/Booking');
const Trip    = require('../models/Trip');
const { confirmBooking } = require('../services/mockApiService');
const logger = require('../utils/logger');

/**
 * @param {string} tripId
 * @param {string} planId      - MongoDB _id of selected Plan
 * @param {Object} employee    - { employeeId, name, email }
 * @returns {Object}           - Booking document
 */
const book = async (tripId, planId, employee) => {
  logger.info(`[BookingAgent] Starting booking for trip ${tripId}, plan ${planId}`);

  const plan = await Plan.findById(planId);
  if (!plan) throw new Error(`Plan ${planId} not found`);

  // Confirm each segment with mock API
  const tickets = [];
  for (let i = 0; i < plan.segments.length; i++) {
    const seg = plan.segments[i];

    // Only bookable modes get a ticket
    if (['flight', 'train', 'bus'].includes(seg.mode)) {
      const confirmation = await confirmBooking(seg);
      tickets.push({
        segmentIndex:  i,
        mode:          seg.mode,
        from:          seg.from,
        to:            seg.to,
        operator:      seg.operator,
        refNo:         confirmation.refNo,
        departureTime: seg.departureTime,
        arrivalTime:   seg.arrivalTime,
        passengerName: employee.name,
        seat:          confirmation.seat,
        class:         seg.class || 'economy',
        cost:          seg.cost
      });
    }
  }

  const bookingId = `BK${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

  const booking = await Booking.create({
    bookingId,
    tripId,
    employeeId: employee.employeeId,
    planId:     plan._id,
    tickets,
    totalCost:  plan.totalCost,
    status:     'confirmed',
    bookedAt:   new Date()
  });

  // Mark plan as selected
  await Plan.updateMany({ tripId }, { isSelected: false });
  await Plan.findByIdAndUpdate(planId, { isSelected: true });

  // Update trip status
  await Trip.findOneAndUpdate(
    { tripId },
    { status: 'booked', bookingId, actualCost: plan.totalCost, selectedPlanId: plan._id }
  );

  logger.info(`[BookingAgent] Booking ${bookingId} confirmed with ${tickets.length} ticket(s)`);
  return booking;
};

/**
 * Generates a printable ticket summary string.
 */
const formatTicket = (booking) => {
  const lines = [
    `═══════════════════════════════════════════`,
    `  CORPORATE TRAVEL MANAGEMENT SYSTEM`,
    `  BOOKING CONFIRMATION`,
    `═══════════════════════════════════════════`,
    `  Booking ID : ${booking.bookingId}`,
    `  Employee   : ${booking.tickets[0]?.passengerName || '—'}`,
    `  Total Cost : ₹${booking.totalCost.toLocaleString('en-IN')}`,
    `  Booked At  : ${new Date(booking.bookedAt).toLocaleString('en-IN')}`,
    `───────────────────────────────────────────`,
    ...booking.tickets.map((t, i) => [
      `  SEGMENT ${i + 1}: ${t.mode.toUpperCase()}`,
      `  ${t.from} → ${t.to}`,
      `  Operator : ${t.operator}`,
      `  Ref/PNR  : ${t.refNo}`,
      `  Departs  : ${t.departureTime}  Arrives: ${t.arrivalTime}`,
      `  Seat     : ${t.seat}  Class: ${t.class}`,
      `  Cost     : ₹${t.cost?.toLocaleString('en-IN')}`,
      `───────────────────────────────────────────`
    ].join('\n')),
    `  Status: CONFIRMED ✓`,
    `═══════════════════════════════════════════`
  ];
  return lines.join('\n');
};

module.exports = { book, formatTicket };
