const financeAgent = require('../agents/financeAgent');
const hrmsAgent    = require('../agents/hrmsAgent');
const Trip         = require('../models/Trip');
const User         = require('../models/User');
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


// GET /api/finance/distribution
const getBudgetDistribution = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const now = new Date();
    const currentMonth = req.query.month || now.toLocaleString('en-US', { month: 'long' });
    const year = Number(req.query.year) || 2026;

    // 1. Get total company monthly budget pool
    const Budget = require('../models/Budget');
    let budgetDoc = await Budget.findOne({ companyId, month: currentMonth, year, department: 'All' });
    if (!budgetDoc) {
      budgetDoc = await Budget.findOne({ companyId, month: 'all', year, department: 'All' });
    }
    const totalMonthlyBudget = budgetDoc ? Number(budgetDoc.allocatedBudget || 0) : 500000;

    // 2. Get all users for this company
    const users = await User.find({ companyId }).select('-password').sort({ name: 1 });

    // 3. Get all approved/booked trips to ensure user spend is completely up to date
    const trips = await Trip.find({
      companyId,
      status: { $in: ['approved', 'booked', 'completed'] }
    });

    const spendByEmp = {};
    trips.forEach(t => {
      const cost = (t.approvedBudget !== undefined && t.approvedBudget !== null && Number(t.approvedBudget) > 0)
        ? Number(t.approvedBudget)
        : (Number(t.actualCost) || Number(t.estimatedBudget) || 0);
      spendByEmp[t.employeeId] = (spendByEmp[t.employeeId] || 0) + cost;
    });

    // 4. Group by department
    const departments = {};
    let totalAssigned = 0;
    let totalSpent = 0;

    users.forEach(u => {
      const dept = u.department || 'General';
      if (!departments[dept]) {
        departments[dept] = {
          name: dept,
          totalAllocated: 0,
          totalSpent: 0,
          employees: []
        };
      }

      const limit = Number(u.travelBudgetLimit) || 0;
      const spent = spendByEmp[u.employeeId] !== undefined ? spendByEmp[u.employeeId] : (Number(u.travelBudgetUsed) || 0);

      departments[dept].totalAllocated += limit;
      departments[dept].totalSpent += spent;
      totalAssigned += limit;
      totalSpent += spent;

      departments[dept].employees.push({
        _id: u._id,
        employeeId: u.employeeId,
        name: u.name,
        email: u.email,
        role: u.role,
        department: dept,
        travelBudgetLimit: limit,
        travelBudgetUsed: spent
      });
    });

    const unallocatedPool = totalMonthlyBudget - totalAssigned;

    res.json({
      success: true,
      data: {
        month: currentMonth,
        year,
        totalMonthlyBudget,
        totalAssigned,
        totalSpent,
        unallocatedPool,
        departments: Object.values(departments)
      }
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/finance/employee-budget/:id
const setEmployeeBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { budgetLimit } = req.body;
    const limit = Number(budgetLimit);

    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({ success: false, message: 'Budget limit must be a valid non-negative number' });
    }

    const user = await User.findOne({ _id: id, companyId: req.user.companyId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const oldLimit = user.travelBudgetLimit || 0;
    user.travelBudgetLimit = limit;
    await user.save({ validateBeforeSave: false });

    try {
      const { audit } = require('../services/auditService');
      await audit('EMPLOYEE_BUDGET_SET', {
        actor: req.user,
        details: { employeeId: user.employeeId, employeeName: user.name, oldLimit, newLimit: limit },
        req
      });
    } catch (_) {}

    res.json({
      success: true,
      message: `Budget of ₹${limit.toLocaleString('en-IN')} assigned to ${user.name}`,
      data: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        travelBudgetLimit: user.travelBudgetLimit
      }
    });
  } catch (err) {
    next(err);
  }
};


// POST /api/finance/employee-budget/batch
const batchSetEmployeeBudgets = async (req, res, next) => {
  try {
    const { allocations } = req.body;
    if (!allocations) {
      return res.status(400).json({ success: false, message: 'allocations payload is required' });
    }

    let list = [];
    if (Array.isArray(allocations)) {
      list = allocations;
    } else if (typeof allocations === 'object') {
      list = Object.entries(allocations).map(([userId, budgetLimit]) => ({ userId, budgetLimit }));
    }

    if (list.length === 0) {
      return res.json({ success: true, message: 'No allocations to update', updatedCount: 0 });
    }

    const companyId = req.user.companyId;
    let updatedCount = 0;

    for (const item of list) {
      const id = item.userId || item._id || item.id;
      const limit = Number(item.budgetLimit);
      if (!id || isNaN(limit) || limit < 0) continue;

      const user = await User.findOne({ _id: id, companyId });
      if (user) {
        user.travelBudgetLimit = limit;
        await user.save({ validateBeforeSave: false });
        updatedCount++;
      }
    }

    try {
      const { audit } = require('../services/auditService');
      await audit('EMPLOYEE_BUDGET_BATCH_SET', {
        actor: req.user,
        details: { updatedCount, totalInBatch: list.length },
        req
      });
    } catch (_) {}

    res.json({
      success: true,
      message: `Successfully updated budgets for ${updatedCount} team member${updatedCount === 1 ? '' : 's'}`,
      updatedCount
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReport, syncSheets, checkBudget, getDepartmentSummary,
  getMonthlySpend, getTripsSummary, getEmployeeHistory, setMonthlyBudget,
  getBudgetDistribution, setEmployeeBudget, batchSetEmployeeBudgets
};
