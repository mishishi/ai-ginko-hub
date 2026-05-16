# Ginko Hub Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build Fastify + Drizzle backend with SQLite, JWT auth, Admin CMS, and Cloudflare R2 file uploads.

**Architecture:** Monorepo with Fastify API and React SPA running concurrently. Drizzle ORM manages SQLite. Admin at /admin route with its own layout. JWT auth protects all write endpoints. File uploads use R2 presigned URL flow.

**Tech Stack:** Fastify 5, Drizzle ORM, better-sqlite3, jose (JWT), @aws-sdk/client-s3 (R2), React Router 7

---


## File Structure

```
ai-ginko-hub/
├── api/                          # Fastify backend (new)
│   ├── src/
│   │   ├── index.ts              # API entry, register plugins
│   │   ├── app.ts                # Fastify instance factory
│   │   ├── db/
│   │   │   ├── index.ts         # Drizzle client + SQLite connection
│   │   │   └── schema.ts        # Drizzle schema (projects, admin)
│   │   ├── routes/
│   │   │   ├── projects.ts      # GET/POST/PUT/DELETE /api/projects
│   │   │   ├── auth.ts          # POST /api/auth/login, GET /api/auth/me
│   │   │   ├── upload.ts        # POST /api/upload (presigned URL)
│   │   │   └── stats.ts         # GET /api/stats
│   │   └── middleware/
│   │       └── auth.ts           # JWT verification middleware
│   ├── drizzle.config.ts         # Drizzle config
│   └── package.json
├── src/
│   ├── admin/                    # Admin React app (new)
│   │   ├── index.tsx            # Admin entry (separate mount)
│   │   ├── AdminApp.tsx         # Admin layout + routes
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProjectListPage.tsx
│   │   │   └── ProjectFormPage.tsx
│   │   ├── components/
│   │   │   ├── AdminLayout.tsx
│   │   │   └── ProjectForm.tsx
│   │   └── hooks/
│   │       └── useAdminAuth.ts
│   ├── App.tsx                   # Modified: add /admin route
│   └── main.tsx                 # Modified: mount AdminApp at #admin-root
└── .env.example
```



---

## Backend Env Vars

```env
# .env (api/)
JWT_SECRET=your-jwt-secret-min-32-chars
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_BUCKET=your-r2-bucket-name
PORT=3000
```



---

## Task Map

| # | Task | Key Files |
|---|------|-----------|
| 1 | Fastify + deps setup | api/package.json, api/src/index.ts, api/src/app.ts |
| 2 | Drizzle + SQLite schema | api/src/db/schema.ts, api/src/db/index.ts, drizzle.config.ts |
| 3 | Drizzle migration + seed | api/drizzle/ (generated), api/src/db/seed.ts |
| 4 | Auth routes (login/me) | api/src/routes/auth.ts, api/src/middleware/auth.ts |
| 5 | Projects CRUD routes | api/src/routes/projects.ts |
| 6 | Upload route (R2 presigned) | api/src/routes/upload.ts |
| 7 | Stats route | api/src/routes/stats.ts |
| 8 | Admin React scaffold | src/admin/index.tsx, AdminApp.tsx, useAdminAuth.ts |
| 9 | AdminLayout + routing | src/admin/components/AdminLayout.tsx, src/admin/AdminApp.tsx |
| 10 | LoginPage | src/admin/pages/LoginPage.tsx |
| 11 | DashboardPage | src/admin/pages/DashboardPage.tsx |
| 12 | ProjectListPage | src/admin/pages/ProjectListPage.tsx |
| 13 | ProjectFormPage (create/edit) | src/admin/pages/ProjectFormPage.tsx, src/admin/components/ProjectForm.tsx |
| 14 | Wire App.tsx + main.tsx | src/App.tsx, src/main.tsx, index.html |
| 15 | ProjectDetail API integration | src/pages/ProjectDetail.tsx, src/data/projects.ts |
| 16 | HomePage API integration | src/pages/HomePage.tsx, src/data/projects.ts |
| 17 | Build + lint verification | (run npm scripts) |



---

### Task 1: Fastify + Dependencies Setup

**Files:**
- Create: `api/package.json`
- Create: `api/src/index.ts`
- Create: `api/src/app.ts`
- Create: `api/.env.example`

- [ ] **Step 1: Create api/package.json**

```json
{
  "name": "@ginko/api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "fastify": "^5.2.0",
    "@fastify/cors": "^10.0.0",
    "drizzle-orm": "^0.38.0",
    "better-sqlite3": "^11.0.0",
    "jose": "^5.9.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "~6.0.2",
    "@types/better-sqlite3": "^7.0.0",
    "drizzle-kit": "^0.30.0"
  }
}
```

