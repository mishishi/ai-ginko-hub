import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../db/index.js';
import { projects } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';

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
  // GET /api/projects - List all projects with optional filtering
  app.get('/api/projects', async (request) => {
    const db = await getDb();
    const { tag, q } = request.query as { tag?: string; q?: string };

    let results = await db.select().from(projects);

    // Filter by tag
    if (tag) {
      results = results.filter((p) => {
        const tags = parseTags(p.tags);
        return tags.includes(tag);
      });
    }

    // Filter by search query (name or description)
    if (q) {
      const query = q.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Parse tags back to array for each project
    const parsed = results.map((p) => ({
      ...p,
      tags: parseTags(p.tags),
    }));

    return parsed;
  });

  // GET /api/projects/:id - Get single project by id
  app.get('/api/projects/:id', async (request, reply) => {
    const db = await getDb();
    const { id } = request.params as { id: string };

    const results = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (results.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const project = results[0];

    // Increment viewCount
    db.update(projects)
      .set({ viewCount: (project.viewCount || 0) + 1 })
      .where(eq(projects.id, id))
      .run();
    await saveDb();

    return {
      ...project,
      tags: parseTags(project.tags),
    };
  });

  // POST /api/projects - Create new project (auth required)
  app.post('/api/projects', { preHandler: [requireAuth] }, async (request, reply) => {
    const db = await getDb();
    const body = request.body as {
      id?: string;
      name: string;
      description: string;
      tags: string[];
      url: string;
      thumbnail?: string;
      createdAt?: string;
      featured?: boolean;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
    };

    if (!body.name || !body.description || !body.tags || !body.url) {
      return reply.status(400).send({ error: 'name, description, tags, and url are required' });
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
    await saveDb();

    return reply.status(201).send({
      ...newProject,
      tags: body.tags,
    });
  });

  // PUT /api/projects/:id - Update project (auth required)
  app.put('/api/projects/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const db = await getDb();
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      description?: string;
      tags?: string[];
      url?: string;
      thumbnail?: string;
      featured?: boolean;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
    };

    const existing = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

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
      featured: body.featured !== undefined ? body.featured : current.featured,
      ogTitle: body.ogTitle !== undefined ? body.ogTitle : current.ogTitle,
      ogDescription: body.ogDescription !== undefined ? body.ogDescription : current.ogDescription,
      ogImage: body.ogImage !== undefined ? body.ogImage : current.ogImage,
      updatedAt: Date.now(),
    };

    await db.update(projects).set(updatedProject).where(eq(projects.id, id)).run();
    await saveDb();

    return {
      ...updatedProject,
      id: current.id,
      createdAt: current.createdAt,
      viewCount: current.viewCount,
      createdAtTs: current.createdAtTs,
      tags: parseTags(updatedProject.tags),
    };
  });

  // DELETE /api/projects/:id - Delete project (auth required)
  app.delete('/api/projects/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const db = await getDb();
    const { id } = request.params as { id: string };

    const existing = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (existing.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    await db.delete(projects).where(eq(projects.id, id)).run();
    await saveDb();

    return reply.status(204).send();
  });
}
