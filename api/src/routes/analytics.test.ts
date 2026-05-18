// Set JWT_SECRET before any modules that require it are loaded
process.env.JWT_SECRET ??= 'test-secret-for-unit-tests-only';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SignJWT } from 'jose';
import { buildTestApp } from '../test/helpers.js';
import { seedTestProjects, testDb } from '../test/setup.js';
import { analyticsEvents } from '../db/schema.js';

vi.mock('@clerk/fastify', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: '1' }),
}));

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'test-secret');

async function generateAuthToken() {
  return new SignJWT({ sub: '1', username: 'testadmin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET);
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

let app: Awaited<ReturnType<typeof buildTestApp>>;
let token: string;

beforeEach(async () => {
  app = await buildTestApp();
  await seedTestProjects();
  token = await generateAuthToken();
});

afterEach(async () => {
  if (testDb) {
    await testDb.delete(analyticsEvents).run();
  }
});

describe('Analytics API', () => {
  // POST /api/analytics with valid eventType returns 200
  it('POST /api/analytics with valid eventType returns 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/analytics',
      payload: { eventType: 'pageview', projectId: 'proj-001' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
  });

  // POST /api/analytics with invalid eventType returns 400
  it('POST /api/analytics with invalid eventType returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/analytics',
      payload: { eventType: 'invalid_type' },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('invalid eventType');
  });

  // POST /api/analytics records event in DB
  it('POST /api/analytics records event in DB', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/analytics',
      payload: { eventType: 'pageview', projectId: 'proj-001', tag: 'test-tag' },
    });
    expect(res.statusCode).toBe(200);

    // Verify event was recorded in DB
    const events = await testDb.select().from(analyticsEvents).execute();
    expect(events.length).toBeGreaterThan(0);
    const recorded = events.find((e) => e.eventType === 'pageview' && e.projectId === 'proj-001');
    expect(recorded).toBeDefined();
    expect(recorded!.tag).toBe('test-tag');
  });

  // POST /api/analytics rate limited at 60 req/min (send 61, expect 429)
  it('POST /api/analytics rate limited at 60 req/min', async () => {
    // Send 60 requests that should succeed
    for (let i = 0; i < 60; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/analytics',
        payload: { eventType: 'pageview' },
      });
      expect(res.statusCode).toBe(200);
    }

    // 61st request should be rate limited
    const res = await app.inject({
      method: 'POST',
      url: '/api/analytics',
      payload: { eventType: 'pageview' },
    });
    expect(res.statusCode).toBe(429);
  });

  // GET /api/analytics/summary returns 401 without auth
  it('GET /api/analytics/summary returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary',
    });
    expect(res.statusCode).toBe(401);
  });

  // GET /api/analytics/summary returns aggregated stats with auth
  // NOTE: This test is skipped because the summary endpoint uses PostgreSQL-specific
  // SQL functions (date_trunc, to_char, to_timestamp) that SQLite (sql.js) doesn't support.
  // The test environment uses SQLite but production uses PostgreSQL.
  it.skip('GET /api/analytics/summary returns aggregated stats with auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary',
      headers: authHeaders(token),
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('pv');
    expect(body).toHaveProperty('uv');
    expect(body).toHaveProperty('topProjects');
    expect(body).toHaveProperty('topTags');
    expect(body).toHaveProperty('topSearches');
    expect(body).toHaveProperty('dailyPV');
    expect(body).toHaveProperty('topExternalLinks');
    expect(body).toHaveProperty('topFailedSearches');
    expect(body).toHaveProperty('favoriteStats');
    expect(body.pv).toBeGreaterThanOrEqual(1);
  });

  // GET /api/analytics/summary respects range param
  // NOTE: This test is skipped because the summary endpoint uses PostgreSQL-specific
  // SQL functions (date_trunc, to_char, to_timestamp) that SQLite (sql.js) doesn't support.
  it.skip('GET /api/analytics/summary respects range param', async () => {
    const res7 = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary?range=7',
      headers: authHeaders(token),
    });
    const res30 = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary?range=30',
      headers: authHeaders(token),
    });

    expect(res7.statusCode).toBe(200);
    expect(res30.statusCode).toBe(200);

    // Both should return valid response structure
    const body7 = JSON.parse(res7.body);
    const body30 = JSON.parse(res30.body);
    expect(body7).toHaveProperty('pv');
    expect(body30).toHaveProperty('pv');
  });
});
