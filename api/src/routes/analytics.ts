import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { analyticsEvents, projects } from '../db/schema.js';
import { sql, eq, and, gte, lt, isNotNull, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';

const VALID_EVENT_TYPES = ['pageview', 'search', 'filter'] as const;
type EventType = (typeof VALID_EVENT_TYPES)[number];

function getClientIp(request: { ip?: string; headers: Record<string, string | string[] | undefined> }): string | null {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.ip ?? null;
}

export async function analyticsRoutes(app: FastifyInstance) {
  // POST /api/analytics — public, record an analytics event
  app.post('/api/analytics', async (request, reply) => {
    const body = request.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== 'object') {
      return reply.status(400).send({ error: 'invalid body' });
    }

    const eventType = body.eventType as string | undefined;
    if (!eventType || !VALID_EVENT_TYPES.includes(eventType as EventType)) {
      return reply.status(400).send({ error: 'invalid eventType' });
    }

    const ip = getClientIp(request);
    const userAgent = request.headers['user-agent'] as string | undefined;
    const referrer = request.headers['referer'] as string | undefined;

    try {
      await getDb()
        .insert(analyticsEvents)
        .values({
          eventType,
          projectId: body.projectId as string | undefined,
          tag: body.tag as string | undefined,
          query: body.query as string | undefined,
          referrer,
          ip,
          userAgent,
          createdAt: Math.floor(Date.now() / 1000),
        })
        .execute();

      return { ok: true };
    } catch (err) {
      app.log.error(err, '[analytics] POST /api/analytics failed');
      return reply.status(500).send({ error: 'failed to record event' });
    }
  });

  // GET /api/analytics/summary — auth-protected, aggregated analytics
  app.get('/api/analytics/summary', { preHandler: [requireAuth] }, async (_request, reply) => {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60;

    try {
      // Total PV and UV (distinct IP) for last 30 days
      const [pvRow] = await db
        .select({ pv: sql<number>`count(*) filter (where ${analyticsEvents.eventType} = 'pageview')` })
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, thirtyDaysAgo))
        .execute();

      const [uvRow] = await db
        .select({ uv: sql<number>`count(distinct ${analyticsEvents.ip})` })
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.createdAt, thirtyDaysAgo),
            isNotNull(analyticsEvents.ip)
          )
        )
        .execute();

      // Top 10 projects by pageview count
      const topProjects = await db
        .select({
          projectId: analyticsEvents.projectId,
          projectName: projects.name,
          count: sql<number>`count(*)`,
        })
        .from(analyticsEvents)
        .leftJoin(projects, eq(analyticsEvents.projectId, projects.id))
        .where(
          and(
            gte(analyticsEvents.createdAt, thirtyDaysAgo),
            eq(analyticsEvents.eventType, 'pageview'),
            isNotNull(analyticsEvents.projectId)
          )
        )
        .groupBy(analyticsEvents.projectId, projects.name)
        .orderBy(desc(sql`count(*)`))
        .limit(10)
        .execute();

      // Top 10 tags by filter event count
      const topTags = await db
        .select({
          tag: analyticsEvents.tag,
          count: sql<number>`count(*)`,
        })
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.createdAt, thirtyDaysAgo),
            eq(analyticsEvents.eventType, 'filter'),
            isNotNull(analyticsEvents.tag)
          )
        )
        .groupBy(analyticsEvents.tag)
        .orderBy(desc(sql`count(*)`))
        .limit(10)
        .execute();

      // Top 10 search queries by search event count
      const topSearches = await db
        .select({
          query: analyticsEvents.query,
          count: sql<number>`count(*)`,
        })
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.createdAt, thirtyDaysAgo),
            eq(analyticsEvents.eventType, 'search'),
            isNotNull(analyticsEvents.query)
          )
        )
        .groupBy(analyticsEvents.query)
        .orderBy(desc(sql`count(*)`))
        .limit(10)
        .execute();

      // Daily PV for last 14 days
      const dailyPvRows = await db
        .select({
          date: sql<string>`to_char(to_timestamp(${analyticsEvents.createdAt}), 'YYYY-MM-DD')`,
          count: sql<number>`count(*)`,
        })
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.createdAt, fourteenDaysAgo),
            eq(analyticsEvents.eventType, 'pageview')
          )
        )
        .groupBy(sql`to_char(to_timestamp(${analyticsEvents.createdAt}), 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(to_timestamp(${analyticsEvents.createdAt}), 'YYYY-MM-DD')`)
        .execute();

      return {
        pv: Number(pvRow?.pv ?? 0),
        uv: Number(uvRow?.uv ?? 0),
        topProjects: topProjects.map((r) => ({
          projectId: r.projectId,
          projectName: r.projectName,
          count: Number(r.count),
        })),
        topTags: topTags.map((r) => ({
          tag: r.tag as string,
          count: Number(r.count),
        })),
        topSearches: topSearches.map((r) => ({
          query: r.query as string,
          count: Number(r.count),
        })),
        dailyPV: dailyPvRows.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
      };
    } catch (err) {
      app.log.error(err, '[analytics] GET /api/analytics/summary failed');
      return reply.status(500).send({ error: 'failed to load analytics summary' });
    }
  });
}