- [ ] **Step 2: Create api/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create api/src/app.ts**

```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';

export function buildApp() {
  const app = Fastify({ logger: true });

  // CORS: allow frontend dev server
  app.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  });

  return app;
}
```

- [ ] **Step 4: Create api/src/index.ts**

```ts
import { buildApp } from './app.js';
import { load } from 'dotenv/config';

const app = buildApp();
const port = parseInt(process.env.PORT || '3000', 10);

app.listen({ port, host: '0.0.0.0' }, (err, addr) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`API running at ${addr}`);
});
```

- [ ] **Step 5: Create api/.env.example**

```env
JWT_SECRET=replace-with-a-random-32-char-secret
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-r2-secret-access-key
CLOUDFLARE_BUCKET=your-r2-bucket-name
PORT=3000
```

- [ ] **Step 6: Commit**

```bash
cd api && npm install && cd ..
git add api/package.json api/tsconfig.json api/src/index.ts api/src/app.ts api/.env.example
git commit -m "feat(api): scaffold Fastify backend with CORS"
```



---

### Task 2: Drizzle ORM + SQLite Schema

**Files:**
- Create: `api/src/db/schema.ts`
- Create: `api/src/db/index.ts`
- Create: `api/drizzle.config.ts`

- [ ] **Step 1: Create api/src/db/schema.ts**

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  tags: text('tags').notNull(), // JSON array string
  url: text('url').notNull(),
  thumbnail: text('thumbnail'), // R2 URL
  createdAt: text('created_at').notNull(), // ISO date string
  featured: integer('featured', { mode: 'boolean' }).default(false),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImage: text('og_image'),
  viewCount: integer('view_count').default(0),
  createdAtTs: integer('created_at_ts'), // Unix timestamp for sorting
  updatedAt: integer('updated_at'),
});

