import Fastify from 'fastify';
import cors from '@fastify/cors';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
