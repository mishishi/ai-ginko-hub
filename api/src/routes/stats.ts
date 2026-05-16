import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { projects } from '../db/schema.js';

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson);
  } catch {
    return [];
  }
}

export async function statsRoutes(app: FastifyInstance) {
  app.get('/api/stats', async () => {
    const db = await getDb();
    const all = db.select().from(projects).all();
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
    const db = await getDb();
    const all = db.select().from(projects).all();
    const allTags = new Set<string>();
    all.forEach((p: typeof projects.$inferSelect) => {
      parseTags(p.tags).forEach((t: string) => allTags.add(t));
    });
    return { tags: Array.from(allTags).sort() };
  });
}
