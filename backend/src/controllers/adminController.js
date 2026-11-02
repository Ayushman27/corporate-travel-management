const User    = require('../models/User');
const Trip    = require('../models/Trip');
const Booking = require('../models/Booking');
const { getRecentLogs, getLogsByAction } = require('../services/auditService');
const { getAllEmployees } = require('../services/excelService');
const { enrichTripWithBillDetails } = require('../services/billService');

// GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ companyId: req.user.companyId }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['employee', 'manager', 'finance', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/toggle
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, companyId: req.user.companyId }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/trips
const getAllTrips = async (req, res, next) => {
  try {
    const { status, employeeId, page = 1, limit = 20 } = req.query;
    const filter = { companyId: req.user.companyId };
    if (status)     filter.status     = status;
    if (employeeId) filter.employeeId = employeeId;

    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Trip.countDocuments(filter);
    const enriched = await Promise.all(trips.map(enrichTripWithBillDetails));
    res.json({ success: true, data: enriched, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, limit = 100 } = req.query;
    const logs = action
      ? await getLogsByAction(action, Number(limit))
      : await getRecentLogs(Number(limit));
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const [
      totalUsers,
      totalTrips,
      pendingManagerCount,
      pendingFinanceCount,
      bookedCount,
      recentLogs
    ] = await Promise.all([
      User.countDocuments({ companyId, isActive: true }),
      Trip.countDocuments({ companyId }),
      Trip.countDocuments({ companyId, status: 'pending_manager' }),
      Trip.countDocuments({ companyId, status: 'pending_finance' }),
      Trip.countDocuments({ companyId, status: 'booked' }),
      getRecentLogs(20)
    ]);

    let hrmsEmployees = [];
    try { hrmsEmployees = getAllEmployees(companyId); } catch (_) {}

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTrips,
          pendingManagerCount,
          pendingFinanceCount,
          bookedCount,
          hrmsEmployeeCount: hrmsEmployees.length > 0 ? hrmsEmployees.length : totalUsers
        },
        recentLogs
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, updateUserRole, toggleUserActive, getAllTrips, getAuditLogs, getDashboard };
