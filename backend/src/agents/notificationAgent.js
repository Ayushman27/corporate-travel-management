/**
 * Notification Agent
 * Sends WhatsApp messages for key trip lifecycle events.
 * Uses mock API — replace with real WhatsApp Business API in production.
 */

const { sendWhatsApp } = require('../services/mockApiService');
const { audit }        = require('../services/auditService');
const logger = require('../utils/logger');

const FROM = process.env.WHATSAPP_FROM_NUMBER || '+911234567890';

// ── Template builders ────────────────────────────────────────────────────────

const templates = {
  tripSubmitted: (emp, trip) =>
    `✈️ *Travel Request Submitted*\n\nHello ${emp.name},\nYour trip request from *${trip.fromCity}* to *${trip.toCity}* on *${new Date(trip.travelDate).toDateString()}* has been submitted.\n\nTrip ID: \`${trip.tripId}\`\nStatus: Pending Manager Approval\n\n_Corporate Travel Management_`,

  managerApprovalRequest: (manager, emp, trip) =>
    `🔔 *Approval Required*\n\nHello ${manager.name},\n${emp.name} has requested travel from *${trip.fromCity}* → *${trip.toCity}*.\n\nTrip ID: \`${trip.tripId}\`\nDate: ${new Date(trip.travelDate).toDateString()}\nEstimated Cost: ₹${trip.estimatedBudget?.toLocaleString('en-IN')}\n\nPlease log in to the CTM portal to approve/reject.`,

  managerApproved: (emp, trip) =>
    `✅ *Manager Approved*\n\nHello ${emp.name},\nYour trip *${trip.tripId}* has been approved by your manager.\nIt is now pending Finance review.\n\n_CTM System_`,

  managerRejected: (emp, trip, reason) =>
    `❌ *Trip Rejected*\n\nHello ${emp.name},\nYour trip request *${trip.tripId}* (${trip.fromCity} → ${trip.toCity}) was rejected by your manager.\n\nReason: ${reason || 'Not specified'}\n\n_CTM System_`,

  financeApproved: (emp, trip, budget) =>
    `💰 *Finance Approved*\n\nHello ${emp.name},\nYour trip *${trip.tripId}* has been approved with a budget of ₹${budget?.toLocaleString('en-IN')}.\n\nBooking will proceed shortly.\n\n_CTM Finance_`,

  bookingConfirmed: (emp, booking, tickets) => {
    const ticketLines = tickets.map(t =>
      `• ${t.mode.toUpperCase()} — ${t.from} → ${t.to}\n  Ref: ${t.refNo}  Seat: ${t.seat}`
    ).join('\n');
    return `🎫 *Booking Confirmed!*\n\nHello ${emp.name},\nYour booking is confirmed.\n\nBooking ID: \`${booking.bookingId}\`\nTotal Cost: ₹${booking.totalCost?.toLocaleString('en-IN')}\n\n*Tickets:*\n${ticketLines}\n\nSafe travels! ✈️\n_CTM System_`;
  },

  tripCancelled: (emp, trip) =>
    `🚫 *Trip Cancelled*\n\nHello ${emp.name},\nYour trip *${trip.tripId}* (${trip.fromCity} → ${trip.toCity}) has been cancelled.\n\n_CTM System_`,

  budgetExceededAlert: (recipient, employee, trip, billDetails) => {
    const segmentsText = (billDetails?.segments || []).map((s, idx) =>
      `   ${idx + 1}. ${(s.mode || 'transit').toUpperCase()} (${s.operator || ''}${s.flightNo ? ' ' + s.flightNo : ''}): ${s.from} → ${s.to} (₹${Number(s.cost || 0).toLocaleString('en-IN')})`
    ).join('\n') || '   • Standard itinerary transit';

    const hotelText = billDetails?.hotel
      ? `   • ${billDetails.hotel.name} (${billDetails.hotel.nights} Nights @ ₹${(billDetails.hotel.pricePerNight || 0).toLocaleString('en-IN')}/night) — ₹${(billDetails.hotel.totalCost || 0).toLocaleString('en-IN')}`
      : '   • No hotel booked';

    return `⚠️ *TRAVEL BUDGET WARNING: EXCEEDED*\n\n` +
      `Hello ${recipient.name},\n` +
      `Employee *${employee.name}* (${trip.department}) has planned a trip that exceeds their allocated personal travel budget.\n\n` +
      `📌 *Budget Overview:*\n` +
      `• Employee Allocated Budget: ₹${(billDetails?.employeeBudgetLimit || 20000).toLocaleString('en-IN')}\n` +
      `• Requested Trip Bill: ₹${(billDetails?.totalCost || trip.estimatedBudget || 0).toLocaleString('en-IN')}\n` +
      `• Exceeds Budget By: ₹${(billDetails?.budgetExcessAmount || 0).toLocaleString('en-IN')}\n\n` +
      `🧾 *Itemized Bill Breakdown (Where Money is Used):*\n` +
      `*Travel & Transit (₹${(billDetails?.travelCost || 0).toLocaleString('en-IN')}):*\n${segmentsText}\n\n` +
      `*Accommodation (₹${(billDetails?.hotelCost || 0).toLocaleString('en-IN')}):*\n${hotelText}\n\n` +
      `*Total Planned Bill: ₹${(billDetails?.totalCost || trip.estimatedBudget || 0).toLocaleString('en-IN')}*\n\n` +
      `ℹ️ _Note: Per policy, this amount has NOT been deducted from the employee's personal budget. Please review in the portal._\n\n` +
      `_CTM System Alert_`;
  }
};

