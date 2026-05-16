import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { statsRoutes } from './routes/stats.js';
import { uploadRoutes } from './routes/upload.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes);
  await app.register(projectRoutes);
  await app.register(statsRoutes);
  await app.register(uploadRoutes);

  return app;
}
