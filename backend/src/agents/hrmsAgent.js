/**
 * HRMS AI Agent
 * Validates employee data from Excel before a trip can be processed.
 */

const { getEmployeeById, getAllEmployees } = require('../services/excelService');
const User   = require('../models/User');
const logger = require('../utils/logger');

/**
 * Validates an employee against the HRMS Excel sheet.
 * Falls back to MongoDB User record for admin users who aren't in the Excel.
 * @param {string} companyId
 * @param {string} employeeId
 * @returns {{ valid: boolean, employee: Object|null, manager: Object|null, errors: string[] }}
 */
const validateEmployee = async (companyId, employeeId) => {
  logger.info(`[HRMSAgent] Validating employee ${employeeId} for company ${companyId}`);

  const errors = [];
  let employee = null;
  let manager  = null;

  // Try HRMS Excel first
  try {
    employee = getEmployeeById(companyId, employeeId);
  } catch (err) {
    logger.warn(`[HRMSAgent] HRMS Excel read error: ${err.message}`);
  }

  // Fallback: look up in MongoDB User collection (for admin/programmatic users)
  if (!employee) {
    try {
      const dbUser = await User.findOne({ companyId, employeeId });
      if (dbUser) {
        logger.info(`[HRMSAgent] Employee ${employeeId} not in Excel, found in DB (role: ${dbUser.role})`);
        employee = {
          EmployeeID:      dbUser.employeeId,
          Name:            dbUser.name,
          Email:           dbUser.email,
          Department:      dbUser.department,
          Role:            dbUser.role,
          ManagerID:       dbUser.managerId,
          TravelBudget:    dbUser.travelBudgetLimit || 500000,
          TravelBudgetUsed: dbUser.travelBudgetUsed || 0
        };
      }
    } catch (dbErr) {
      logger.warn(`[HRMSAgent] DB fallback error: ${dbErr.message}`);
    }
  } else {
    try {
      const dbUser = await User.findOne({ companyId, employeeId });
      if (dbUser && dbUser.travelBudgetUsed !== undefined) {
        employee.TravelBudgetUsed = dbUser.travelBudgetUsed;
        if (dbUser.travelBudgetLimit) employee.TravelBudget = dbUser.travelBudgetLimit;
      }
    } catch (_) {}
  }

  if (!employee) {
    return { valid: false, employee: null, manager: null, errors: [`Employee ID '${employeeId}' not found in HRMS or database`] };
  }

  // Validate mandatory fields
  if (!employee.Name)       errors.push('Employee name is missing in HRMS');
  if (!employee.Department) errors.push('Department is missing in HRMS');
  if (!employee.Email)      errors.push('Email is missing in HRMS');

  // Check travel eligibility — budget not exhausted
  const used    = employee.TravelBudgetUsed || 0;
  const limit   = employee.TravelBudget     || 0;
  const remaining = limit - used;

  if (remaining <= 0) {
    errors.push(`Annual travel budget exhausted (used ₹${used.toLocaleString('en-IN')} / ₹${limit.toLocaleString('en-IN')})`);
  }

  // Resolve manager (admin users don't need a manager)
  const isAdmin = (employee.Role || '').toLowerCase() === 'admin';

  if (isAdmin) {
    manager = {
      EmployeeID: employee.EmployeeID,
      Name: employee.Name,
      Email: employee.Email
    };
    logger.info(`[HRMSAgent] Employee ${employeeId} is an Admin — self-managed`);
  } else if (employee.ManagerID) {
    // 1. Try HRMS Excel
    try {
      manager = getEmployeeById(companyId, employee.ManagerID);
    } catch (err) {
      logger.warn(`[HRMSAgent] HRMS Excel manager read error: ${err.message}`);
    }

    // 2. Try Database lookup
    if (!manager) {
      try {
        const dbManager = await User.findOne({ companyId, employeeId: employee.ManagerID });
        if (dbManager) {
          manager = {
            EmployeeID: dbManager.employeeId,
            Name: dbManager.name,
            Email: dbManager.email,
            Department: dbManager.department,
            Role: dbManager.role
          };
          logger.info(`[HRMSAgent] Resolved manager ${employee.ManagerID} (${dbManager.name}) from database`);
        }
      } catch (dbErr) {
        logger.warn(`[HRMSAgent] DB manager lookup error: ${dbErr.message}`);
      }
    }

    // 3. Fallback: if assigned manager is not found, auto-route to company admin
    if (!manager) {
      try {
        const adminManager = await User.findOne({ companyId, role: 'admin' });
        if (adminManager && adminManager.employeeId !== employee.EmployeeID) {
          manager = {
            EmployeeID: adminManager.employeeId,
            Name: adminManager.name,
            Email: adminManager.email,
            Department: adminManager.department,
            Role: adminManager.role
          };
          logger.info(`[HRMSAgent] Manager ${employee.ManagerID} not found — falling back to company admin ${adminManager.name}`);
        }
      } catch (_) {}
    }

    if (!manager) {
      errors.push(`Manager '${employee.ManagerID}' could not be resolved from HRMS or database`);
    }
  } else {
    // Non-admin employee with no ManagerID mapped — auto-route to company admin
    try {
      const adminManager = await User.findOne({ companyId, role: 'admin' });
      if (adminManager) {
        manager = {
          EmployeeID: adminManager.employeeId,
          Name: adminManager.name,
          Email: adminManager.email,
          Department: adminManager.department,
          Role: adminManager.role
        };
        logger.info(`[HRMSAgent] No manager in profile for ${employeeId} — routed to company admin ${adminManager.name}`);
      } else {
        errors.push('No manager mapped for employee in HRMS or database');
      }
    } catch (_) {
      errors.push('No manager mapped for employee in HRMS');
    }
  }

  const result = {
    valid:     errors.length === 0,
    employee:  {
      employeeId:      employee.EmployeeID,
      name:            employee.Name,
      email:           employee.Email,
      department:      employee.Department,
      role:            employee.Role,
      travelBudget:    limit,
      travelBudgetUsed: used,
      travelBudgetRemaining: remaining
    },
    manager: manager ? {
      employeeId: manager.EmployeeID,
      name:       manager.Name,
      email:      manager.Email
    } : null,
    errors
  };

  logger.info(`[HRMSAgent] Validation ${result.valid ? 'PASSED' : 'FAILED'} for ${employeeId}: ${errors.join('; ') || 'OK'}`);
  return result;
};

