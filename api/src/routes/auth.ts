import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { admin } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { verifyPassword } from '../utils/password.js';
import { requireAuth } from '../middleware/auth.js';

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

    const token = await new SignJWT({ sub: String(user.id), username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return { token, username: user.username };
  });

  app.get('/api/auth/me', { preHandler: [requireAuth] }, async (request) => {
    return { username: request.user?.username };
  });
}
