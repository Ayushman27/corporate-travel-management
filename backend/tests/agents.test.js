/**
 * Unit tests for AI agents
 */

const { scoreRoute } = require('../src/agents/optimizationAgent');
const { checkPolicy } = require('../src/services/policyService');
const { generateRoutes } = require('../src/agents/planningAgent');

// ── Optimization Agent ────────────────────────────────────────────────────────

describe('OptimizationAgent — scoreRoute', () => {
  const allRoutes = [
    { totalCost: 2000, totalDuration: 300, segments: [{ mode: 'train' }, { mode: 'metro' }] },
    { totalCost: 5000, totalDuration: 150, segments: [{ mode: 'flight' }, { mode: 'cab' }] },
    { totalCost: 1000, totalDuration: 480, segments: [{ mode: 'bus'  }, { mode: 'metro' }] },
  ];

  test('cheapest route gets highest cost score', () => {
    const cheapest  = scoreRoute(allRoutes[2], allRoutes);
    const expensive = scoreRoute(allRoutes[1], allRoutes);
    expect(cheapest.costScore).toBeGreaterThan(expensive.costScore);
  });

  test('fastest route gets highest speed score', () => {
    const fastest  = scoreRoute(allRoutes[1], allRoutes);
    const slowest  = scoreRoute(allRoutes[2], allRoutes);
    expect(fastest.speedScore).toBeGreaterThan(slowest.speedScore);
  });

  test('scores are in range 0–10', () => {
    allRoutes.forEach(r => {
      const scores = scoreRoute(r, allRoutes);
      expect(scores.costScore).toBeGreaterThanOrEqual(0);
      expect(scores.costScore).toBeLessThanOrEqual(10);
      expect(scores.speedScore).toBeGreaterThanOrEqual(0);
      expect(scores.speedScore).toBeLessThanOrEqual(10);
    });
  });
});

// ── Policy Service ────────────────────────────────────────────────────────────

describe('PolicyService — checkPolicy', () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const trip = { travelDate: futureDate, travelMode: 'mixed' };

  test('employee within budget passes', async () => {
    const result = await checkPolicy(trip, 'employee', 20000);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('employee over budget fails', async () => {
    const result = await checkPolicy(trip, 'employee', 60000);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  test('manager has higher budget limit', async () => {
    const result = await checkPolicy(trip, 'manager', 100000);
    expect(result.passed).toBe(true);
  });

  test('same-day travel fails advance notice check', async () => {
    const today = new Date().toISOString();
    const result = await checkPolicy({ ...trip, travelDate: today }, 'employee', 10000);
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.includes('days from today'))).toBe(true);
  });

  test('budget warning at 80%', async () => {
    const result = await checkPolicy(trip, 'employee', 42000); // 84% of 50000
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// ── Planning Agent ────────────────────────────────────────────────────────────

describe('PlanningAgent — generateRoutes', () => {
  test('returns routes for Mumbai-Delhi (manager role gets flights)', async () => {
    const routes = await generateRoutes(
      { fromCity: 'Mumbai', toCity: 'Delhi', travelDate: '2026-06-01' },
      'manager'
    );
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
    routes.forEach(r => {
      expect(r).toHaveProperty('totalCost');
      expect(r).toHaveProperty('totalDuration');
      expect(r).toHaveProperty('segments');
      expect(Array.isArray(r.segments)).toBe(true);
    });
  });

  test('each route has at least 2 segments', async () => {
    const routes = await generateRoutes(
      { fromCity: 'Delhi', toCity: 'Mumbai', travelDate: '2026-06-01' },
      'employee'
    );
    routes.forEach(r => expect(r.segments.length).toBeGreaterThanOrEqual(2));
  });

  test('totalCost equals sum of segment costs', async () => {
    const routes = await generateRoutes(
      { fromCity: 'Mumbai', toCity: 'Pune', travelDate: '2026-06-01' },
      'employee'
    );
    routes.forEach(r => {
      const sum = r.segments.reduce((s, seg) => s + (seg.cost || 0), 0);
      expect(r.totalCost).toBe(sum);
    });
  });
});
