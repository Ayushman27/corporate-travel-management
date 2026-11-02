const Plan = require('../models/Plan');
const User = require('../models/User');

/**
 * Enriches a trip with detailed itemized bill information and employee budget comparisons.
 * @param {Object} trip - The trip document
 * @returns {Promise<Object>} Enriched trip object with billDetails
 */
const enrichTripWithBillDetails = async (trip) => {
  const plainTrip = trip.toObject ? trip.toObject() : { ...trip };

  // 1. Employee budget info
  let employeeBudgetLimit = 20000;
  let employeeBudgetUsed = 0;
  try {
    const user = await User.findOne({ companyId: plainTrip.companyId, employeeId: plainTrip.employeeId });
    if (user) {
      employeeBudgetLimit = Number(user.travelBudgetLimit) || 20000;
      employeeBudgetUsed  = Number(user.travelBudgetUsed) || 0;
    }
  } catch (_) {}

  // 2. Transport plan info
  let plan = null;
  try {
    if (plainTrip.selectedPlanId) {
      plan = await Plan.findById(plainTrip.selectedPlanId);
    }
    if (!plan && plainTrip.tripId) {
      plan = await Plan.findOne({ tripId: plainTrip.tripId });
    }
  } catch (_) {}

  const hotelCost = plainTrip.selectedHotel?.totalCost ? Number(plainTrip.selectedHotel.totalCost) : 0;
  let travelCost = plan ? Number(plan.totalCost) : Math.max(0, Number(plainTrip.estimatedBudget || 0) - hotelCost);
  if (travelCost === 0 && Number(plainTrip.estimatedBudget) > hotelCost) {
    travelCost = Number(plainTrip.estimatedBudget) - hotelCost;
  }
  const totalCost = Number(plainTrip.estimatedBudget) || (travelCost + hotelCost);

  const isExceedingBudget = totalCost > employeeBudgetLimit;
  const budgetExcessAmount = Math.max(0, totalCost - employeeBudgetLimit);

  const billDetails = {
    employeeBudgetLimit,
    employeeBudgetUsed,
    travelCost,
    hotelCost,
    totalCost,
    isExceedingBudget,
    budgetExcessAmount,
    warning: isExceedingBudget
      ? `Employee budget is ₹${employeeBudgetLimit.toLocaleString('en-IN')}, requested bill is ₹${totalCost.toLocaleString('en-IN')} (Exceeds by ₹${budgetExcessAmount.toLocaleString('en-IN')}). Amount will not be cut from employee's personal budget.`
      : null,
    segments: plan?.segments || [],
    hotel: plainTrip.selectedHotel || null,
  };

  plainTrip.employeeBudgetLimit = employeeBudgetLimit;
  plainTrip.employeeBudgetUsed  = employeeBudgetUsed;
  plainTrip.isExceedingBudget   = isExceedingBudget;
  plainTrip.budgetExcessAmount  = budgetExcessAmount;
  plainTrip.billDetails         = billDetails;

  return plainTrip;
};

module.exports = { enrichTripWithBillDetails };

