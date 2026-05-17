import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { projects } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { createProjectSchema, updateProjectSchema } from './projects.schema.js';

function generateId(): string {
  return uuidv4();
}

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson);
  } catch {
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

    let results = await db.select().from(projects).execute();

    // Filter by tag
    if (tag) {
      results = results.filter((p) => {
        const tags = parseTags(p.tags);
        return tags.includes(tag);
      });
    }

    // Filter by search query (name, description, or tags)
    if (q) {
      const query = q.toLowerCase();
      results = results.filter((p) => {
        const tags = parseTags(p.tags);
        return (
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          tags.some((t) => t.toLowerCase().includes(query))
        );
      });
    }

    // Filter by featured
    if (featured === 'true') {
      results = results.filter((p) => p.featured === true);
    }

    // Sort results
    switch (sort) {
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date':
        results.sort((a, b) => (b.createdAtTs ?? 0) - (a.createdAtTs ?? 0));
        break;
      case 'views':
        results.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
        break;
      case 'featured':
        results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      default:
        // default: sort by featured first, then by createdAtTs desc
        results.sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return (b.createdAtTs ?? 0) - (a.createdAtTs ?? 0);
        });
    }

    const total = results.length;

    // Apply pagination
    const parsedLimit = parseInt(limit ?? '', 10);
    const limitNum = Number.isNaN(parsedLimit) ? 12 : Math.min(parsedLimit, 100);

    const parsedOffset = parseInt(offset ?? '', 10);
    const offsetNum = Number.isNaN(parsedOffset) ? 0 : Math.max(0, parsedOffset);
    const paginatedResults = results.slice(offsetNum, offsetNum + limitNum);

    // Parse tags back to array for each project
    const parsed = paginatedResults.map((p) => ({
      ...p,
      tags: parseTags(p.tags),
    }));

    return reply.header('X-Total-Count', total).header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').send(parsed);
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

  // POST /api/projects - Create new project (auth required)
  app.post('/api/projects', { preHandler: [requireAuth] }, async (request, reply) => {
    const db = getDb();
    const parsed = createProjectSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.message });
    }

    const body = parsed.data;
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
      createdAt: current.createdAt,
      viewCount: current.viewCount,
      createdAtTs: current.createdAtTs,
      tags: parseTags(updatedProject.tags),
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

    await db.delete(projects).where(eq(projects.id, id));

    return reply.status(204).send();
  });
}