export const admin = sqliteTable('admin', {
  id: integer('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
```

- [ ] **Step 2: Create api/src/db/index.ts**

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database(process.env.DATABASE_URL || 'data.db');
export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 3: Create api/drizzle.config.ts**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'data.db',
  },
});
```

- [ ] **Step 4: Create initial migration (run from api/ directory)**

Run: `cd api && npx drizzle-kit generate`
Expected: Creates `drizzle/0000_init.sql` with CREATE TABLE statements

- [ ] **Step 5: Run migration**

Run: `cd api && npx drizzle-kit migrate`
Expected: Creates `data.db` SQLite file

- [ ] **Step 6: Commit**

```bash
git add api/src/db/schema.ts api/src/db/index.ts api/drizzle.config.ts api/drizzle/
git commit -m "feat(api): add Drizzle ORM schema with projects and admin tables"
```



---

### Task 3: Seed Admin Account

**Files:**
- Create: `api/src/db/seed.ts`
- Modify: `api/.env` (create from .env.example)

- [ ] **Step 1: Create api/.env from .env.example**

```bash
cp api/.env.example api/.env
# Edit api/.env: set JWT_SECRET to a random 32-char string
# For local dev: DATABASE_URL=./data.db (default)
```

- [ ] **Step 2: Create api/src/db/seed.ts**

```ts
import { db } from './index.js';
import { admin } from './schema.js';
import { hashPassword } from '../utils/password.js'; // will create in Task 4

async function seed() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123'; // CHANGE THIS
  const passwordHash = await hashPassword(password);

  db.insert(admin).values({
    id: 1,
    username,
    passwordHash,
  }).onConflictDoNothing().run();

  console.log('Admin seeded:', username);
}

seed().catch(console.error);
```

- [ ] **Step 3: Create api/src/utils/password.ts**

```ts
import { hashSync, compareSync } from 'bcrypt';

export function hashPassword(password: string): string {
  return hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}
```

Note: Add `bcrypt` to api/package.json dependencies.

- [ ] **Step 4: Add bcrypt to api/package.json**

Add to dependencies: `"bcrypt": "^5.0.0"`

Run: `cd api && npm install`

- [ ] **Step 5: Run seed**

Run: `cd api && npx tsx src/db/seed.ts`
Expected: Logs "Admin seeded: admin"

- [ ] **Step 6: Commit**

```bash
git add api/src/db/seed.ts api/src/utils/password.ts api/.env.example
git commit -m "feat(api): add admin seed script"
```



---

### Task 4: Auth Routes + JWT Middleware

**Files:**
- Create: `api/src/routes/auth.ts`
- Create: `api/src/middleware/auth.ts`
- Create: `api/src/utils/password.ts` (if not created in Task 3)
- Modify: `api/src/app.ts` (register routes)

- [ ] **Step 1: Create api/src/middleware/auth.ts**

```ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-me'
);

export interface AuthUser {
  sub: string; // admin id
  username: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    request.user = payload as AuthUser;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
```

- [ ] **Step 2: Create api/src/routes/auth.ts**

```ts
import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { admin } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { sign } from 'jose';
import { verifyPassword } from '../utils/password.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-me'
);

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return reply.status(400).send({ error: 'username and password required' });
    }

    const row = db
      .select()
      .from(admin)
      .where(eq(admin.username, username))
      .get();

    if (!row || !verifyPassword(password, row.passwordHash)) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = await sign(
      { sub: String(row.id), username: row.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return reply.send({ token, username: row.username });
  });

  // GET /api/auth/me (protected)
  app.get('/api/auth/me', { preHandler: [requireAuth] }, async (request) => {
    return { username: request.user?.username };
  });
}
```

- [ ] **Step 3: Update api/src/app.ts to register auth routes**

```ts
import { buildApp } from './app.js';
import { authRoutes } from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  });

  app.register(authRoutes);

  return app;
}
```

- [ ] **Step 4: Verify auth works**

Run: `cd api && npm run dev`
In another terminal:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
Expected: Returns `{ token: "...", username: "admin" }`

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```
Expected: Returns `{ username: "admin" }`

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/auth.ts api/src/middleware/auth.ts
git commit -m "feat(api): add JWT auth routes and middleware"
```


---

### Task 5: Projects CRUD Routes

**Files:**
- Create: `api/src/routes/projects.ts`
- Modify: `api/src/app.ts` (register routes)

- [ ] **Step 1: Create api/src/routes/projects.ts**

```ts
import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { projects } from '../db/schema.js';
import { eq, like, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';

export async function projectsRoutes(app: FastifyInstance) {
  // GET /api/projects — public list with optional ?tag= and ?q= filter
  app.get('/api/projects', async (request) => {
    const { tag, q } = request.query as { tag?: string; q?: string };
    let rows = db.select().from(projects).all();

    if (tag) {
      rows = rows.filter((p) =>
        JSON.parse(p.tags).includes(tag)
      );
    }
    if (q) {
      const lower = q.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower)
      );
    }

    return rows.map((p) => ({
      ...p,
      tags: JSON.parse(p.tags),
    }));
  });

  // GET /api/projects/:id — public, increments view count
  app.get('/api/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = db.select().from(projects).where(eq(projects.id, id)).get();
    if (!row) {
      return reply.status(404).send({ error: 'Not found' });
    }

    // Increment view count
    db.update(projects)
      .set({ viewCount: (row.viewCount || 0) + 1 })
      .where(eq(projects.id, id))
      .run();

    return { ...row, tags: JSON.parse(row.tags) };
  });

  // POST /api/projects — create (auth required)
  app.post('/api/projects', { preHandler: [requireAuth] }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const id = (body.id as string) || crypto.randomUUID();
    const now = Date.now();

    db.insert(projects)
      .values({
        id,
        name: body.name as string,
        description: body.description as string,
        tags: JSON.stringify(body.tags || []),
        url: body.url as string,
        thumbnail: (body.thumbnail as string) || null,
        createdAt: (body.createdAt as string) || new Date().toISOString().slice(0, 7),
        featured: Boolean(body.featured),
        ogTitle: (body.ogTitle as string) || null,
        ogDescription: (body.ogDescription as string) || null,
        ogImage: (body.ogImage as string) || null,
        viewCount: 0,
        createdAtTs: now,
        updatedAt: now,
      })
      .run();

    const row = db.select().from(projects).where(eq(projects.id, id)).get();
    return reply.status(201).send({ ...row, tags: JSON.parse(row!.tags) });
  });

  // PUT /api/projects/:id — update (auth required)
  app.put('/api/projects/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;

    const existing = db.select().from(projects).where(eq(projects.id, id)).get();
    if (!existing) {
      return reply.status(404).send({ error: 'Not found' });
    }

    db.update(projects)
      .set({
        name: (body.name as string) ?? existing.name,
        description: (body.description as string) ?? existing.description,
        tags: body.tags ? JSON.stringify(body.tags) : existing.tags,
        url: (body.url as string) ?? existing.url,
        thumbnail: (body.thumbnail as string | null) ?? existing.thumbnail,
        featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
        ogTitle: (body.ogTitle as string | null) ?? existing.ogTitle,
        ogDescription: (body.ogDescription as string | null) ?? existing.ogDescription,
        ogImage: (body.ogImage as string | null) ?? existing.ogImage,
        updatedAt: Date.now(),
      })
      .where(eq(projects.id, id))
      .run();

    const row = db.select().from(projects).where(eq(projects.id, id)).get();
    return reply.send({ ...row, tags: JSON.parse(row!.tags) });
  });

  // DELETE /api/projects/:id — delete (auth required)
  app.delete('/api/projects/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = db.select().from(projects).where(eq(projects.id, id)).get();
    if (!existing) {
      return reply.status(404).send({ error: 'Not found' });
    }
    db.delete(projects).where(eq(projects.id, id)).run();
    return reply.status(204).send();
  });
}
```

- [ ] **Step 2: Register routes in api/src/app.ts**

```ts
import { projectsRoutes } from './routes/projects.js';

export function buildApp() {
  const app = Fastify({ logger: true });
  app.register(cors, { origin: ['http://localhost:5173'], credentials: true });
  app.register(authRoutes);
  app.register(projectsRoutes); // add this
  return app;
}
```

- [ ] **Step 3: Test CRUD**

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test","description":"Test project","tags":["React"],"url":"https://test.com"}'

# List projects
curl http://localhost:3000/api/projects

# Get single
curl http://localhost:3000/api/projects/test-id

# Update
curl -X PUT http://localhost:3000/api/projects/test-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Updated"}'

# Delete
curl -X DELETE http://localhost:3000/api/projects/test-id \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/projects.ts
git commit -m "feat(api): add projects CRUD routes"
```


---

### Task 6: File Upload Route (R2 Presigned URL)

**Files:**
- Create: `api/src/routes/upload.ts`
- Modify: `api/src/app.ts` (register upload route)

- [ ] **Step 1: Create api/src/routes/upload.ts**

```ts
import { FastifyInstance } from 'fastify';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuth } from '../middleware/auth.js';

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
    },
  });
}

