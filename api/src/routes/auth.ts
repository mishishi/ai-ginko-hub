import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { admin } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { verifyPassword } from '../utils/password.js';
import { requireAuth } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    const db = getDb();
    const results = await db.select().from(admin).where(eq(admin.username, username)).limit(1).execute();

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
      .sign(new TextEncoder().encode(JWT_SECRET));

    const isProd = process.env.NODE_ENV === 'production';
    reply.setCookie('admin_token', token, {
      httpOnly: true,
      sameSite: isProd ? 'strict' : 'lax',
      secure: isProd,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { username: user.username };
  });

  app.get('/api/auth/me', { preHandler: [requireAuth] }, async (request) => {
    return { username: request.user?.username };
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie('admin_token', { path: '/' });
    return { ok: true };
  });
}
