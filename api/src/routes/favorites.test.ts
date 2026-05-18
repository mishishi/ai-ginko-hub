// Set JWT_SECRET before any modules that require it are loaded
process.env.JWT_SECRET ??= 'test-secret-for-unit-tests-only';

import { describe, it, expect, beforeEach } from 'vitest';
import { SignJWT } from 'jose';
import { buildTestApp } from '../test/helpers.js';
import { seedTestProjects } from '../test/setup.js';

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

describe('Favorites API', () => {
  // GET /api/favorites returns 401 without auth
  it('GET /api/favorites returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/favorites' });
    expect(res.statusCode).toBe(401);
  });

  // GET /api/favorites returns user favorites with auth
  it('GET /api/favorites returns user favorites with auth', async () => {
    // First add a favorite
    await app.inject({
      method: 'POST',
      url: '/api/favorites',
      headers: authHeaders(token),
      payload: { projectId: 'proj-001' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/favorites',
      headers: authHeaders(token),
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((f: { projectId: string }) => f.projectId === 'proj-001')).toBe(true);
  });

  // POST /api/favorites adds favorite and increments like_count
  it('POST /api/favorites adds favorite and increments like_count', async () => {
    // Check initial like_count
    const projectBefore = await app.inject({
      method: 'GET',
      url: '/api/projects/proj-001',
    });
    const beforeBody = JSON.parse(projectBefore.body);
    const initialLikeCount = beforeBody.likeCount;

    const res = await app.inject({
      method: 'POST',
      url: '/api/favorites',
      headers: authHeaders(token),
      payload: { projectId: 'proj-001' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.projectId).toBe('proj-001');
    expect(body).toHaveProperty('id');

    // Check like_count incremented
    const projectAfter = await app.inject({
      method: 'GET',
      url: '/api/projects/proj-001',
    });
    const afterBody = JSON.parse(projectAfter.body);
    expect(afterBody.likeCount).toBe(initialLikeCount + 1);
  });

  // POST /api/favorites returns 401 without auth
  it('POST /api/favorites returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/favorites',
      payload: { projectId: 'proj-001' },
    });
    expect(res.statusCode).toBe(401);
  });

  // DELETE /api/favorites/:id removes favorite and decrements like_count
  it('DELETE /api/favorites/:id removes favorite and decrements like_count', async () => {
    // First add a favorite
    await app.inject({
      method: 'POST',
      url: '/api/favorites',
      headers: authHeaders(token),
      payload: { projectId: 'proj-001' },
    });

    // Check like_count after adding
    const projectWithFav = await app.inject({
      method: 'GET',
      url: '/api/projects/proj-001',
    });
    const withFavBody = JSON.parse(projectWithFav.body);
    const likeCountWithFav = withFavBody.likeCount;

    // Delete the favorite
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/favorites/proj-001',
      headers: authHeaders(token),
    });
    expect(res.statusCode).toBe(204);

    // Check like_count decremented
    const projectWithoutFav = await app.inject({
      method: 'GET',
      url: '/api/projects/proj-001',
    });
    const withoutFavBody = JSON.parse(projectWithoutFav.body);
    expect(withoutFavBody.likeCount).toBe(likeCountWithFav - 1);

    // Verify favorite is removed from list
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/favorites',
      headers: authHeaders(token),
    });
    const listBody = JSON.parse(listRes.body);
    expect(listBody.some((f: { projectId: string }) => f.projectId === 'proj-001')).toBe(false);
  });

  // DELETE /api/favorites/:id returns 401 without auth
  it('DELETE /api/favorites/:id returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/favorites/proj-001',
    });
    expect(res.statusCode).toBe(401);
  });
});
