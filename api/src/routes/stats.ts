import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { projects } from '../db/schema.js';
import { count, eq, sql } from 'drizzle-orm';

// In-memory cache for tags (30-second TTL)
let _tagsCache: { tags: string[]; expiresAt: number } | null = null;
const TAGS_CACHE_TTL_MS = 30 * 1000;

export async function statsRoutes(app: FastifyInstance) {
  app.get('/api/stats', async (_request, reply) => {
    const db = getDb();

    try {
      // Use Drizzle query builder for cross-database compatibility
      const [row] = await db
        .select({
          total: count(),
          featured: sql<number>`sum(case when ${projects.featured} = 1 or ${projects.featured} = true then 1 else 0 end)`.as('featured_count'),
          totalViews: sql<number>`coalesce(sum(${projects.viewCount}), 0)`,
        })
        .from(projects)
        .execute();

      // techCount: need to extract distinct tags from JSON arrays
      // Use cross-database approach: fetch all tags and deduplicate in JS
      const allProjects = await db.select({ tags: projects.tags }).from(projects).execute();
      const tagSet = new Set<string>();
      for (const p of allProjects) {
        try {
          const tags = JSON.parse(p.tags || '[]');
          for (const t of tags) {
            if (typeof t === 'string') tagSet.add(t);
          }
        } catch {
          // skip invalid JSON
        }
      }

      return {
        total: Number(row?.total ?? 0),
        featured: Number(row?.featured ?? 0),
        totalViews: Number(row?.totalViews ?? 0),
        techCount: tagSet.size,
      };
    } catch (err) {
      app.log.error(err, '[stats] /api/stats failed');
      return reply.status(500).send({ error: 'failed to load stats' });
    }
  });

  app.get('/api/tags', async (_request, reply) => {
    const db = getDb();
    const now = Date.now();

    // Serve from cache if fresh
    if (_tagsCache && _tagsCache.expiresAt > now) {
      return { tags: _tagsCache.tags };
    }

    try {
      // Extract and deduplicate all tags from project JSON arrays
      const allProjects = await db.select({ tags: projects.tags }).from(projects).execute();
      const tagSet = new Set<string>();
      for (const p of allProjects) {
        try {
          const tags = JSON.parse(p.tags || '[]');
          for (const t of tags) {
            if (typeof t === 'string') tagSet.add(t);
          }
        } catch {
          // skip invalid JSON
        }
      }

      const tags = [...tagSet].sort();

      _tagsCache = { tags, expiresAt: now + TAGS_CACHE_TTL_MS };
      return { tags };
    } catch (err) {
      app.log.error(err, '[stats] /api/tags failed');
      return reply.status(500).send({ error: 'failed to load tags' });
    }
  });
}
