/**
 * Finance AI Agent
 * Manages budgets, approvals, and real-time expenditure tracking.
 * Connects directly to Neon DB for persistence across restarts.
 */

const Budget = require('../models/Budget');
const User   = require('../models/User');
const Company = require('../models/Company');
const {
  getCurrentMonthFinance,
  getFinanceData,
  proposeBudgetUpdate,
  applyBudgetDeduction,
  updateEmployeeBudgetUsed,
  syncCompanyDataToDB
} = require('../services/excelService');
const logger = require('../utils/logger');

const MONTH_ORDER = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

/**
 * Checks whether the company has sufficient monthly budget for a trip.
 */
const checkBudget = async (companyId, tripId, employeeId, amount) => {
  logger.info(`[FinanceAgent] Checking budget for trip ${tripId} — amount ₹${amount}`);

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });

  // 1. Try Neon DB first
  let budgetRow = await Budget.findOne({ companyId, month: currentMonthName, department: 'All' });
  if (!budgetRow) {
    // Try auto-syncing from sheet
    try {
      await syncCompanyDataToDB(companyId);
      budgetRow = await Budget.findOne({ companyId, month: currentMonthName, department: 'All' });
    } catch (_) {}
  }

  // 2. Fallback to Excel
  let allocated = 500000;
  let spent = 0;
  let remaining = 500000;
  let month = currentMonthName;

  if (budgetRow) {
    allocated = Number(budgetRow.allocatedBudget) || 500000;
    spent = Number(budgetRow.spentAmount) || 0;
    remaining = Number(budgetRow.remainingBudget) !== undefined ? Number(budgetRow.remainingBudget) : (allocated - spent);
    month = budgetRow.month;
  } else {
    try {
      const excelRow = getCurrentMonthFinance(companyId);
      if (excelRow) {
        allocated = Number(excelRow.AllocatedBudget) || 500000;
        spent = Number(excelRow.SpentAmount) || 0;
        remaining = allocated - spent;
        month = excelRow.Month || currentMonthName;
      }
    } catch (_) {}
  }

  const utilisation = allocated > 0 ? ((spent / allocated) * 100).toFixed(1) : '0';

  const analysis = {
    month,
    allocated,
    spent,
    remaining,
    utilisationPct: parseFloat(utilisation),
    requestedAmount: amount,
    remainingAfter: remaining - amount
  };

  const warnings = [];
  const violations = [];

  if (amount > remaining) {
    violations.push(`Requested amount ₹${amount.toLocaleString('en-IN')} exceeds remaining budget ₹${remaining.toLocaleString('en-IN')}`);
  }
  if (analysis.utilisationPct > 90) {
    warnings.push(`Monthly budget is ${utilisation}% utilised — approaching limit`);
  }
  if (amount > allocated * 0.15) {
    warnings.push(`Single trip cost is ${((amount / allocated) * 100).toFixed(1)}% of monthly budget — needs Finance Director approval`);
  }

  const canApprove = violations.length === 0;

  let proposal = null;
  if (canApprove) {
    try {
      proposal = proposeBudgetUpdate(
        companyId,
        tripId,
        employeeId,
        amount,
        `Trip ${tripId} — business travel expense`
      );
    } catch (_) {}
  }

  logger.info(`[FinanceAgent] Budget check ${canApprove ? 'PASSED' : 'FAILED'}: ${violations.join('; ') || 'OK'}`);

  return {
    approved: canApprove,
    analysis,
    proposal,
    warnings,
    violations
  };
};

/**
 * Applies the deduction after Finance approval:
 * Updates Neon DB in real time, and updates Excel if accessible.
 */
const applyApprovedBudget = async (companyId, tripId, employeeId, amount) => {
  logger.info(`[FinanceAgent] Applying approved budget deduction: trip ${tripId}, ₹${amount}`);

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });

  // 1. Update Neon DB monthly budget
  let updatedFinance = null;
  try {
    let budget = await Budget.findOne({ companyId, month: currentMonthName, department: 'All' });
    if (!budget) {
      budget = await Budget.findOne({ companyId, department: 'All' });
    }
    if (budget) {
      budget.spentAmount = (Number(budget.spentAmount) || 0) + Number(amount);
      budget.remainingBudget = Math.max(0, (Number(budget.allocatedBudget) || 0) - budget.spentAmount);
      budget.lastUpdated = now;
      await budget.save();
      updatedFinance = {
        month: budget.month,
        allocatedBudget: budget.allocatedBudget,
        spentAmount: budget.spentAmount,
        remainingBudget: budget.remainingBudget,
        lastUpdated: budget.lastUpdated
      };
      logger.info(`[FinanceAgent] Updated Neon DB budget for ${budget.month}: spent ₹${budget.spentAmount}`);
    }
  } catch (err) {
    logger.error(`[FinanceAgent] Neon DB budget deduction error: ${err.message}`);
  }

  // 2. Update employee's personal travel budget usage in Neon DB
  let updatedEmployee = null;
  try {
    const user = await User.findOne({ companyId, employeeId });
    if (user) {
      user.travelBudgetUsed = (Number(user.travelBudgetUsed) || 0) + Number(amount);
      await user.save();
      updatedEmployee = {
        employeeId,
        travelBudgetUsed: user.travelBudgetUsed,
        travelBudgetLimit: user.travelBudgetLimit
      };
      logger.info(`[FinanceAgent] Updated budget in Neon DB for ${employeeId}: ₹${user.travelBudgetUsed}`);
    }
  } catch (dbErr) {
    logger.error(`[FinanceAgent] DB employee budget update failed: ${dbErr.message}`);
  }

  // 3. Best-effort update local Excel files
  try { applyBudgetDeduction(companyId, amount, tripId); } catch (_) {}
  try { updateEmployeeBudgetUsed(companyId, employeeId, amount); } catch (_) {}

  return { updatedFinance, updatedEmployee };
};

