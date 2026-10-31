/**
 * Finance AI Agent
 * Reads Finance Excel, checks budget availability, and generates
 * budget update proposals. NEVER directly modifies the live budget
 * without explicit Finance approval.
 */

const {
  getCurrentMonthFinance,
  getFinanceData,
  proposeBudgetUpdate,
  applyBudgetDeduction,
  updateEmployeeBudgetUsed
} = require('../services/excelService');
const logger = require('../utils/logger');

/**
 * Checks whether the company has sufficient monthly budget for a trip.
 * @param {string} companyId
 * @returns {{ approved: boolean, analysis: Object, proposal: Object|null }}
 */
const checkBudget = async (companyId, tripId, employeeId, amount) => {
  logger.info(`[FinanceAgent] Checking budget for trip ${tripId} — amount ₹${amount}`);

  let financeRow;
  try {
    financeRow = getCurrentMonthFinance(companyId);
  } catch (err) {
    return {
      approved: false,
      error:    `Finance Excel read error: ${err.message}`,
      analysis: null,
      proposal: null
    };
  }

  if (!financeRow) {
    return { approved: false, error: 'No finance data for current month', analysis: null, proposal: null };
  }

  const allocated  = financeRow.AllocatedBudget || 0;
  const spent      = financeRow.SpentAmount      || 0;
  const remaining  = allocated - spent;
  const utilisation = ((spent / allocated) * 100).toFixed(1);

  const analysis = {
    month:           financeRow.Month,
    allocated:       allocated,
    spent:           spent,
    remaining:       remaining,
    utilisationPct:  parseFloat(utilisation),
    requestedAmount: amount,
    remainingAfter:  remaining - amount
  };

  // Rule checks
  const warnings  = [];
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

  // Always create a proposal — Finance team reviews before applying
  let proposal = null;
  if (canApprove) {
    proposal = proposeBudgetUpdate(
      companyId,
      tripId,
      employeeId,
      amount,
      `Trip ${tripId} — business travel expense`
    );
  }

  logger.info(`[FinanceAgent] Budget check ${canApprove ? 'PASSED' : 'FAILED'}: ${violations.join('; ') || 'OK'}`);

  return {
    approved:   canApprove,
    analysis,
    proposal,
    warnings,
    violations
  };
};

/**
 * Applies the deduction after Finance approval — updates both Excel sheets.
 * Falls back to MongoDB if employee isn't in the HRMS Excel (e.g. admin users).
 */
const applyApprovedBudget = async (companyId, tripId, employeeId, amount) => {
  logger.info(`[FinanceAgent] Applying approved budget deduction: trip ${tripId}, ₹${amount}`);

  // Deduct from monthly company budget
  let updatedFinance = null;
  try {
    updatedFinance = applyBudgetDeduction(companyId, amount, tripId);
  } catch (err) {
    logger.warn(`[FinanceAgent] Company budget deduction failed: ${err.message}`);
  }

  // Update employee's personal travel budget usage in Excel
  let updatedEmployee = null;
  try {
    updatedEmployee = updateEmployeeBudgetUsed(companyId, employeeId, amount);
  } catch (err) {
    logger.warn(`[FinanceAgent] Excel employee budget update failed: ${err.message}`);
  }

  // Always update in MongoDB so the UI stays in sync
  try {
    const User = require('../models/User');
    const user = await User.findOne({ companyId, employeeId });
    if (user) {
      user.travelBudgetUsed = (user.travelBudgetUsed || 0) + amount;
      await user.save({ validateBeforeSave: false });
      if (!updatedEmployee) {
        updatedEmployee = { employeeId, travelBudgetUsed: user.travelBudgetUsed };
      }
      logger.info(`[FinanceAgent] Updated budget in DB for ${employeeId}: ₹${user.travelBudgetUsed}`);
    }
  } catch (dbErr) {
    logger.error(`[FinanceAgent] DB budget update failed: ${dbErr.message}`);
  }

  return { updatedFinance, updatedEmployee };
};

/**
 * Generates a finance report from Excel data.
 */
const generateReport = (companyId) => {
  const rows = getFinanceData(companyId);
  let monthlyRows = rows.filter(r => r.Department === 'All');
  const deptRows    = rows.filter(r => r.Department && r.Department !== 'All');

  // If there's no explicit "All" department row, aggregate by month
  if (monthlyRows.length === 0 && rows.length > 0) {
    const aggregated = {};
    rows.forEach(r => {
      const m = r.Month || 'Unknown';
      if (!aggregated[m]) {
        aggregated[m] = { Month: m, Department: 'All', AllocatedBudget: 0, SpentAmount: 0 };
      }
      aggregated[m].AllocatedBudget += (r.AllocatedBudget || 0);
      aggregated[m].SpentAmount += (r.SpentAmount || 0);
    });
    monthlyRows = Object.values(aggregated);
  }

  // Ensure RemainingBudget is always accurately calculated
  monthlyRows.forEach(r => r.RemainingBudget = (r.AllocatedBudget || 0) - (r.SpentAmount || 0));
  deptRows.forEach(r => r.RemainingBudget = (r.AllocatedBudget || 0) - (r.SpentAmount || 0));

  const totalAllocated = monthlyRows.reduce((s, r) => s + (r.AllocatedBudget || 0), 0);
  const totalSpent     = monthlyRows.reduce((s, r) => s + (r.SpentAmount     || 0), 0);

  return {
    monthly:      monthlyRows,
    departmental: deptRows,
    summary: {
      totalAllocated,
      totalSpent,
      totalRemaining:   totalAllocated - totalSpent,
      overallUtilisation: totalAllocated ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0
    }
  };
};

module.exports = { checkBudget, applyApprovedBudget, generateReport };
