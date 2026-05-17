import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { favorites, projects } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { requireClerkAuth } from '../middleware/clerk.js';

function generateId(): string {
  return uuidv4();
}

export async function favoriteRoutes(app: FastifyInstance) {
  // GET /api/favorites - 获取当前用户所有收藏
  app.get('/api/favorites', { preHandler: requireClerkAuth }, async (request, _reply) => {
    const userId = request.clerkUser!.userId;

    const db = getDb();
    const results = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .execute();

    return results.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      createdAt: f.createdAt,
    }));
  });

  // POST /api/favorites - 添加收藏
  app.post('/api/favorites', { preHandler: requireClerkAuth }, async (request, reply) => {
    const userId = request.clerkUser!.userId;

    const { projectId } = request.body as { projectId?: string };
    if (!projectId) {
      return reply.status(400).send({ error: 'projectId is required' });
    }

    const db = getDb();

    // 检查是否已收藏（防止重复）
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.projectId, projectId)))
      .limit(1)
      .execute();

    if (existing.length > 0) {
      return { id: existing[0].id, projectId, createdAt: existing[0].createdAt };
    }

    const id = generateId();
    const createdAt = Date.now();
    await db.insert(favorites).values({ id, projectId, userId, createdAt });

    // 同步更新项目的 likeCount
    await db.update(projects)
      .set({ likeCount: sql`${projects.likeCount} + 1` })
      .where(eq(projects.id, projectId));

    return reply.status(201).send({ id, projectId, createdAt });
  });

  // DELETE /api/favorites/:projectId - 取消收藏
  app.delete('/api/favorites/:projectId', { preHandler: requireClerkAuth }, async (request, reply) => {
    const userId = request.clerkUser!.userId;

    const { projectId } = request.params as { projectId: string };

    const db = getDb();

    // 检查是否存在再删除，避免误减
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.projectId, projectId)))
      .limit(1)
      .execute();

    if (existing.length === 0) {
      return reply.status(204).send();
    }

    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.projectId, projectId)));

    // 同步减少项目的 likeCount
    await db.update(projects)
      .set({ likeCount: sql`${projects.likeCount} - 1` })
      .where(eq(projects.id, projectId));

    return reply.status(204).send();
  });
}
