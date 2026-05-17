import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { projects } from '../db/schema.js';

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson);
  } catch {
    console.warn(`[stats] failed to parse tags JSON: "${tagsJson}"`);
    return [];
  }
}

// TODO(P1): Replace full-table scans with SQL aggregation (COUNT, SUM, GROUP BY)
// to avoid loading all rows into memory when the project table grows large.
export async function statsRoutes(app: FastifyInstance) {
  app.get('/api/stats', async () => {
    const db = getDb();
    const all = await db.select().from(projects).execute();
    const total = all.length;
    const featured = all.filter((p) => p.featured).length;
    const allTags = new Set<string>();
    all.forEach((p: typeof projects.$inferSelect) => {
      parseTags(p.tags).forEach((t: string) => allTags.add(t));
    });
    const totalViews = all.reduce(
      (sum: number, p: typeof projects.$inferSelect) => sum + (p.viewCount || 0),
      0
    );

    return { total, featured, techCount: allTags.size, totalViews };
  });

  app.get('/api/tags', async () => {
    const db = getDb();
    const all = await db.select().from(projects).execute();
    const allTags = new Set<string>();
    all.forEach((p: typeof projects.$inferSelect) => {
      parseTags(p.tags).forEach((t: string) => allTags.add(t));
    });
    return { tags: Array.from(allTags).sort() };
  });
}
