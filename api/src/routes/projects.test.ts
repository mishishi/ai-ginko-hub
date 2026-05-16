import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { projectRoutes } from './projects.js';
import { statsRoutes } from './stats.js';
import { seedTestProjects, initTestDb } from '../test/setup.js';

vi.mock('../db/index.js', async () => {
  const { initTestDb } = await import('../test/setup.js');
  const testDb = await initTestDb();
  return {
    getDb: () => Promise.resolve(testDb),
    saveDb: async () => {},
  };
});

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: ['http://localhost:4000'], credentials: true });
  await app.register(cookie);
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' });
  await app.register(projectRoutes);
  await app.register(statsRoutes);
  return app;
}

describe('Projects API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    await initTestDb();
    await seedTestProjects();
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  // --- GET /api/projects ---
  it('返回项目列表', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('默认按 featured 优先、时间倒序排序', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects' });
    const body = JSON.parse(res.body);
    // featured 项目应该在最前
    expect(body[0].featured).toBe(true);
    expect(body[0].name).toBe('Test Project One');
  });

  it('支持 sort=name 按名称排序', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects?sort=name' });
    const body = JSON.parse(res.body);
    expect(body[0].name).toBe('Backend API');
    expect(body[1].name).toBe('Test Project One');
    expect(body[2].name).toBe('Test Project Two');
  });

  it('支持 sort=views 按浏览量排序', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects?sort=views' });
    const body = JSON.parse(res.body);
    expect(body[0].viewCount).toBeGreaterThanOrEqual(body[1].viewCount);
  });

  it('支持 sort=featured', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects?sort=featured' });
    const body = JSON.parse(res.body);
    // featured=true 排在前面
    const featuredIndices = body.map((p: typeof body[0]) => p.featured ? 1 : 0);
    for (let i = 0; i < featuredIndices.length - 1; i++) {
      expect(featuredIndices[i]).toBeGreaterThanOrEqual(featuredIndices[i + 1]);
    }
  });

  it('支持按标签过滤', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects?tag=React' });
    const body = JSON.parse(res.body);
    expect(body.length).toBe(2); // proj-001 and proj-003
    for (const p of body) {
      expect(p.tags).toContain('React');
    }
  });

  it('支持搜索查询', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects?q=Backend' });
    const body = JSON.parse(res.body);
    expect(body.length).toBe(1);
    expect(body[0].name).toBe('Backend API');
  });

  it('支持分页', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects?limit=2&offset=0' });
    const body = JSON.parse(res.body);
    expect(body.length).toBe(2);
    expect(res.headers['x-total-count']).toBe('3');
  });

  it('分页 offset 正确', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects?limit=1&offset=1' });
    const body = JSON.parse(res.body);
    expect(body.length).toBe(1);
    // offset=1: proj-001 (featured) is first, so offset=1 gives proj-003 (newest non-featured)
    expect(body[0].name).toBe('Backend API');
  });

  // --- GET /api/projects/:id ---
  it('GET /api/projects/:id 返回单个项目', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects/proj-001' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe('proj-001');
    expect(body.name).toBe('Test Project One');
    expect(body.tags).toContain('React');
  });

  it('GET /api/projects/:id 不存在时返回 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects/nonexistent' });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/projects/:id 访问时增加 viewCount', async () => {
    const res1 = await app.inject({ method: 'GET', url: '/api/projects/proj-001' });
    expect(res1.statusCode).toBe(200);
    const res2 = await app.inject({ method: 'GET', url: '/api/projects/proj-001' });
    const body = JSON.parse(res2.body);
    expect(body.viewCount).toBeGreaterThan(100);
  });

  // --- POST /api/projects ---
  it('POST /api/projects 需要认证', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: { name: 'New', description: 'New desc', tags: ['Test'], url: 'https://x.com' },
    });
    expect(res.statusCode).toBe(401);
  });

  // --- DELETE /api/projects/:id ---
  it('DELETE /api/projects/:id 需要认证', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/projects/proj-001' });
    expect(res.statusCode).toBe(401);
  });

  // --- repoUrl 字段 ---
  it('返回的项目包含 repoUrl 字段', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects/proj-001' });
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('repoUrl');
    expect(body.repoUrl).toBe('https://github.com/test/project1');
  });
});

describe('Stats API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    await initTestDb();
    await seedTestProjects();
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/stats 返回正确统计数据', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(3);
    expect(body.featured).toBe(1);
    expect(body.totalViews).toBe(350); // 100+50+200
  });

  it('GET /api/tags 返回所有标签', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/tags' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.tags)).toBe(true);
    expect(body.tags.length).toBeGreaterThan(0);
  });
});
