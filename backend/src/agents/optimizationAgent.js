/**
 * Optimization Agent
 * Scores route candidates and produces 3 optimized plans:
 *   lowest_cost | fastest | most_comfortable
 */

const Plan  = require('../models/Plan');
const logger = require('../utils/logger');

// Comfort weights per segment mode (0-10)
const COMFORT_WEIGHT = { flight: 8, train: 6, bus: 4, metro: 5, cab: 7, walk: 3 };

/**
 * Score a single route on 3 dimensions (0–10 each).
 */
const scoreRoute = (route, allRoutes) => {
  const costs     = allRoutes.map(r => r.totalCost);
  const durations = allRoutes.map(r => r.totalDuration);

  const minCost  = Math.min(...costs);
  const maxCost  = Math.max(...costs);
  const minDur   = Math.min(...durations);
  const maxDur   = Math.max(...durations);

  // Normalise: best (lowest) → 10, worst → 0
  const costScore  = maxCost  === minCost  ? 10 : 10 * (1 - (route.totalCost     - minCost)  / (maxCost  - minCost));
  const speedScore = maxDur   === minDur   ? 10 : 10 * (1 - (route.totalDuration - minDur)   / (maxDur   - minDur));

  // Comfort = weighted average of segment comfort scores
  const comfortScore = route.segments.reduce((acc, seg) => {
    return acc + (COMFORT_WEIGHT[seg.mode] || 5);
  }, 0) / route.segments.length;

  const overallScore = (costScore * 0.35 + speedScore * 0.35 + comfortScore * 0.30);

  return {
    costScore:    parseFloat(costScore.toFixed(2)),
    speedScore:   parseFloat(speedScore.toFixed(2)),
    comfortScore: parseFloat(comfortScore.toFixed(2)),
    overallScore: parseFloat(overallScore.toFixed(2))
  };
};

/**
 * Pick highlights / warnings for a plan.
 */
const buildMeta = (route, planType) => {
  const highlights = [];
  const warnings   = [];

  if (planType === 'lowest_cost') {
    highlights.push(`Total cost ₹${route.totalCost.toLocaleString('en-IN')} — most economical option`);
    if (route.totalDuration > 600) warnings.push('Long travel time — consider taking a day off');
  }
  if (planType === 'fastest') {
    const hrs = Math.floor(route.totalDuration / 60);
    const min = route.totalDuration % 60;
    highlights.push(`Reach in ${hrs}h ${min}m — fastest available route`);
    if (route.totalCost > 8000) warnings.push('Premium pricing for speed');
  }
  if (planType === 'most_comfortable') {
    highlights.push('Optimal comfort with fewer transfers');
    if (route.totalCost > 12000) warnings.push('Higher cost — verify with finance policy');
  }

  const modes = [...new Set(route.segments.map(s => s.mode))];
  highlights.push(`Modes: ${modes.join(' → ')}`);

  return { highlights, warnings };
};

/**
 * Main entry point.
 * @param {string} tripId
 * @param {Array}  routes   - output from planningAgent.generateRoutes()
 * @returns {Array}         - 3 Plan documents saved to MongoDB
 */
const optimizeRoutes = async (tripId, routes) => {
  if (!routes || routes.length === 0) {
    throw new Error('[OptimizationAgent] No routes to optimise');
  }

  logger.info(`[OptimizationAgent] Scoring ${routes.length} routes for trip ${tripId}`);

  // Score every candidate
  const scored = routes.map(route => ({
    ...route,
    ...scoreRoute(route, routes)
  }));

  // Sort by each dimension
  const byCost    = [...scored].sort((a, b) => a.totalCost     - b.totalCost)[0];
  const bySpeed   = [...scored].sort((a, b) => a.totalDuration - b.totalDuration)[0];
  const byComfort = [...scored].sort((a, b) => b.comfortScore  - a.comfortScore)[0];

  const typedPlans = [
    { route: byCost,    planType: 'lowest_cost',      rank: 1 },
    { route: bySpeed,   planType: 'fastest',           rank: 2 },
    { route: byComfort, planType: 'most_comfortable',  rank: 3 }
  ];

  // Save plans to DB (replace existing ones for this trip)
  await Plan.deleteMany({ tripId });

  const savedPlans = [];
  for (const { route, planType, rank } of typedPlans) {
    const { highlights, warnings } = buildMeta(route, planType);

    const planDoc = await Plan.create({
      tripId,
      planType,
      rank,
      segments:      route.segments,
      totalCost:     route.totalCost,
      totalDuration: route.totalDuration,
      costScore:     route.costScore,
      speedScore:    route.speedScore,
      comfortScore:  route.comfortScore,
      overallScore:  route.overallScore,
      summary:       `${planType.replace(/_/g, ' ')} option via ${route.operator || route.primaryMode}`,
      highlights,
      warnings
    });
    savedPlans.push(planDoc);
  }

  logger.info(`[OptimizationAgent] Saved ${savedPlans.length} optimised plans for trip ${tripId}`);
  return savedPlans;
};

module.exports = { optimizeRoutes, scoreRoute };