// POST /api/upload — returns presigned PUT URL (auth required)
export async function uploadRoutes(app: FastifyInstance) {
  app.post('/api/upload', { preHandler: [requireAuth] }, async (request, reply) => {
    const body = request.body as { filename: string; contentType: string };
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return reply.status(400).send({ error: 'filename and contentType required' });
    }

    const key = `uploads/${Date.now()}-${filename}`;
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    const publicUrl = `https://${process.env.CLOUDFLARE_BUCKET}.public.r2.cloudflarestorage.com/${key}`;

    return reply.send({ presignedUrl, publicUrl, key });
  });
}
```

Note: Add `@aws-sdk/s3-request-presigner` to api/package.json:
```bash
cd api && npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Step 2: Register upload route in api/src/app.ts**

```ts
import { uploadRoutes } from './routes/upload.js';
// in buildApp():
app.register(uploadRoutes);
```

- [ ] **Step 3: Test upload flow**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

# Get presigned URL
RESPONSE=$(curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"filename":"cover.png","contentType":"image/png"}')

echo $RESPONSE | jq .

# Upload file directly to R2 using the presigned URL
curl -X PUT "${PRESIGNED_URL}" \
  -H "Content-Type: image/png" \
  --data-binary @cover.png
```

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/upload.ts
git commit -m "feat(api): add R2 presigned URL upload route"
```


---

### Task 7: Stats Route

**Files:**
- Create: `api/src/routes/stats.ts`
- Modify: `api/src/app.ts`

- [ ] **Step 1: Create api/src/routes/stats.ts**

```ts
import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { projects } from '../db/schema.js';

export async function statsRoutes(app: FastifyInstance) {
  app.get('/api/stats', async () => {
    const all = db.select().from(projects).all();
    const total = all.length;
    const featured = all.filter((p) => p.featured).length;
    const allTags = new Set<string>();
    all.forEach((p) => {
      JSON.parse(p.tags).forEach((t: string) => allTags.add(t));
    });
    const totalViews = all.reduce((sum, p) => sum + (p.viewCount || 0), 0);

    return { total, featured, techCount: allTags.size, totalViews };
  });
}
```

- [ ] **Step 2: Register in api/src/app.ts**

```ts
import { statsRoutes } from './routes/stats.js';
app.register(statsRoutes);
```

- [ ] **Step 3: Test**

