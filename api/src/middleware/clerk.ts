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

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY environment variable is required');
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
      audience: process.env.CLERK_AUDIENCE,
    });

    if (result.errors) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    // Clerk v5+: result IS the decoded JWT payload (no .data wrapper)
    // Clerk v4: result has a 'data' field containing the payload
    // Normalize to the shape that has a 'sub' field
    const normalized = (result as { data?: TokenPayload }).data ?? (result as unknown as TokenPayload);
    if (!normalized?.sub) {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    request.clerkUser = { userId: normalized.sub };
  } catch (err) {
    // 记录类型和错误码，便于生产调试，但不打印敏感信息
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: unknown }).code;
    const name = (err as { name?: unknown }).name;
    console.error('[Clerk] verifyToken threw:', msg, { code, name });
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
