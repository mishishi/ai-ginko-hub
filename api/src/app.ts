import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { statsRoutes } from './routes/stats.js';
import { uploadRoutes } from './routes/upload.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: ['http://localhost:4000', 'http://localhost:4173'],
    credentials: true,
  });

  await app.register(cookie);

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes);
  await app.register(projectRoutes);
  await app.register(statsRoutes);
  await app.register(uploadRoutes);

  return app;
}