```bash
curl http://localhost:3000/api/stats
# Expected: { total: N, featured: N, techCount: N, totalViews: N }
```

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/stats.ts
git commit -m "feat(api): add stats route"
```


---

### Task 8: Admin React Scaffold

**Files:**
- Create: `src/admin/index.tsx`
- Create: `src/admin/AdminApp.tsx`
- Create: `src/admin/hooks/useAdminAuth.ts`
- Create: `src/admin/pages/LoginPage.tsx`
- Modify: `index.html` (add #admin-root div)

- [ ] **Step 1: Create src/admin/hooks/useAdminAuth.ts**

```ts
import { useState, useCallback, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'admin_token';

interface AuthState {
  token: string | null;
  username: string | null;
  isLoading: boolean;
}

export function useAdminAuth() {
  const [auth, setAuth] = useState<AuthState>(() => ({
    token: localStorage.getItem(TOKEN_KEY),
    username: null,
    isLoading: true,
  }));

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuth({ token: null, username: null, isLoading: false });
      return;
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setAuth({
          token,
          username: data?.username || null,
          isLoading: false,
        });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuth({ token: null, username: null, isLoading: false });
      });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setAuth({ token: data.token, username: data.username, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuth({ token: null, username: null, isLoading: false });
  }, []);

  return { ...auth, login, logout };
}
```

- [ ] **Step 2: Create src/admin/index.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp';

createRoot(document.getElementById('admin-root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
```

- [ ] **Step 3: Add #admin-root to index.html**

In `index.html`, add before the closing `</body>`:

```html
<div id="admin-root"></div>
```

- [ ] **Step 4: Create src/admin/AdminApp.tsx (stub, routes added in Task 9)**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './hooks/useAdminAuth';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';

