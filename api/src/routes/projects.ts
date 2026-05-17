import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { projects, favorites } from '../db/schema.js';
import { eq, sql, asc, desc, like, or, and, inArray } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { createProjectSchema, updateProjectSchema } from './projects.schema.js';

function generateId(): string {
  return uuidv4();
}

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson);
  } catch {
    console.warn(`[projects] failed to parse tags JSON: "${tagsJson}"`);
    return [];
  }
}

function serializeTags(tags: string[]): string {
  return JSON.stringify(tags);
}

export async function projectRoutes(app: FastifyInstance) {
  // GET /api/projects - List all projects with optional filtering, sorting and pagination
  app.get('/api/projects', async (request, reply) => {
    const db = getDb();
    const { tag, q, limit, offset, sort, featured } = request.query as {
      tag?: string;
      q?: string;
      limit?: string;
      offset?: string;
      sort?: string;
      featured?: string;
    };

    // Build WHERE conditions
    const conditions = [];

    if (tag) {
      // PostgreSQL JSON array containment — checks if tags::jsonb contains the given element
      conditions.push(sql`${projects.tags}::jsonb @> ${JSON.stringify(tag)}::jsonb`);
    }

    if (q) {
      const query = `%${q}%`;
      conditions.push(
        or(
          like(projects.name, query),
          like(projects.description, query),
          // ILIKE on JSON array string for tag search
          like(sql`${projects.tags}::text`, query)
        )
      );
    }

    if (featured === 'true') {
      conditions.push(eq(projects.featured, true));
    }

    // Default sort: featured first, then createdAtTs desc
    let orderBy;
    switch (sort) {
      case 'name':
        orderBy = asc(projects.name);
        break;
      case 'date':
        orderBy = desc(sql`${projects.createdAtTs}`);
        break;
      case 'views':
        orderBy = desc(sql`${projects.viewCount}`);
        break;
      case 'featured':
        orderBy = desc(projects.featured);
        break;
      default:
        orderBy = [desc(projects.featured), desc(sql`${projects.createdAtTs}`)];
    }

    // Pagination
    const parsedLimit = parseInt(limit ?? '', 10);
    const limitNum = Number.isNaN(parsedLimit) ? 12 : Math.min(parsedLimit, 100);
    const parsedOffset = parseInt(offset ?? '', 10);
    const offsetNum = Number.isNaN(parsedOffset) ? 0 : Math.max(0, parsedOffset);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total matching rows (without limit/offset)
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(whereClause)
      .execute();
    const total = Number(countResult[0]?.count ?? 0);

    // Fetch paginated results
    const results = await db
      .select()
      .from(projects)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offsetNum)
      .execute();

    const parsed = results.map((p) => ({
      ...p,
      tags: parseTags(p.tags),
    }));

    return reply
      .header('X-Total-Count', total)
      .header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      .send(parsed);
  });

  // GET /api/projects/:id - Get single project by id
  app.get('/api/projects/:id', async (request, reply) => {
    const db = getDb();
    const { id } = request.params as { id: string };

    const results = await db.select().from(projects).where(eq(projects.id, id)).limit(1).execute();

    if (results.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const project = results[0];

    // Increment viewCount atomically to avoid race condition
    await db.update(projects)
      .set({ viewCount: sql`${projects.viewCount} + 1` })
      .where(eq(projects.id, id));

    return reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').send({
      ...project,
      tags: parseTags(project.tags),
    });
  });

  // GET /api/projects/batch?ids=id1,id2,... - Batch fetch projects by IDs
  app.get('/api/projects/batch', async (request, reply) => {
    const db = getDb();
    const { ids } = request.query as { ids?: string };

    if (!ids) {
      return reply.status(400).send({ error: 'ids query parameter required' });
    }

    const idList = ids.split(',').filter(Boolean);
    if (idList.length === 0) {
      return { projects: [] };
    }

    if (idList.length > 100) {
      return reply.status(400).send({ error: 'max 100 IDs per request' });
    }

    const rows = await db
      .select()
      .from(projects)
      .where(inArray(projects.id, idList))
      .execute();

    const parsed = rows.map((p) => ({
      ...p,
      tags: parseTags(p.tags),
    }));

    return { projects: parsed };
  });

  // POST /api/projects - Create new project (auth required)
  app.post('/api/projects', { preHandler: [requireAuth] }, async (request, reply) => {
    const db = getDb();
    const parsed = createProjectSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message });
    }

    const body = parsed.data;

    // Check for duplicate name
    const existing = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.name, body.name))
      .limit(1)
      .execute();
    if (existing.length > 0) {
      return reply.status(409).send({ error: 'a project with this name already exists' });
    }

    const now = Date.now();
    const id = body.id || generateId();

    const newProject = {
      id,
      name: body.name,
      description: body.description,
      tags: serializeTags(body.tags),
      url: body.url,
      thumbnail: body.thumbnail || null,
      repoUrl: body.repoUrl || null,
      createdAt: body.createdAt || new Date().toISOString(),
      featured: body.featured || false,
      ogTitle: body.ogTitle || null,
      ogDescription: body.ogDescription || null,
      ogImage: body.ogImage || null,
      viewCount: 0,
      createdAtTs: now,
      updatedAt: now,
    };

    await db.insert(projects).values(newProject);

    return reply.status(201).send({
      ...newProject,
      tags: body.tags,
    });
  });

  // PUT /api/projects/:id - Update project (auth required)
  app.put('/api/projects/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params as { id: string };

    const parsed = updateProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message });
    }

    const body = parsed.data;

    const existing = await db.select().from(projects).where(eq(projects.id, id)).limit(1).execute();

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const current = existing[0];

    const updatedProject = {
      name: body.name ?? current.name,
      description: body.description ?? current.description,
      tags: body.tags !== undefined ? serializeTags(body.tags) : current.tags,
      url: body.url ?? current.url,
      thumbnail: body.thumbnail !== undefined ? body.thumbnail : current.thumbnail,
      repoUrl: body.repoUrl !== undefined ? body.repoUrl : current.repoUrl,
      featured: body.featured !== undefined ? body.featured : current.featured,
      ogTitle: body.ogTitle !== undefined ? body.ogTitle : current.ogTitle,
      ogDescription: body.ogDescription !== undefined ? body.ogDescription : current.ogDescription,
      ogImage: body.ogImage !== undefined ? body.ogImage : current.ogImage,
      updatedAt: Date.now(),
    };

    await db.update(projects).set(updatedProject).where(eq(projects.id, id));

    return {
      id: current.id,
      name: updatedProject.name,
      description: updatedProject.description,
      tags: parseTags(updatedProject.tags),
      url: updatedProject.url,
      thumbnail: updatedProject.thumbnail,
      repoUrl: updatedProject.repoUrl,
      createdAt: current.createdAt,
      featured: updatedProject.featured,
      ogTitle: updatedProject.ogTitle,
      ogDescription: updatedProject.ogDescription,
      ogImage: updatedProject.ogImage,
      viewCount: current.viewCount,
      createdAtTs: current.createdAtTs,
      updatedAt: updatedProject.updatedAt,
    };
  });

  // DELETE /api/projects/:id - Delete project (auth required)
  app.delete('/api/projects/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params as { id: string };

    const existing = await db.select().from(projects).where(eq(projects.id, id)).limit(1).execute();

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    // Clean up associated favorites to avoid orphaned rows
    await db.delete(favorites).where(eq(favorites.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));

    return reply.status(204).send();
  });
}