// ── Generic send wrapper ─────────────────────────────────────────────────────

const notify = async ({ to, message, tripId, actor, event }) => {
  try {
    const result = await sendWhatsApp({ to, message });
    await audit('NOTIFICATION_SENT', {
      tripId,
      actor,
      details: { to, event, preview: message.substring(0, 100) }
    });
    logger.info(`[NotificationAgent] ${event} sent to ${to}`);
    return result;
  } catch (err) {
    logger.error(`[NotificationAgent] Failed to send ${event} to ${to}: ${err.message}`);
    // Non-fatal — don't rethrow
    return { success: false, error: err.message };
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

const notifyTripSubmitted = (emp, trip) =>
  notify({ to: emp.phone || emp.email, message: templates.tripSubmitted(emp, trip), tripId: trip.tripId, event: 'TRIP_SUBMITTED' });

const notifyManagerApprovalNeeded = (manager, emp, trip) =>
  notify({ to: manager.phone || manager.email, message: templates.managerApprovalRequest(manager, emp, trip), tripId: trip.tripId, event: 'MANAGER_APPROVAL_REQUEST' });

const notifyManagerApproved = (emp, trip) =>
  notify({ to: emp.phone || emp.email, message: templates.managerApproved(emp, trip), tripId: trip.tripId, event: 'MANAGER_APPROVED' });

const notifyManagerRejected = (emp, trip, reason) =>
  notify({ to: emp.phone || emp.email, message: templates.managerRejected(emp, trip, reason), tripId: trip.tripId, event: 'MANAGER_REJECTED' });

const notifyFinanceApproved = (emp, trip, budget) =>
  notify({ to: emp.phone || emp.email, message: templates.financeApproved(emp, trip, budget), tripId: trip.tripId, event: 'FINANCE_APPROVED' });

const notifyBookingConfirmed = (emp, booking, tickets) =>
  notify({ to: emp.phone || emp.email, message: templates.bookingConfirmed(emp, booking, tickets), tripId: booking.tripId, event: 'BOOKING_CONFIRMED' });

const notifyTripCancelled = (emp, trip) =>
  notify({ to: emp.phone || emp.email, message: templates.tripCancelled(emp, trip), tripId: trip.tripId, event: 'TRIP_CANCELLED' });

const notifyBudgetExceededWarning = async (recipients, employee, trip, billDetails) => {
  for (const r of (recipients || [])) {
    if (r.phone || r.email) {
      await notify({
        to: r.phone || r.email,
        message: templates.budgetExceededAlert(r, employee, trip, billDetails),
        tripId: trip.tripId,
        actor: employee,
        event: 'BUDGET_EXCEEDED_WARNING'
      });
    }
  }
};

module.exports = {
  notifyBudgetExceededWarning,
  notifyTripSubmitted, notifyManagerApprovalNeeded, notifyManagerApproved,
  notifyManagerRejected, notifyFinanceApproved, notifyBookingConfirmed, notifyTripCancelled
};
