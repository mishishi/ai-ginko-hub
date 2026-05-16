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
      issuer: process.env.CLERK_ISSUER,
      audience: process.env.CLERK_AUDIENCE,
    });

    if (result.errors) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    // Clerk v5+: result IS the decoded JWT payload (no .data wrapper)
    const payload = (result as unknown as TokenPayload) ?? (result as { data?: TokenPayload }).data;
    if (!payload?.sub) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    request.clerkUser = { userId: payload.sub };
  } catch (err) {
    console.error('[Clerk] verifyToken threw:', err);
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
