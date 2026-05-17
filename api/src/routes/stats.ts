import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { projects } from '../db/schema.js';
import { sql } from 'drizzle-orm';

// In-memory cache for tags (30-second TTL)
let _tagsCache: { tags: string[]; expiresAt: number } | null = null;
const TAGS_CACHE_TTL_MS = 30 * 1000;

export async function statsRoutes(app: FastifyInstance) {
  app.get('/api/stats', async (_request, reply) => {
    const db = getDb();

    try {
      // SQL aggregation — single round-trip for count metrics
      const [row] = await db
        .select({
          total: sql<number>`count(*)`,
          featured: sql<number>`count(*) filter (where ${projects.featured} = true)`,
          totalViews: sql<number>`coalesce(sum(${projects.viewCount}), 0)`,
        })
        .from(projects)
        .execute();

      // Unique tech count via PostgreSQL JSON array unnesting — avoids loading all rows
      const [tagRow] = await db
        .select({ techCount: sql<number>`count(distinct elem)` })
        .from(
          sql`${projects}, jsonb_array_elements_text(${projects.tags}::jsonb) as elem`
        )
        .execute();

      return {
        total: Number(row?.total ?? 0),
        featured: Number(row?.featured ?? 0),
        totalViews: Number(row?.totalViews ?? 0),
        techCount: Number(tagRow?.techCount ?? 0),
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
      // Extract and deduplicate all tags via PostgreSQL JSON unnesting
      const rows = await db
        .select({ tag: sql<string>`elem` })
        .from(sql`${projects}, jsonb_array_elements_text(${projects.tags}::jsonb) as elem`)
        .execute();

      const tags = [...new Set(rows.map((r) => r.tag))].sort();

      _tagsCache = { tags, expiresAt: now + TAGS_CACHE_TTL_MS };
      return { tags };
    } catch (err) {
      app.log.error(err, '[stats] /api/tags failed');
      return reply.status(500).send({ error: 'failed to load tags' });
    }
  });
}
