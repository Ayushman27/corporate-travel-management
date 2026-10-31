/**
 * Telemetry Mock Data & Constants
 * Realistic seeded data for a corporate travel + multi-agent platform.
 */

// ── Agent Definitions ──────────────────────────────────────────────────────
export const AGENTS = [
  { id: 'search',     name: 'SearchAgent',     desc: 'Flight & hotel search queries' },
  { id: 'itinerary',  name: 'ItineraryAgent',  desc: 'Travel itinerary generation' },
  { id: 'policy',     name: 'PolicyAgent',     desc: 'Travel policy compliance checks' },
  { id: 'approval',   name: 'ApprovalAgent',   desc: 'Approval workflow automation' },
  { id: 'booking',    name: 'BookingAgent',    desc: 'Booking execution & confirmation' },
  { id: 'support',    name: 'SupportAgent',    desc: 'Customer support automation' },
  { id: 'cost',       name: 'CostOptimizer',   desc: 'Travel cost optimization' },
  { id: 'fraud',      name: 'FraudDetector',   desc: 'Fraud & anomaly detection' },
];

// ── API/Tool Provider Definitions ──────────────────────────────────────────
export const APIS = [
  { id: 'amadeus',   name: 'Amadeus',       category: 'Flights',   icon: '✈' },
  { id: 'serpapi',   name: 'SerpApi',        category: 'Hotels',    icon: '🏨' },
  { id: 'gmaps',     name: 'Google Maps',    category: 'Location',  icon: '📍' },
  { id: 'stripe',    name: 'Stripe',         category: 'Payments',  icon: '💳' },
  { id: 'sendgrid',  name: 'SendGrid',       category: 'Email',     icon: '📧' },
  { id: 'twilio',    name: 'Twilio',         category: 'SMS',       icon: '📱' },
  { id: 'openai',    name: 'OpenAI GPT-4',   category: 'AI Model',  icon: '🤖' },
  { id: 'gvision',   name: 'Google Vision',  category: 'OCR',       icon: '👁' },
  { id: 'mongo',     name: 'MongoDB Atlas',  category: 'Database',  icon: '🗄' },
  { id: 'redis',     name: 'Redis Cache',    category: 'Cache',     icon: '⚡' },
];

export const COMPANIES = ['TechCorp', 'GlobalFinance', 'MediHealth', 'EduFirst', 'RetailMax'];
export const SEVERITIES = ['critical', 'warning', 'info'];
export const TIME_RANGES = ['15m', '1h', '6h', '24h', '7d', 'custom'];
export const ENVIRONMENTS = ['prod', 'staging', 'dev'];

// ── Helpers ────────────────────────────────────────────────────────────────
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randF(min, max, dec = 1) { return +(min + Math.random() * (max - min)).toFixed(dec); }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

function genTimeSeries(points, base, variance, trend = 0) {
  const data = [];
  const now = Date.now();
  const interval = (24 * 3600 * 1000) / points;
  for (let i = 0; i < points; i++) {
    const t = new Date(now - (points - i) * interval);
    const noise = (Math.random() - 0.5) * variance * 2;
    const val = Math.max(0, +(base + noise + trend * (i / points)).toFixed(1));
    data.push({ time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: val });
  }
  return data;
}