/**
 * Returns a department summary (for reporting).
 */
const getDepartmentSummary = async (companyId) => {
  let employees = [];
  try {
    employees = getAllEmployees(companyId);
  } catch (e) {
    logger.warn(`[HRMSAgent] getDepartmentSummary Excel read failed: ${e.message}`);
  }
  
  const summary = {};

  // 1. Initialize budget allocations from Excel
  employees.forEach(emp => {
    const dept = emp.Department || 'Unknown';
    if (!summary[dept]) {
      summary[dept] = { count: 0, totalBudgetAllocated: 0, totalBudgetUsed: 0, employees: [] };
    }
    summary[dept].count++;
    summary[dept].totalBudgetAllocated += emp.TravelBudget || 0;
    summary[dept].employees.push(emp.EmployeeID);
  });

  try {
    const User = require('../models/User');
    const dbUsers = await User.find({ companyId });
    const Trip = require('../models/Trip');
    // Find all trips that actually cost money
    const allTrips = await Trip.find({ companyId, status: { $in: ['approved', 'booked'] } });

    // 2. Add users who are only in DB (like Admin)
    for (const dbUser of dbUsers) {
      const dept = dbUser.department || 'Unknown';
      const existsInExcel = employees.some(e => e.EmployeeID === dbUser.employeeId);
      
      if (!existsInExcel) {
        if (!summary[dept]) {
          summary[dept] = { count: 0, totalBudgetAllocated: 0, totalBudgetUsed: 0, employees: [] };
        }
        summary[dept].count++;
        summary[dept].totalBudgetAllocated += dbUser.travelBudgetLimit || 0;
        summary[dept].employees.push(dbUser.employeeId);
      }
    }

    // 3. Strictly calculate actual spend from Trips
    // Group by the department recorded at the time the trip was created
    for (const dept in summary) {
      summary[dept].totalBudgetUsed = 0;
    }

    for (const trip of allTrips) {
      const dept = trip.department || 'Unknown';
      if (!summary[dept]) {
        summary[dept] = { count: 0, totalBudgetAllocated: 0, totalBudgetUsed: 0, employees: [] };
      }
      const cost = (trip.status === 'booked' && Number(trip.actualCost) > 0)
        ? Number(trip.actualCost)
        : (trip.approvedBudget !== undefined && trip.approvedBudget !== null
          ? Number(trip.approvedBudget)
          : (Number(trip.estimatedBudget) || 0));
      summary[dept].totalBudgetUsed += cost;
    }

    // 4. Auto-heal DB user profiles to match their true spend
    for (const dbUser of dbUsers) {
      const userTrips = allTrips.filter(t => t.employeeId === dbUser.employeeId);
      const userLimit = Number(dbUser.travelBudgetLimit) || 50000;
      const trueSpend = userTrips.reduce((s, t) => {
        const cost = (t.status === 'booked' && Number(t.actualCost) > 0)
          ? Number(t.actualCost)
          : (t.approvedBudget !== undefined && t.approvedBudget !== null
            ? Number(t.approvedBudget)
            : (Number(t.estimatedBudget) || 0));
        return s + cost;
      }, 0);
      if (dbUser.travelBudgetUsed !== trueSpend) {
        dbUser.travelBudgetUsed = trueSpend;
        await dbUser.save({ validateBeforeSave: false });
      }
    }
  } catch (e) {
    logger.warn(`[HRMSAgent] Failed to sync DB users for dept summary: ${e.message}`);
  }

  return summary;
};

module.exports = { validateEmployee, getDepartmentSummary };

// Triggering restart
