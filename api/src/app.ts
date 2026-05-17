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
    requestTimeout: 30000,
    bodyLimit: 10 * 1024 * 1024,
  });

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['http://localhost:4000', 'http://localhost:4173'];
  await app.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  await app.register(cookie);

  // Global rate limit: 100 req/min per IP
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // 所有响应带上 X-Request-ID 方便追踪
  app.addHook('onSend', async (request, reply) => {
    reply.header('X-Request-ID', request.id);
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes);
  await app.register(projectRoutes);
  await app.register(favoriteRoutes);
  await app.register(statsRoutes);
  await app.register(uploadRoutes);

  return app;
}
