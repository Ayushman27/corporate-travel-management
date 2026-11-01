/**
 * Integration tests for REST API endpoints
 * Uses supertest — Neon DB connection is mocked
 */

const request = require('supertest');

// Mock pg pool so tests don't need network
jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
    on: jest.fn()
  },
  query: jest.fn().mockResolvedValue({ rows: [] }),
  connectDB: jest.fn().mockResolvedValue(true)
}));

// Mock models
jest.mock('../src/models/User',     () => ({
  findOne: jest.fn(),
  create:  jest.fn(),
  findById: jest.fn()
}));
jest.mock('../src/models/Company',  () => ({
  findOne: jest.fn(),
  create:  jest.fn()
}));
jest.mock('../src/models/Trip',     () => ({ findOne: jest.fn(), find: jest.fn(), countDocuments: jest.fn() }));
jest.mock('../src/models/Log',      () => ({ create: jest.fn() }));

const app = require('../server');

// ── Health check ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with status healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('uptime');
  });
});

// ── Auth routes ───────────────────────────────────────────────────────────────

describe('POST /api/auth/employee-login', () => {
  it('returns 400 when email or companyId missing', async () => {
    const res = await request(app)
      .post('/api/auth/employee-login')
      .send({ email: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/admin-login', () => {
  it('returns 400 when email or password missing', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 for undefined routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── Protected routes ──────────────────────────────────────────────────────────

describe('Protected routes without token', () => {
  it('GET /api/trip/my returns 401', async () => {
    const res = await request(app).get('/api/trip/my');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/finance/report returns 401', async () => {
    const res = await request(app).get('/api/finance/report');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/admin/dashboard returns 401', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.statusCode).toBe(401);
  });
});

// ── Trip request validation ───────────────────────────────────────────────────

describe('POST /api/trip/request validation', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/trip/request')
      .send({ fromCity: 'Delhi', toCity: 'Mumbai' });
    expect(res.statusCode).toBe(401);
  });
});
