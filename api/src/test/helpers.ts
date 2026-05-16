import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from '../routes/auth.js';
import { projectRoutes } from '../routes/projects.js';
import { statsRoutes } from '../routes/stats.js';
import { uploadRoutes } from '../routes/upload.js';
import { favoriteRoutes } from '../routes/favorites.js';
import { testDb } from './setup.js';

// Patch getDb before routes load
const { getDb } = await import('../db/index.js');
vi.spyOn(await import('../db/index.js'), 'getDb').mockImplementation(() => Promise.resolve(testDb) as ReturnType<typeof getDb>);

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: ['http://localhost:4000'], credentials: true });
  await app.register(cookie);
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes);
  await app.register(projectRoutes);
  await app.register(favoriteRoutes);
  await app.register(statsRoutes);
  await app.register(uploadRoutes);

  return app;
}
