import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '@clerk/fastify';

interface TokenPayload {
  sub: string;
  [key: string]: unknown;
}

export interface ClerkUser {
  userId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    clerkUser?: ClerkUser;
  }
}

export async function requireClerkAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Get token from Authorization header or __session cookie
  const authHeader = request.headers.authorization;
  const sessionToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.cookies.__session;

  if (!sessionToken) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const result = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY,
      audience: process.env.CLERK_AUDIENCE,
    });

    if (result.errors || !result.data) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    const payload = result.data as TokenPayload;
    if (!payload.sub) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    request.clerkUser = { userId: payload.sub };
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
