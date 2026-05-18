import { beforeAll, afterEach, afterAll } from 'vitest';
import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from '../db/schema.js';
import { hashPassword } from '../utils/password.js';

// Set test JWT_SECRET before any modules that import auth middleware
process.env.JWT_SECRET ??= 'test-secret-for-unit-tests-only';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  tags text NOT NULL,
  url text NOT NULL,
  thumbnail text,
  repo_url text,
  created_at text NOT NULL,
  featured integer DEFAULT 0,
  og_title text,
  og_description text,
  og_image text,
  view_count integer DEFAULT 0,
  discovery_score integer DEFAULT 0,
  like_count integer DEFAULT 0,
  created_at_ts integer,
  updated_at integer
);

CREATE TABLE IF NOT EXISTS favorites (
  id text PRIMARY KEY NOT NULL,
  project_id text NOT NULL,
  user_id text NOT NULL,
  created_at_ts integer NOT NULL
);

CREATE TABLE IF NOT EXISTS admin (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  username text NOT NULL,
  password_hash text NOT NULL
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  event_type text NOT NULL,
  project_id text,
  tag text,
  query text,
  referrer text,
  ip text,
  user_agent text,
  created_at integer NOT NULL
);
`;

// Shared singleton — created once, reused by both setup.ts consumers and vi.mock factory
export let testDb: ReturnType<typeof drizzle>;
let initDone = false;

export async function initTestDb() {
  if (initDone && testDb) return testDb;

  const SQL = await initSqlJs();
  const rawDb = new SQL.Database();

  // Run schema migrations to create tables
  rawDb.run(MIGRATION_SQL);

  testDb = drizzle(rawDb, { schema });
  initDone = true;
  return testDb;
}

export async function seedTestProjects() {
  if (!testDb) throw new Error('testDb not initialized');
  const { projects, admin } = schema;
  const now = Date.now();
  await testDb.insert(projects).values([
    {
      id: 'proj-001',
      name: 'Test Project One',
      description: 'A test project for integration tests',
      tags: JSON.stringify(['React', 'TypeScript']),
      url: 'https://example.com/project1',
      repoUrl: 'https://github.com/test/project1',
      thumbnail: null,
      featured: true,
      viewCount: 100,
      createdAt: '2026-01-01',
      createdAtTs: now - 86400000,
      updatedAt: now,
    },
    {
      id: 'proj-002',
      name: 'Test Project Two',
      description: 'Another test project',
      tags: JSON.stringify(['Vue', 'JavaScript']),
      url: 'https://example.com/project2',
      repoUrl: null,
      thumbnail: null,
      featured: false,
      viewCount: 50,
      createdAt: '2026-02-01',
      createdAtTs: now,
      updatedAt: now,
    },
    {
      id: 'proj-003',
      name: 'Backend API',
      description: 'Fastify backend project',
      tags: JSON.stringify(['Fastify', 'TypeScript', 'React']),
      url: 'https://example.com/api',
      repoUrl: 'https://github.com/test/api',
      thumbnail: null,
      featured: false,
      viewCount: 200,
      createdAt: '2026-03-01',
      createdAtTs: now + 86400000,
      updatedAt: now,
    },
  ]).run();

  // Seed admin user for auth tests
  await testDb.insert(admin).values({
    id: 1,
    username: 'testadmin',
    passwordHash: hashPassword('testpass123'),
  }).run();
}

beforeAll(async () => {
  await initTestDb();
});

afterEach(async () => {
  if (testDb) {
    await testDb.delete(schema.projects).run();
    await testDb.delete(schema.favorites).run();
    await testDb.delete(schema.admin).run();
  }
});

afterAll(() => {});