/**
 * Generates real-time finance report from Neon DB.
 */
const generateReport = async (companyId) => {
  // 1. Fetch budgets from Neon DB
  let dbBudgets = await Budget.find({ companyId });

  // Auto-sync if not found in DB
  if (!dbBudgets || dbBudgets.length === 0) {
    try {
      await syncCompanyDataToDB(companyId);
      dbBudgets = await Budget.find({ companyId });
    } catch (err) {
      logger.warn(`[FinanceAgent] Auto-sync to DB failed: ${err.message}`);
    }
  }

  let monthlyRows = [];
  let deptRows = [];

  if (dbBudgets && dbBudgets.length > 0) {
    monthlyRows = dbBudgets
      .filter(b => (!b.department || b.department === 'All'))
      .map(b => ({
        Month: b.month,
        Department: b.department || 'All',
        AllocatedBudget: Number(b.allocatedBudget) || 0,
        SpentAmount: Number(b.spentAmount) || 0,
        RemainingBudget: Number(b.remainingBudget) !== undefined
          ? Number(b.remainingBudget)
          : ((Number(b.allocatedBudget) || 0) - (Number(b.spentAmount) || 0)),
        LastUpdated: b.lastUpdated || b.updatedAt || b.createdAt || new Date().toISOString()
      }));

    deptRows = dbBudgets
      .filter(b => b.department && b.department !== 'All')
      .map(b => ({
        Month: b.month,
        Department: b.department,
        AllocatedBudget: Number(b.allocatedBudget) || 0,
        SpentAmount: Number(b.spentAmount) || 0,
        RemainingBudget: Number(b.remainingBudget) !== undefined
          ? Number(b.remainingBudget)
          : ((Number(b.allocatedBudget) || 0) - (Number(b.spentAmount) || 0)),
        LastUpdated: b.lastUpdated || b.updatedAt || b.createdAt || new Date().toISOString()
      }));
  }

  // Fallback to Excel if Neon DB had no rows
  if (monthlyRows.length === 0) {
    const excelRows = getFinanceData(companyId);
    monthlyRows = excelRows.filter(r => r.Department === 'All');
    deptRows    = excelRows.filter(r => r.Department && r.Department !== 'All');

    if (monthlyRows.length === 0 && excelRows.length > 0) {
      const aggregated = {};
      excelRows.forEach(r => {
        const m = r.Month || 'Unknown';
        if (!aggregated[m]) {
          aggregated[m] = { Month: m, Department: 'All', AllocatedBudget: 0, SpentAmount: 0, LastUpdated: new Date().toISOString() };
        }
        aggregated[m].AllocatedBudget += (r.AllocatedBudget || 0);
        aggregated[m].SpentAmount += (r.SpentAmount || 0);
      });
      monthlyRows = Object.values(aggregated);
    }

    monthlyRows.forEach(r => {
      r.RemainingBudget = (r.AllocatedBudget || 0) - (r.SpentAmount || 0);
      r.LastUpdated = r.LastUpdated || new Date().toISOString();
    });
  }

  // Sort months in natural calendar order (Jan -> Dec)
  monthlyRows.sort((a, b) => {
    const idxA = MONTH_ORDER.indexOf(String(a.Month).toLowerCase().trim());
    const idxB = MONTH_ORDER.indexOf(String(b.Month).toLowerCase().trim());
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  const totalAllocated = monthlyRows.reduce((s, r) => s + (r.AllocatedBudget || 0), 0);
  const totalSpent     = monthlyRows.reduce((s, r) => s + (r.SpentAmount     || 0), 0);

  // Determine current month real-time stats
  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
  const currentMonthRow = monthlyRows.find(r => r.Month.toLowerCase().includes(currentMonthName.toLowerCase())) || monthlyRows[now.getMonth()] || monthlyRows[0];

  const company = await Company.findOne({ companyId });

  return {
    monthly: monthlyRows,
    departmental: deptRows,
    summary: {
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
      overallUtilisation: totalAllocated ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0,
      currentMonth: {
        month: currentMonthRow?.Month || currentMonthName,
        allocated: currentMonthRow?.AllocatedBudget || 0,
        spent: currentMonthRow?.SpentAmount || 0,
        remaining: currentMonthRow?.RemainingBudget || 0,
        utilisation: currentMonthRow?.AllocatedBudget ? (((currentMonthRow.SpentAmount || 0) / currentMonthRow.AllocatedBudget) * 100).toFixed(1) : 0,
        lastUpdated: currentMonthRow?.LastUpdated || new Date().toISOString()
      },
      lastSyncedAt: company?.lastSheetSync || new Date().toISOString()
    }
  };
};

module.exports = { checkBudget, applyApprovedBudget, generateReport };