function genMultiSeries(points, series) {
  const data = [];
  const now = Date.now();
  const interval = (24 * 3600 * 1000) / points;
  for (let i = 0; i < points; i++) {
    const t = new Date(now - (points - i) * interval);
    const point = { time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    for (const s of series) {
      const noise = (Math.random() - 0.5) * s.variance * 2;
      point[s.key] = Math.max(0, +(s.base + noise).toFixed(1));
    }
    data.push(point);
  }
  return data;
}

// ── KPI Summary ────────────────────────────────────────────────────────────
export function getKPISummary() {
  return {
    totalRequests:   { value: 12847,  trend: +3.2,  spark: genTimeSeries(20, 530, 80) },
    activeSessions:  { value: 342,    trend: +1.8,  spark: genTimeSeries(20, 340, 40) },
    agentRuns:       { value: 1256,   trend: +5.1,  spark: genTimeSeries(20, 52, 12) },
    successRate:     { value: 97.3,   trend: +0.4,  spark: genTimeSeries(20, 97, 1.5) },
    errorRate:       { value: 2.7,    trend: -0.4,  spark: genTimeSeries(20, 2.7, 1) },
    p95Latency:      { value: 847,    trend: -12,   spark: genTimeSeries(20, 850, 120) },
    bookingsToday:   { value: 89,     trend: +7.3,  spark: genTimeSeries(20, 3.7, 1.5) },
    apiCalls:        { value: 45231,  trend: +2.1,  spark: genTimeSeries(20, 1880, 300) },
    aiCost:          { value: 127.45, trend: +4.6,  spark: genTimeSeries(20, 5.3, 1.5) },
    apiCost:         { value: 89.23,  trend: -1.2,  spark: genTimeSeries(20, 3.7, 1) },
    openAlerts:      { value: 3,      trend: 0,     spark: genTimeSeries(20, 2, 1.5) },
  };
}

// ── System Health ──────────────────────────────────────────────────────────
export function getSystemHealth() {
  return {
    requestsPerMin: genTimeSeries(48, 520, 90, 30),
    errorRateTime:  genTimeSeries(48, 2.5, 1.2),
    latency: genMultiSeries(48, [
      { key: 'p50', base: 180, variance: 40 },
      { key: 'p95', base: 850, variance: 150 },
      { key: 'p99', base: 1400, variance: 250 },
    ]),
    uptime: 99.97,
    queueBacklog: rand(12, 45),
    webhookFailures: rand(2, 8),
    rateLimitEvents: rand(5, 22),
    retryVolume: rand(30, 85),
    circuitBreakers: [
      { service: 'Amadeus API',    status: 'closed' },
      { service: 'Stripe',         status: 'closed' },
      { service: 'SendGrid',       status: 'closed' },
      { service: 'Google Vision',  status: 'half-open' },
    ],
  };
}

// ── Agent Metrics ──────────────────────────────────────────────────────────
export function getAgentMetrics() {
  return AGENTS.map(a => {
    const runs = rand(80, 400);
    const failures = rand(1, Math.floor(runs * 0.08));
    return {
      ...a,
      totalRuns: runs,
      activeSessions: rand(2, 18),
      successRate: +((1 - failures / runs) * 100).toFixed(1),
      failures,
      avgDuration: randF(0.8, 6.5),
      p95Duration: randF(3, 15),
      tokenUsage: rand(8000, 95000),
      modelCost: randF(2, 28),
      toolCalls: rand(runs, runs * 4),
      handoffs: rand(0, 15),
      escalations: rand(0, 5),
      guardrailTriggers: rand(0, 8),
      qualityScore: randF(3.2, 4.9),
      trend: genTimeSeries(24, runs / 24, runs / 48),
    };
  }).sort((a, b) => b.totalRuns - a.totalRuns);
}

// ── API Metrics ────────────────────────────────────────────────────────────
export function getApiMetrics() {
  const statuses = ['healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'degraded', 'healthy', 'healthy', 'healthy'];
  return APIS.map((a, i) => ({
    ...a,
    status: statuses[i],
    latency: rand(45, 1200),
    p95Latency: rand(200, 2500),
    p99Latency: rand(500, 4000),
    errorRate: randF(0, 4.5),
    calls: rand(500, 12000),
    timeouts: rand(0, 15),
    http4xx: rand(0, 40),
    http5xx: rand(0, 12),
    rateLimits: rand(0, 8),
    retries: rand(5, 60),
    trend: genTimeSeries(24, rand(20, 500), 30),
  }));
}

// ── Business Funnel ────────────────────────────────────────────────────────
export function getFunnelData() {
  const searchStarted = 4280;
  const itineraryGen = Math.floor(searchStarted * 0.72);
  const policyPass   = Math.floor(itineraryGen * 0.88);
  const approvalInit = Math.floor(policyPass * 0.91);
  const approvalDone = Math.floor(approvalInit * 0.85);
  const bookStart    = Math.floor(approvalDone * 0.93);
  const bookSuccess  = Math.floor(bookStart * 0.96);
  const bookFailed   = bookStart - bookSuccess;
  return [
    { label: 'Search Started',      value: searchStarted, color: 'var(--tm-info)' },
    { label: 'Itinerary Generated', value: itineraryGen,  color: 'var(--tm-purple)' },
    { label: 'Policy Check Passed', value: policyPass,    color: 'var(--tm-accent)' },
    { label: 'Approval Initiated',  value: approvalInit,  color: 'var(--tm-warning)' },
    { label: 'Approval Completed',  value: approvalDone,  color: '#f97316' },
    { label: 'Booking Started',     value: bookStart,     color: 'var(--tm-success)' },
    { label: 'Booking Success',     value: bookSuccess,   color: '#059669' },
    { label: 'Booking Failed',      value: bookFailed,    color: 'var(--tm-error)', isNegative: true },
  ];
}

// ── Alerts ──────────────────────────────────────────────────────────────────
export function getAlerts() {
  return [
    { id: 'ALT-001', severity: 'critical', title: 'Amadeus API 5xx spike', desc: '5xx error rate jumped to 12.4% in last 5 min. Booking flow impacted.', component: 'Amadeus API', timestamp: new Date(Date.now() - 4 * 60000), status: 'active', impactedTraces: 23 },
    { id: 'ALT-002', severity: 'critical', title: 'BookingAgent failure burst', desc: '8 consecutive booking failures for TechCorp tenant in last 10 min.', component: 'BookingAgent', timestamp: new Date(Date.now() - 11 * 60000), status: 'active', impactedTraces: 8 },
    { id: 'ALT-003', severity: 'warning',  title: 'P95 latency elevated', desc: 'ItineraryAgent P95 latency at 8.2s (threshold: 5s). Model response slow.', component: 'ItineraryAgent', timestamp: new Date(Date.now() - 22 * 60000), status: 'investigating', impactedTraces: 45 },
    { id: 'ALT-004', severity: 'warning',  title: 'Google Vision rate limit', desc: 'Approaching rate limit — 85% of quota used for OCR bill scanning.', component: 'Google Vision', timestamp: new Date(Date.now() - 35 * 60000), status: 'acknowledged', impactedTraces: 12 },
    { id: 'ALT-005', severity: 'info',     title: 'Redis cache hit ratio low', desc: 'Cache hit ratio dropped to 62% (normal: >85%). Check invalidation patterns.', component: 'Redis Cache', timestamp: new Date(Date.now() - 52 * 60000), status: 'active', impactedTraces: 0 },
    { id: 'ALT-006', severity: 'warning',  title: 'Support queue growing', desc: '34 unresolved support tickets in queue (SLA: resolve within 15 min).', component: 'SupportAgent', timestamp: new Date(Date.now() - 68 * 60000), status: 'active', impactedTraces: 34 },
    { id: 'ALT-007', severity: 'info',     title: 'Policy rule update detected', desc: 'Admin updated travel policy for MediHealth — all new trips will use updated rules.', component: 'PolicyAgent', timestamp: new Date(Date.now() - 120 * 60000), status: 'resolved', impactedTraces: 0 },
  ];
}

// ── Trace Examples ─────────────────────────────────────────────────────────
export function getTraces() {
  return [
    {
      traceId: 'trc-a8f3c1d2', sessionId: 'ses-771a', userId: 'EMP-1042', company: 'TechCorp',
      workflow: 'Trip Booking', status: 'failed', duration: 12400, startTime: new Date(Date.now() - 8 * 60000),
      totalTokens: 4280, totalCost: 0.18, model: 'GPT-4o',
      error: 'Amadeus API returned 503 — service unavailable during fare confirmation',
      agents: ['SearchAgent', 'ItineraryAgent', 'PolicyAgent', 'BookingAgent'],
      steps: [
        { name: 'SearchAgent → Flight Search', type: 'agent', duration: 1200, status: 'success', tokens: 820, detail: 'DEL→BOM, 2 adults, economy' },
        { name: 'Amadeus API → Search Flights', type: 'api', duration: 2800, status: 'success', tokens: 0, detail: '14 results returned' },
        { name: 'ItineraryAgent → Generate Plan', type: 'agent', duration: 3200, status: 'success', tokens: 2100, detail: '3 plans generated' },
        { name: 'PolicyAgent → Compliance Check', type: 'agent', duration: 450, status: 'success', tokens: 680, detail: 'All plans pass policy' },
        { name: 'BookingAgent → Initiate Booking', type: 'agent', duration: 800, status: 'success', tokens: 420, detail: 'Plan #2 selected' },
        { name: 'Amadeus API → Book Fare', type: 'api', duration: 3500, status: 'failed', tokens: 0, detail: '503 Service Unavailable' },
        { name: 'BookingAgent → Retry (1/3)', type: 'retry', duration: 400, status: 'failed', tokens: 260, detail: 'Retry after 400ms' },
      ]
    },
    {
      traceId: 'trc-b2e4f5a1', sessionId: 'ses-882b', userId: 'EMP-2087', company: 'GlobalFinance',
      workflow: 'Trip Booking', status: 'success', duration: 8900, startTime: new Date(Date.now() - 25 * 60000),
      totalTokens: 3650, totalCost: 0.15, model: 'GPT-4o',
      error: null,
      agents: ['SearchAgent', 'ItineraryAgent', 'PolicyAgent', 'BookingAgent'],
      steps: [
        { name: 'SearchAgent → Hotel Search', type: 'agent', duration: 900, status: 'success', tokens: 550, detail: 'Mumbai, 3 nights' },
        { name: 'SerpApi → Hotel Search', type: 'api', duration: 1800, status: 'success', tokens: 0, detail: '10 hotels cached from DB' },
        { name: 'ItineraryAgent → Generate Plan', type: 'agent', duration: 2800, status: 'success', tokens: 1900, detail: '3 plans generated' },
        { name: 'PolicyAgent → Check', type: 'agent', duration: 320, status: 'success', tokens: 480, detail: 'Budget within limit' },
        { name: 'Stripe → Payment Auth', type: 'api', duration: 1200, status: 'success', tokens: 0, detail: '₹24,500 authorized' },
        { name: 'BookingAgent → Confirm', type: 'agent', duration: 1100, status: 'success', tokens: 720, detail: 'Booking BK-4421 confirmed' },
        { name: 'SendGrid → Confirmation Email', type: 'api', duration: 780, status: 'success', tokens: 0, detail: 'Sent to employee' },
      ]
    },
    {
      traceId: 'trc-c7d9e3f6', sessionId: 'ses-993c', userId: 'EMP-0551', company: 'MediHealth',
      workflow: 'Support Chat', status: 'success', duration: 4200, startTime: new Date(Date.now() - 42 * 60000),
      totalTokens: 1820, totalCost: 0.08, model: 'GPT-4o-mini',
      error: null,
      agents: ['SupportAgent', 'CostOptimizer'],
      steps: [
        { name: 'SupportAgent → Intent Classification', type: 'agent', duration: 400, status: 'success', tokens: 320, detail: 'Intent: modify_booking' },
        { name: 'MongoDB → Fetch Booking', type: 'api', duration: 120, status: 'success', tokens: 0, detail: 'BK-3892 retrieved' },
        { name: 'CostOptimizer → Calculate Diff', type: 'agent', duration: 1800, status: 'success', tokens: 980, detail: 'Date change: +₹2,300' },
        { name: 'SupportAgent → Response', type: 'agent', duration: 600, status: 'success', tokens: 520, detail: 'Modification options presented' },
        { name: 'SendGrid → Notification', type: 'api', duration: 680, status: 'success', tokens: 0, detail: 'Manager notified' },
      ]
    },
  ];
}

// ── Log Events ─────────────────────────────────────────────────────────────
export function getLogEvents() {
  const events = [];
  const types = ['request', 'agent_run', 'api_call', 'error', 'auth', 'booking', 'policy_check', 'escalation'];
  const messages = [
    'Flight search completed — 14 results in 2.8s',
    'BookingAgent failed — Amadeus 503 on fare confirmation',
    'PolicyAgent flagged over-budget itinerary for EMP-1042',
    'SupportAgent escalated to human — low confidence (0.42)',
    'Stripe payment authorized — ₹24,500 for BK-4421',
    'Redis cache miss — hotel data expired for Mumbai',
    'Google Vision OCR completed — 3 bills scanned in 1.2s',
    'FraudDetector cleared transaction — risk score 0.12',
    'ItineraryAgent generated 3 plans in 3.2s — 2,100 tokens',
    'Rate limit warning — Amadeus at 78% quota',
    'User EMP-2087 logged in via OTP — GlobalFinance',
    'Approval workflow triggered for trip TRP-8834',
    'SendGrid bounce — invalid email for EMP-0551',
    'CostOptimizer saved ₹4,200 on BLR→DEL route',
    'MongoDB slow query — 1.4s on trips collection aggregation',
  ];

  for (let i = 0; i < 50; i++) {
    const severity = i < 3 ? 'error' : i < 10 ? 'warning' : 'info';
    events.push({
      id: `log-${String(i).padStart(3, '0')}`,
      timestamp: new Date(Date.now() - i * rand(30, 300) * 1000),
      type: pick(types),
      severity,
      agent: pick(AGENTS).name,
      message: pick(messages),
      traceId: `trc-${Math.random().toString(36).slice(2, 10)}`,
      status: severity === 'error' ? 'failed' : 'success',
      duration: rand(50, 5000),
      company: pick(COMPANIES),
    });
  }
  return events;
}

// ── Cost Metrics ───────────────────────────────────────────────────────────
export function getCostData() {
  return {
    aiCostOverTime: genTimeSeries(24, 5.3, 2),
    apiCostOverTime: genTimeSeries(24, 3.7, 1.5),
    costByAgent: AGENTS.map(a => ({
      name: a.name,
      cost: randF(2, 28),
      tokens: rand(8000, 95000),
      runs: rand(80, 400),
    })).sort((a, b) => b.cost - a.cost),
    costByProvider: [
      { name: 'OpenAI GPT-4',   cost: randF(60, 95) },
      { name: 'OpenAI GPT-4o-mini', cost: randF(15, 30) },
      { name: 'Amadeus API',    cost: randF(20, 40) },
      { name: 'SerpApi',        cost: randF(5, 15) },
      { name: 'Google Maps',    cost: randF(3, 10) },
      { name: 'Stripe',         cost: randF(8, 18) },
      { name: 'SendGrid',       cost: randF(1, 5) },
      { name: 'Twilio',         cost: randF(2, 8) },
      { name: 'Google Vision',  cost: randF(4, 12) },
    ].sort((a, b) => b.cost - a.cost),
    avgCostPerBooking: randF(2.1, 4.8),
    expensiveTraces: [
      { traceId: 'trc-a8f3c1d2', cost: 0.42, workflow: 'Trip Booking', reason: 'Multiple retries + large context' },
      { traceId: 'trc-d5e8f2a3', cost: 0.38, workflow: 'Itinerary Regen', reason: 'Complex multi-city routing' },
      { traceId: 'trc-f1c2d3e4', cost: 0.31, workflow: 'Support Escalation', reason: 'Long conversation chain' },
    ],
  };
}
