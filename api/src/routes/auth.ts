import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { admin } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';
import { verifyPassword } from '../utils/password.js';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    const db = await getDb();
    const results = await db.select().from(admin).where(eq(admin.username, username)).limit(1);

    if (results.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const user = results[0];
    const valid = verifyPassword(password, user.passwordHash);

    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = await new SignJWT({ sub: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return { token, username: user.username };
  });

  app.get('/api/auth/me', {
    preHandler: [async (request, reply) => {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const token = authHeader.slice(7);

      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        request.user = payload as { sub: number; username: string };
      } catch {
        return reply.status(401).send({ error: 'Invalid token' });
      }
    }]
  }, async (request, reply) => {
    return { username: request.user?.username };
  });
}
