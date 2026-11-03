const orchestrator = require('../agents/agentOrchestrator');
const chatAgent    = require('../agents/chatAgent');
const Trip         = require('../models/Trip');
const Plan         = require('../models/Plan');
const Booking      = require('../models/Booking');
const Approval     = require('../models/Approval');
const { audit }    = require('../services/auditService');
const { getLogsForTrip } = require('../services/auditService');
const hotelService = require('../utils/hotelService');
const { enrichTripWithBillDetails } = require('../services/billService');
const logger = require('../utils/logger');

// POST /api/trip/request
const requestTrip = async (req, res, next) => {
  try {
    const tripData = {
      fromCity:       req.body.fromCity,
      toCity:         req.body.toCity,
      travelDate:     new Date(req.body.travelDate),
      returnDate:     req.body.returnDate ? new Date(req.body.returnDate) : null,
      purpose:        req.body.purpose,
      travelMode:     req.body.travelMode || 'mixed',
      preferenceNote: req.body.preferenceNote || ''
    };

    const result = await orchestrator.submitTripRequest(tripData, req.user, req);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/trip/plans/:tripId
const getPlans = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip  = await Trip.findOne({ tripId, companyId: req.user.companyId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    // Employees can only see their own trips
    if (req.user.role === 'employee' && trip.employeeId !== req.user.employeeId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const plans = await Plan.find({ tripId }).sort({ rank: 1 });
    res.json({ success: true, data: { trip, plans } });
  } catch (err) {
    next(err);
  }
};

// GET /api/trip/my
const getMyTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ employeeId: req.user.employeeId, companyId: req.user.companyId })
      .sort({ createdAt: -1 })
      .limit(50);
    const enriched = await Promise.all(trips.map(enrichTripWithBillDetails));
    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

// GET /api/trip/messages - Retrieves official decision notes & trip details for requested trips
const getMyMessages = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const employeeId = req.user.employeeId;

    // 1. Fetch trips for this employee
    const trips = await Trip.find({ employeeId, companyId });
    if (!trips || trips.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const tripMap = {};
    const tripIds = [];
    trips.forEach(t => {
      tripMap[t.tripId] = t;
      tripIds.push(t.tripId);
    });

    // 2. Fetch all decided approvals for these trips
    const approvals = await Approval.find({
      tripId: { $in: tripIds }
    });

    const decided = (approvals || []).filter(
      a => a.status === 'approved' || a.status === 'rejected'
    );

    // 3. Map into decision message objects with attached notes & trip details
    const messages = await Promise.all(decided.map(async (a) => {
      const rawTrip = tripMap[a.tripId] || {};
      const trip = await enrichTripWithBillDetails(rawTrip);
      const isFinance = a.approvalType === 'finance';
      const isApproved = a.status === 'approved';

      const departmentLabel = isFinance ? 'Finance Department' : 'Manager';
      const decisionLabel   = isApproved ? 'Approved' : 'Rejected';

      return {
        id: a.id || `${a.tripId}-${a.approvalType}`,
        tripId: a.tripId,
        approvalType: a.approvalType,
        status: a.status,
        title: `${departmentLabel} ${decisionLabel}`,
        approverName: a.approverName || (isFinance ? 'Finance Team' : 'Reporting Manager'),
        approverId: a.approverId,
        note: a.comments || '',
        budgetApproved: a.budgetApproved || (isApproved ? trip.approvedBudget || trip.estimatedBudget : 0),
        budgetRequested: a.budgetRequested || trip.estimatedBudget || 0,
        decidedAt: a.decidedAt || a.updatedAt || a.createdAt || new Date(),
        trip: {
          tripId: trip.tripId,
          fromCity: trip.fromCity,
          toCity: trip.toCity,
          travelDate: trip.travelDate,
          returnDate: trip.returnDate,
          travelMode: trip.travelMode,
          purpose: trip.purpose,
          estimatedBudget: trip.estimatedBudget,
          approvedBudget: trip.approvedBudget,
          currentStatus: trip.status,
          selectedHotel: trip.selectedHotel,
          billDetails: trip.billDetails || null
        }
      };
    }));

    messages.sort((a, b) => new Date(b.decidedAt) - new Date(a.decidedAt));
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

// GET /api/trip/:tripId
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ tripId: req.params.tripId, companyId: req.user.companyId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (req.user.role === 'employee' && trip.employeeId !== req.user.employeeId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [plans, approvals, booking, logs] = await Promise.all([
      Plan.find({ tripId: trip.tripId }).sort({ rank: 1 }),
      Approval.find({ tripId: trip.tripId }),
      Booking.findOne({ tripId: trip.tripId }),
      getLogsForTrip(trip.tripId)
    ]);

    res.json({ success: true, data: { trip, plans, approvals, booking, logs } });
  } catch (err) {
    next(err);
  }
};

// POST /api/trip/chat
const chatWithAgent = async (req, res, next) => {
  try {
    const { tripId, message } = req.body;
    if (!tripId || !message) {
      return res.status(400).json({ success: false, message: 'tripId and message are required' });
    }

    const result = await chatAgent.chat(tripId, message, req.user);
    await audit('CHAT_MESSAGE', { tripId, actor: req.user, details: { message: message.substring(0, 200) }, req });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/trip/approve/manager
const managerApprove = async (req, res, next) => {
  try {
    const { tripId, status, comments } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    }

    const result = await orchestrator.managerApprove(tripId, status, req.user, comments || '', req);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/trip/approve/finance
const financeApprove = async (req, res, next) => {
  try {
    const { tripId, status, budgetApproved, comments } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    }

    const result = await orchestrator.financeApprove(
      tripId, status, req.user,
      budgetApproved ? Number(budgetApproved) : null,
      comments || '', req
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/trip/book
const bookTrip = async (req, res, next) => {
  try {
    const { tripId, planId } = req.body;
    if (!tripId || !planId) {
      return res.status(400).json({ success: false, message: 'tripId and planId are required' });
    }

    const booking = await orchestrator.bookTrip(tripId, planId, req.user, req);
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// GET /api/trip/pending/manager — trips awaiting this manager's approval
const getPendingManagerApprovals = async (req, res, next) => {
  try {
    const trips = await Trip.find({ status: 'pending_manager', companyId: req.user.companyId }).sort({ submittedAt: 1 });

    const filtered = req.user.role === 'admin'
      ? trips
      : trips.filter(t => {
          return true; // Manager sees all pending for now; restrict in production
        });

    const enriched = await Promise.all(filtered.map(enrichTripWithBillDetails));
    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

// GET /api/trip/pending/finance
const getPendingFinanceApprovals = async (req, res, next) => {
  try {
    const trips = await Trip.find({ status: 'pending_finance', companyId: req.user.companyId }).sort({ submittedAt: 1 });
    const enriched = await Promise.all(trips.map(enrichTripWithBillDetails));
    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/trip/:tripId  (cancel)
const cancelTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ tripId: req.params.tripId, companyId: req.user.companyId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (req.user.role === 'employee' && trip.employeeId !== req.user.employeeId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (['booked', 'completed'].includes(trip.status)) {
      return res.status(409).json({ success: false, message: 'Cannot cancel a booked/completed trip' });
    }

    trip.status = 'cancelled';
    await trip.save();
    await audit('TRIP_CANCELLED', { tripId: trip.tripId, actor: req.user, req });

    res.json({ success: true, message: 'Trip cancelled', data: trip });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/trip/:tripId/select-plan
const selectPlan = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { planId } = req.body;

    const trip = await Trip.findOne({ tripId, companyId: req.user.companyId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (req.user.role === 'employee' && trip.employeeId !== req.user.employeeId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (['booked', 'completed', 'cancelled', 'rejected'].includes(trip.status)) {
      return res.status(409).json({ success: false, message: 'Cannot modify plan for a closed trip' });
    }

    const plan = await Plan.findById(planId);
    if (!plan || plan.tripId !== tripId) {
      return res.status(404).json({ success: false, message: 'Plan not found for this trip' });
    }

    trip.estimatedBudget = plan.totalCost + (trip.selectedHotel?.totalCost || 0);
    trip.selectedPlanId = plan._id;
    await trip.save();

    await audit('PLAN_SELECTED', { tripId: trip.tripId, actor: req.user, details: { planId, cost: plan.totalCost }, req });

    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

// GET /api/trip/hotels/:city
const getHotels = async (req, res, next) => {
  try {
    const { city } = req.params;
    const hotels = hotelService.getHotelsByCity(city);
    res.json({ success: true, data: hotels });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/trip/:tripId/select-hotel
const selectHotel = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { hotel, foodingIncluded, nights } = req.body;
    
    const trip = await Trip.findOne({ tripId, companyId: req.user.companyId });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    
    if (['booked', 'completed', 'cancelled', 'rejected'].includes(trip.status)) {
      return res.status(409).json({ success: false, message: 'Cannot modify plan for a closed trip' });
    }

    // Default prices if not found in data
    const pricePerNight = Number(hotel.Price || hotel.price || 5000);
    const totalCost = (pricePerNight * nights) + (foodingIncluded ? (1500 * nights) : 0);

    trip.selectedHotel = {
      name: hotel.Name || hotel.name || 'Unknown Hotel',
      pricePerNight,
      nights,
      foodingIncluded,
      totalCost
    };

    // Update estimated budget to include travel plan and hotel
    let travelCost = 0;
    if (trip.selectedPlanId) {
      const plan = await Plan.findById(trip.selectedPlanId);
      if (plan) travelCost = plan.totalCost;
    }
    
    trip.estimatedBudget = travelCost + totalCost;
    await trip.save();

    await audit('HOTEL_SELECTED', { tripId: trip.tripId, actor: req.user, details: { hotelName: trip.selectedHotel.name, cost: totalCost }, req });

    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

// POST /api/trip/:tripId/send-approval
const sendForApproval = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await orchestrator.sendForApproval(tripId, req.user, req);
    res.json({ success: true, message: 'Request sent to manager', data: trip });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyMessages,
  requestTrip, getPlans, getMyTrips, getTripById, chatWithAgent,
  managerApprove, financeApprove, bookTrip,
  getPendingManagerApprovals, getPendingFinanceApprovals, cancelTrip, selectPlan, sendForApproval,
  getHotels, selectHotel
};