export default function AdminApp() {
  const { token, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <span className="text-text-muted">Loading...</span>
      </div>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Routes added in Task 9 */}
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/admin/index.tsx src/admin/AdminApp.tsx src/admin/hooks/useAdminAuth.ts src/admin/pages/LoginPage.tsx index.html
git commit -m "feat(admin): scaffold Admin React app with useAdminAuth"
```


---

### Task 9: AdminLayout + Routing

**Files:**
- Create: `src/admin/components/AdminLayout.tsx`
- Modify: `src/admin/AdminApp.tsx`

- [ ] **Step 1: Create src/admin/components/AdminLayout.tsx**

```tsx
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function AdminLayout() {
  const { username, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <span className="font-heading text-lg text-text-primary">
            Ginko <span className="text-accent">Admin</span>
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/admin">Dashboard</NavLink>
          <NavLink to="/admin/projects">Projects</NavLink>
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{username}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Update src/admin/AdminApp.tsx with all routes**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './hooks/useAdminAuth';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectFormPage from './pages/ProjectFormPage';

export default function AdminApp() {
  const { token, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <span className="text-text-muted">Loading...</span>
      </div>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="projects/:id/edit" element={<ProjectFormPage />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/components/AdminLayout.tsx src/admin/AdminApp.tsx
git commit -m "feat(admin): add AdminLayout with sidebar navigation"
```


---

### Task 10: LoginPage

**Files:**
- Modify: `src/admin/pages/LoginPage.tsx` (already created as stub in Task 8, implement it)

- [ ] **Step 1: Implement src/admin/pages/LoginPage.tsx**

```tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      <div className="w-full max-w-sm p-8 bg-bg-card border border-border rounded-xl">
        <h1 className="font-heading text-2xl text-text-primary mb-6 text-center">
          Ginko Admin
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-text-secondary mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-text-secondary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none focus:border-accent"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-accent hover:bg-accent-dim text-bg-base font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/pages/LoginPage.tsx
git commit -m "feat(admin): implement LoginPage"
```


---

### Task 11: DashboardPage

**Files:**
- Create: `src/admin/pages/DashboardPage.tsx`

- [ ] **Step 1: Create src/admin/pages/DashboardPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Stats {
  total: number;
  featured: number;
  techCount: number;
  totalViews: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-text-muted">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl text-text-primary mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <StatCard label="Total Projects" value={stats?.total ?? 0} />
        <StatCard label="Featured" value={stats?.featured ?? 0} />
        <StatCard label="Tech Stack" value={stats?.techCount ?? 0} />
        <StatCard label="Total Views" value={stats?.totalViews ?? 0} />
      </div>
      <div className="mt-8">
        <Link
          to="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dim text-bg-base font-medium rounded-lg transition-colors text-sm"
        >
          + New Project
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <p className="text-2xl font-heading text-text-primary">{value.toLocaleString()}</p>
      <p className="text-sm text-text-muted mt-1">{label}</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/pages/DashboardPage.tsx
git commit -m "feat(admin): add DashboardPage with stats"
```


---

### Task 12: ProjectListPage

**Files:**
- Create: `src/admin/pages/ProjectListPage.tsx`

- [ ] **Step 1: Create src/admin/pages/ProjectListPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  featured: boolean;
  viewCount: number;
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    setDeleting(id);
    const token = localStorage.getItem('admin_token')!;
    await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    );
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  if (loading) return <div className="p-8 text-text-muted">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl text-text-primary">Projects</h1>
        <Link
          to="/admin/projects/new"
          className="px-4 py-2 bg-accent hover:bg-accent-dim text-bg-base font-medium rounded-lg transition-colors text-sm"
        >
          + New Project
        </Link>
      </div>

      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-text-muted font-medium">Name</th>
              <th className="px-4 py-3 text-text-muted font-medium">Tags</th>
              <th className="px-4 py-3 text-text-muted font-medium">Featured</th>
              <th className="px-4 py-3 text-text-muted font-medium">Views</th>
              <th className="px-4 py-3 text-text-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <span className="text-text-primary font-medium">{project.name}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-bg-elevated text-text-muted text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {project.featured ? (
                    <span className="text-accent text-xs">Yes</span>
                  ) : (
                    <span className="text-text-muted text-xs">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-muted">{project.viewCount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/admin/projects/${project.id}/edit`}
                      className="text-text-secondary hover:text-accent transition-colors text-xs"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deleting === project.id}
                      className="text-text-secondary hover:text-red-400 transition-colors text-xs disabled:opacity-50"
                    >
                      {deleting === project.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/pages/ProjectListPage.tsx
git commit -m "feat(admin): add ProjectListPage with delete action"
```


---

### Task 13: ProjectFormPage + ProjectForm Component

**Files:**
- Create: `src/admin/components/ProjectForm.tsx`
- Create: `src/admin/pages/ProjectFormPage.tsx`

- [ ] **Step 1: Create src/admin/components/ProjectForm.tsx**

```tsx
import { FormEvent, useState } from 'react';

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isLoading: boolean;
}

export interface ProjectFormData {
  name: string;
  description: string;
  tags: string[];
  url: string;
  thumbnail: string;
  featured: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

const EMPTY: ProjectFormData = {
  name: '',
  description: '',
  tags: [],
  url: '',
  thumbnail: '',
  featured: false,
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
};

export default function ProjectForm({ initialData, onSubmit, isLoading }: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>({
    ...EMPTY,
    ...initialData,
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const set = (key: keyof ProjectFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    set('tags', form.tags.filter((t) => t !== tag));
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true);
    try {
      const token = localStorage.getItem('admin_token')!;
      // Get presigned URL
      const presignedRes = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        }
      );
      const { presignedUrl, publicUrl } = await presignedRes.json();

      // Upload to R2
      await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      set('thumbnail', publicUrl);
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Name */}
      <Field label="Project Name">
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="form-input"
          required
        />
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="form-input resize-none"
          required
        />
      </Field>

      {/* URL */}
      <Field label="Project URL">
        <input
          type="url"
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
          className="form-input"
          placeholder="https://"
          required
        />
      </Field>

      {/* Tags */}
      <Field label="Tags">
        <div className="flex flex-wrap gap-2 mb-2">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-1 bg-bg-elevated text-text-secondary text-xs rounded-full"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-accent">
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="form-input flex-1"
            placeholder="Add tag and press Enter"
          />
          <button type="button" onClick={addTag} className="btn-secondary">
            Add
          </button>
        </div>
      </Field>

      {/* Thumbnail */}
      <Field label="Cover Image">
        {form.thumbnail && (
          <img src={form.thumbnail} alt="Cover" className="w-32 h-20 object-cover rounded-lg mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
          className="text-sm text-text-secondary"
          disabled={uploading}
        />
        {uploading && <span className="text-xs text-text-muted ml-2">Uploading...</span>}
      </Field>

      {/* Featured */}
      <Field label="">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          <span className="text-sm text-text-secondary">Featured project</span>
        </label>
      </Field>

      {/* SEO */}
      <div className="border-t border-border pt-6">
        <p className="text-sm font-medium text-text-primary mb-4">SEO</p>
        <Field label="OG Title">
          <input
            type="text"
            value={form.ogTitle}
            onChange={(e) => set('ogTitle', e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="OG Description">
          <textarea
            value={form.ogDescription}
            onChange={(e) => set('ogDescription', e.target.value)}
            rows={2}
            className="form-input resize-none"
          />
        </Field>
        <Field label="OG Image URL">
          <input
            type="url"
            value={form.ogImage}
            onChange={(e) => set('ogImage', e.target.value)}
            className="form-input"
            placeholder="https://..."
          />
        </Field>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2 bg-accent hover:bg-accent-dim text-bg-base font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Project'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
```

Note: Add to `index.css` (or use inline styles for now):

```css
.form-input {
  @apply w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none transition-colors focus:border-accent;
}
.btn-secondary {
  @apply px-3 py-2 border border-border rounded-lg text-text-secondary text-sm hover:border-border-hover transition-colors;
}
```

- [ ] **Step 2: Create src/admin/pages/ProjectFormPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectForm, { type ProjectFormData } from '../components/ProjectForm';

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [initialData, setInitialData] = useState<Partial<ProjectFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    const token = localStorage.getItem('admin_token')!;
    fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((data) => {
        setInitialData(data);
        setIsLoading(false);
      });
  }, [id, isEditing]);

  const handleSubmit = async (data: ProjectFormData) => {
    const token = localStorage.getItem('admin_token')!;
    const url = isEditing
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`
      : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects`;

    await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    navigate('/admin/projects');
  };

  if (isLoading) return <div className="p-8 text-text-muted">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl text-text-primary mb-6">
        {isEditing ? 'Edit Project' : 'New Project'}
      </h1>
      <ProjectForm initialData={initialData || undefined} onSubmit={handleSubmit} isLoading={false} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/admin/components/ProjectForm.tsx src/admin/pages/ProjectFormPage.tsx
git commit -m "feat(admin): add ProjectForm and ProjectFormPage (create/edit)"
```


---

### Task 14: Wire App.tsx + main.tsx + Build Update

**Files:**
- Modify: `src/App.tsx` (no changes needed if admin is separate mount)
- Modify: `src/main.tsx` (no changes needed)
- Modify: `src/index.css` (add .form-input, .btn-secondary utility classes)
- Modify: `package.json` (add concurrently script + admin build)

- [ ] **Step 1: Verify App.tsx routing is compatible**

The existing App.tsx has Routes for `/`, `/project/:id`, `/about`. Admin is mounted separately at `#admin-root`, so no changes needed to App.tsx.

- [ ] **Step 2: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "concurrently -n API,WEB -c blue,green \"cd api && npm run dev\" \"vite\"",
    "dev:web": "vite",
    "dev:api": "cd api && npm run dev",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

Install concurrently:
```bash
npm install -D concurrently
cd api && npm install
```

- [ ] **Step 3: Add form utility classes to index.css**

Add these to the CSS file (Tailwind v4 allows arbitrary values or extend the theme):

```css
@theme {
  --color-bg-base: #0a0a0c;
  --color-bg-card: #151518;
  --color-bg-elevated: #1a1a1c;
  --color-text-primary: #ece8e3;
  --color-text-secondary: #a8a4a0;
  --color-text-muted: #8a8784;
  --color-accent: #c97d5c;
  --color-accent-dim: #b8704e;
  --color-border: #2a2a2d;
  --color-border-hover: #3a3a3d;
}
```

Then add the form classes in a `<style>` block in `index.html` or via CSS:

```css
.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background-color: var(--color-bg-elevated);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}
.form-input:focus {
  border-color: var(--color-accent);
}
.btn-secondary {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s;
}
.btn-secondary:hover {
  border-color: var(--color-border-hover);
}
```

Or better: add to the Tailwind theme in `index.css`:

```css
@theme {
  /* ... existing vars ... */
}
@layer components {
  .form-input {
    @apply w-full px-3 py-2 border border-border rounded-lg bg-bg-elevated text-text-primary text-sm outline-none transition-colors focus:border-accent;
  }
  .btn-secondary {
    @apply px-3 py-2 border border-border rounded-lg text-text-secondary text-sm hover:border-border-hover transition-colors;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json src/index.css api/package.json
git commit -m "chore: add concurrently for API+Web dev, add form utility classes"
```


---

### Task 15: ProjectDetail API Integration

**Files:**
- Modify: `src/pages/ProjectDetail.tsx`
- Modify: `src/data/projects.ts` (keep as fallback when API unavailable)

- [ ] **Step 1: Modify src/data/projects.ts to add API fetch helper**

```ts
export const projects: Project[] = [
  // Static fallback data — used when API is unreachable
];

export async function fetchProjects(tag?: string, q?: string): Promise<Project[]> {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (q) params.set('q', q);
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects${
    params.toString() ? '?' + params.toString() : ''
  }`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`
  );
  if (!res.ok) throw new Error('Project not found');
  return res.json();
}
```

- [ ] **Step 2: Modify src/pages/ProjectDetail.tsx to use API**

Replace the `useMemo` project lookup with `useEffect` + `useState` that calls the API. The component should:
1. Show loading state while fetching
2. Show error state if fetch fails (fall back to static data)
3. Increment view count via API (separate effect)
4. Remove localStorage view count logic (now handled by API)

Key changes:
```tsx
const [project, setProject] = useState<Project | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  if (!id) return;
  fetchProject(id)
    .then((p) => {
      setProject(p);
      setLoading(false);
    })
    .catch(() => {
      // Fallback to static data
      const staticProject = projects.find((p) => p.id === id);
      setProject(staticProject || null);
      setLoading(false);
    });
}, [id]);

// View count is now incremented server-side via the GET /api/projects/:id call
```

The static `projects` import from `./data/projects` is kept as fallback.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProjectDetail.tsx src/data/projects.ts
git commit -m "feat: integrate ProjectDetail with API, fallback to static data"
```


---

### Task 16: HomePage API Integration

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/data/projects.ts`

- [ ] **Step 1: Modify HomePage.tsx to fetch from API**

Replace static `projects` import with `fetchProjects()`. The component should:
1. Fetch all projects on mount (no filter initially)
2. Client-side filter by `activeTag` and `searchQuery` (or optionally pass to API via query params)
3. Keep static `allTags` derivation (or fetch unique tags from API)
4. Show loading state

```tsx
const [projects, setProjects] = useState<Project[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchProjects()
    .then((data) => {
      setProjects(data);
      setLoading(false);
    })
    .catch(() => {
      // Fallback to static
      setProjects(staticProjects);
      setLoading(false);
    });
}, []);

const filtered = useMemo(() => {
  let result = projects;
  if (activeTag) {
    result = result.filter((p) => p.tags.includes(activeTag));
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return result;
}, [projects, searchQuery, activeTag]);

// Update featuredCount and allTags derivation:
const featuredCount = projects.filter((p) => p.featured).length;
const allTags = Array.from(new Set(projects.flatMap((p) => p.tags)));
```

Keep the `staticProjects` fallback import from `./data/projects`.

- [ ] **Step 2: Add loading state to ProjectGrid**

In `src/components/ProjectGrid.tsx`:

```tsx
interface ProjectGridProps {
  projects: Project[];
  loading?: boolean; // add this
}

// In the component:
if (loading) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-bg-card border border-border rounded-xl h-48 animate-pulse" />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Pass loading prop from HomePage**

```tsx
<ProjectGrid projects={filtered} loading={loading} />
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage.tsx src/components/ProjectGrid.tsx src/data/projects.ts
git commit -m "feat: integrate HomePage with API, add loading skeleton"
```


---

### Task 17: Build + Lint Verification

- [ ] **Step 1: Run frontend build**

Run: `npm run build`
Expected: Pass — type check + Vite build succeeds

- [ ] **Step 2: Run frontend lint**

Run: `npm run lint`
Expected: Pass — no ESLint errors

- [ ] **Step 3: Verify API starts**

Run: `cd api && npm run dev` (in background or separate terminal)
Expected: Fastify starts on port 3000

- [ ] **Step 4: Verify admin app starts**

Add `src/admin/index.tsx` to vite config if needed (Admin is a separate entry):

In `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        admin: './admin.html', // create this file
      },
    },
  },
});
```

Create `admin.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin - Ginko Hub</title>
  </head>
  <body>
    <div id="admin-root"></div>
    <script type="module" src="/src/admin/index.tsx"></script>
  </body>
</html>
```

Run: `npm run build`
Expected: Pass — generates `dist/admin.html` and `dist/assets/admin-*.js`

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts admin.html
git commit -m "chore: add admin entry point to Vite build"
```

---

## Final Checklist

- [ ] `npm run build` passes (frontend)
- [ ] `npm run lint` passes (frontend)
- [ ] `cd api && npm run dev` starts on port 3000
- [ ] Login at `/admin/login` works with seeded credentials
- [ ] CRUD projects in Admin works
- [ ] File upload to R2 works (presigned URL flow)
- [ ] HomePage and ProjectDetail load data from API

