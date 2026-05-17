import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { projectRoutes } from './projects.js';
import { favoriteRoutes } from './favorites.js';
import { statsRoutes } from './stats.js';
import { seedTestProjects, initTestDb } from '../test/setup.js';

vi.mock('@clerk/fastify', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'user_test123' }),
}));

vi.mock('../db/index.js', async () => {
  const { initTestDb } = await import('../test/setup.js');
  const testDb = await initTestDb();
  return {
    getDb: () => testDb,
    schema: {},
  };
});

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: ['http://localhost:4000'], credentials: true });
  await app.register(cookie);
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' });
  await app.register(projectRoutes);
  await app.register(favoriteRoutes);
  await app.register(statsRoutes);
  return app;
}

const MOCK_TOKEN = 'test-token';

function authHeaders() {
  return { authorization: `Bearer ${MOCK_TOKEN}` };
}

describe('Favorites API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    await initTestDb();
    await seedTestProjects();
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  // --- GET /api/favorites ---
  it('GET /api/favorites 需要认证', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/favorites' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/favorites 返回用户的收藏列表', async () => {
    // 先添加一个收藏
    await app.inject({
      method: 'POST',
      url: '/api/favorites',
      headers: authHeaders(),
      payload: { projectId: 'proj-001' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/favorites',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((f: { projectId: string }) => f.projectId === 'proj-001')).toBe(true);
  });

  // --- POST /api/favorites ---
  it('POST /api/favorites 添加收藏', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/favorites',
      headers: authHeaders(),
      payload: { projectId: 'proj-002' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.projectId).toBe('proj-002');
    expect(body).toHaveProperty('id');
  });

  it('POST /api/favorites 缺少 projectId 返回 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/favorites',
      headers: authHeaders(),
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/favorites 重复添加返回已有记录', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/favorites',
      headers: authHeaders(),
      payload: { projectId: 'proj-001' },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/favorites',
      headers: authHeaders(),
      payload: { projectId: 'proj-001' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.projectId).toBe('proj-001');
  });

  // --- DELETE /api/favorites/:projectId ---
  it('DELETE /api/favorites/:projectId 取消收藏', async () => {
    // 先添加
    await app.inject({
      method: 'POST',
      url: '/api/favorites',
      headers: authHeaders(),
      payload: { projectId: 'proj-001' },
    });

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/favorites/proj-001',
      headers: authHeaders(),
    });
    expect(res.statusCode).toBe(204);

    // 确认已删除
    const list = await app.inject({
      method: 'GET',
      url: '/api/favorites',
      headers: authHeaders(),
    });
    const body = JSON.parse(list.body);
    expect(body.some((f: { projectId: string }) => f.projectId === 'proj-001')).toBe(false);
  });

  it('DELETE /api/favorites/:projectId 需要认证', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/favorites/proj-001',
    });
    expect(res.statusCode).toBe(401);
  });
});
