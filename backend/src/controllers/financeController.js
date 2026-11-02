const financeAgent = require('../agents/financeAgent');
const hrmsAgent    = require('../agents/hrmsAgent');
const Trip         = require('../models/Trip');
const Booking      = require('../models/Booking');
const { getFinanceData, syncCompanyDataToDB } = require('../services/excelService');

// GET /api/finance/report
const getReport = async (req, res, next) => {
  try {
    const report = await financeAgent.generateReport(req.user.companyId);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

// POST /api/finance/sync-sheets
const syncSheets = async (req, res, next) => {
  try {
    const result = await syncCompanyDataToDB(req.user.companyId);
    res.json({
      success: true,
      message: 'HRMS and Budget data successfully synced to Neon DB',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/finance/budget/check?tripId=&amount=
const checkBudget = async (req, res, next) => {
  try {
    const { tripId, amount, employeeId } = req.query;
    if (!amount) return res.status(400).json({ success: false, message: 'amount is required' });

    const result = await financeAgent.checkBudget(
      req.user.companyId,
      tripId || 'QUERY',
      employeeId || req.user.employeeId,
      Number(amount)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/finance/department-summary
const getDepartmentSummary = async (req, res, next) => {
  try {
    const summary = await hrmsAgent.getDepartmentSummary(req.user.companyId);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

// GET /api/finance/monthly-spend
const getMonthlySpend = async (req, res, next) => {
  try {
    const data = getFinanceData(req.user.companyId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/finance/trips-summary
const getTripsSummary = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const [totalTrips, statusCounts, recentBookings] = await Promise.all([
      Trip.countDocuments({ companyId }),
      Trip.aggregate([{ $match: { companyId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.find().sort({ bookedAt: -1 }).limit(10).lean()
    ]);

    const totalSpent = recentBookings.reduce((s, b) => s + b.totalCost, 0);

    res.json({
      success: true,
      data: {
        totalTrips,
        statusBreakdown: statusCounts,
        recentBookings,
        totalSpent
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/finance/employee-history/:employeeId
const getEmployeeHistory = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const companyId = req.user.companyId;
    if (req.user.role === 'employee' && req.user.employeeId !== employeeId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const trips    = await Trip.find({ employeeId, companyId }).sort({ createdAt: -1 });
    const bookings = await Booking.find({ employeeId }).sort({ bookedAt: -1 });
    const totalSpent = bookings.reduce((s, b) => s + b.totalCost, 0);

    res.json({ success: true, data: { trips, bookings, totalSpent } });
  } catch (err) {
    next(err);
  }
};

// POST /api/finance/budget/set
const setMonthlyBudget = async (req, res, next) => {
  try {
    const { month, year = 2026, department = 'All', allocatedBudget } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required' });
    }
    const amount = Number(allocatedBudget);
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: 'allocatedBudget must be a non-negative number' });
    }

    const Budget = require('../models/Budget');
    const { audit } = require('../services/auditService');

    const ALL_MONTHS = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const isAll = String(month).toLowerCase().trim() === 'all';
    const monthsToUpdate = isAll
      ? ALL_MONTHS
      : [ALL_MONTHS.find(m => m.toLowerCase() === String(month).toLowerCase().trim()) || month];

    const updatedBudgets = [];
    const now = new Date();

    for (const m of monthsToUpdate) {
      let b = await Budget.findOne({ companyId: req.user.companyId, month: m, year: Number(year), department });
      if (b) {
        b.allocatedBudget = amount;
        b.remainingBudget = Math.max(0, amount - (Number(b.spentAmount) || 0));
        b.lastUpdated = now;
        await b.save();
      } else {
        b = await Budget.create({
          companyId: req.user.companyId,
          month: m,
          year: Number(year),
          department,
          allocatedBudget: amount,
          spentAmount: 0,
          remainingBudget: amount,
          lastUpdated: now
        });
      }
      updatedBudgets.push(b);
    }

    try {
      await audit('BUDGET_SET', {
        actor: req.user,
        details: { month, year, department, allocatedBudget: amount, count: monthsToUpdate.length },
        req
      });
    } catch (_) {}

    res.json({
      success: true,
      message: isAll
        ? `Monthly budget for all 12 months set to ₹${amount.toLocaleString('en-IN')}`
        : `Budget for ${monthsToUpdate[0]} set to ₹${amount.toLocaleString('en-IN')}`,
      data: updatedBudgets
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReport, syncSheets, checkBudget, getDepartmentSummary,
  getMonthlySpend, getTripsSummary, getEmployeeHistory, setMonthlyBudget
};
