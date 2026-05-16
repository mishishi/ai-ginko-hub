import type { FastifyRequest, FastifyReply } from 'fastify';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface AuthUser {
  sub: number;
  username: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  const cookieToken = request.cookies.admin_token;

  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  if (!token) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    request.user = {
      sub: Number(payload.sub),
      username: (payload as { username?: string }).username ?? '',
    };
  } catch {
    reply.status(401).send({ error: 'Invalid token' });
  }
}
