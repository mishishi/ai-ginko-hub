import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildTestApp } from '../test/helpers.js';
import { seedTestProjects } from '../test/setup.js';

let app: Awaited<ReturnType<typeof buildTestApp>>;
beforeEach(async () => {
  vi.resetModules();
  vi.restoreAllMocks();
  app = await buildTestApp();
  await seedTestProjects();
});

describe('Stats API', () => {
  // GET /api/stats returns total, featured, techCount fields
  it('returns total, featured, and techCount fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('featured');
    expect(body).toHaveProperty('techCount');
    expect(typeof body.total).toBe('number');
    expect(typeof body.featured).toBe('number');
    expect(typeof body.techCount).toBe('number');
  });

  it('returns correct totals for seeded projects', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    // Seeded: 3 projects total, 1 featured (proj-001)
    expect(body.total).toBe(3);
    expect(body.featured).toBe(1);
  });
});

describe('Tags API', () => {
  // GET /api/tags returns deduplicated sorted tag array
  it('returns deduplicated sorted tag array', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/tags' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('tags');
    expect(Array.isArray(body.tags)).toBe(true);

    // Check deduplication: TypeScript appears in proj-001 and proj-003, React in proj-001 and proj-003
    // Expected unique tags: Fastify, JavaScript, React, TypeScript, Vue
    const expectedTags = ['Fastify', 'JavaScript', 'React', 'TypeScript', 'Vue'];
    expect(body.tags).toEqual(expectedTags);

    // Verify sorted order
    const sorted = [...body.tags].sort();
    expect(body.tags).toEqual(sorted);
  });
});
