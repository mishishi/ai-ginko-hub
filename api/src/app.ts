import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { statsRoutes } from './routes/stats.js';
import { uploadRoutes } from './routes/upload.js';
import { favoriteRoutes } from './routes/favorites.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // TODO(P0-4): 生产环境需从环境变量动态读取 origins，
  // 当前硬编码 localhost 仅适用于本地开发
  await app.register(cors, {
    origin: ['http://localhost:4000', 'http://localhost:4173'],
    credentials: true,
  });

  await app.register(cookie);

  // Global rate limit: 100 req/min per IP
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes);
  await app.register(projectRoutes);
  await app.register(favoriteRoutes);
  await app.register(statsRoutes);
  await app.register(uploadRoutes);

  return app;
}
