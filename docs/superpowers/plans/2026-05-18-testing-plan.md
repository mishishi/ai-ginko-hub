# Ginko Hub Testing Implementation Plan

> For agentic workers: Use superpowers:subagent-driven-development or superpowers:executing-plans

Goal: Complete test coverage for Ginko Hub - API integration, frontend components, utilities

---


## Context

Current test infrastructure:
- vitest ^3.2.4 configured in root and api/
- api/src/test/setup.ts: sql.js in-memory DB, seedTestProjects, testDb singleton
- api/src/test/helpers.ts: buildTestApp() registers all routes EXCEPT analyticsRoutes
- Frontend: @testing-library/react, jsdom, @testing-library/jest-dom

No test files exist yet. Build from scratch.

---

## File Structure

api/src/
  test/
    setup.ts          (existing - initTestDb, seedTestProjects, testDb)
    helpers.ts        (MODIFY - add analyticsRoutes registration)
    routes/
      projects.test.ts      (CREATE)
      favorites.test.ts     (CREATE)
      stats.test.ts         (CREATE)
      analytics.test.ts     (CREATE)
      auth.test.ts          (CREATE)
      upload.test.ts        (CREATE)
src/
  test/
    setup.ts          (CREATE - @testing-library/jest-dom import)
  components/
    ProjectCard.test.tsx    (CREATE)
    FilterBar.test.tsx      (CREATE)
    Header.test.tsx         (CREATE)
    ProjectGrid.test.tsx    (CREATE)
  lib/
    tagColors.test.ts        (CREATE)
  hooks/
    useAnalytics.test.ts     (CREATE)
api/src/utils/
  password.test.ts           (CREATE)

---

## Task 1: Fix test infrastructure

### 1a. Add analyticsRoutes to buildTestApp

Modify: api/src/test/helpers.ts

Add import and registration:
  import { analyticsRoutes } from "../routes/analytics.js";
  // inside buildTestApp():
  await app.register(analyticsRoutes);

### 1b. Create frontend test setup

Create: src/test/setup.ts
  import "@testing-library/jest-dom";

Modify: vitest.config.ts - add setupFiles
  setupFiles: ["./src/test/setup.ts"],

Verify: npm run test:run -- --run src/test/setup.ts does not error

### 1c. Seed admin user in test DB

Modify: api/src/test/setup.ts

The auth tests need an admin user in the DB. Add to initTestDb() or seedTestProjects():
  await testDb.insert(admin).values({
    id: "admin-1",
    username: "testadmin",
    passwordHash: await hashPassword("testpass123")
  }).run();

Commit: test: wire analyticsRoutes into buildTestApp and add frontend test setup

---

## Task 2: API integration - projects.test.ts

Create: api/src/routes/projects.test.ts

Setup:
  import { describe, it, expect, beforeEach } from "vitest";
  import buildTestApp from "../test/helpers.js";
  import { seedTestProjects } from "../test/setup.js";

  let app: Awaited<ReturnType<typeof buildTestApp>>;
  beforeEach(async () => {
    app = await buildTestApp();
    await seedTestProjects();
  });

Test cases:
- GET /api/projects returns 200 with projects array
- GET /api/projects returns X-Total-Count header
- GET /api/projects?tag=React filters by tag
- GET /api/projects?q=test filters by name/description
- GET /api/projects?sort=views&order=desc sorts correctly
- GET /api/projects?featured=true filters featured only
- GET /api/projects/:id returns single project
- GET /api/projects/:id increments view_count
- GET /api/projects/:id returns 404 for unknown id
- GET /api/projects/batch?ids=a,b returns batch projects

Commit: test: add projects API integration tests

---

## Task 3: API integration - favorites.test.ts

Create: api/src/routes/favorites.test.ts

Auth approach: Generate JWT using jose:
  import { SignJWT } from "jose";
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "test-secret");
  const token = await new SignJWT({ sub: "admin-1", username: "test" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("1h")
    .sign(secret);
  // Use: headers: { Authorization: `Bearer ${token}` }

Test cases:
- GET /api/favorites returns 401 without auth
- GET /api/favorites returns user favorites with auth
- POST /api/favorites adds favorite and increments like_count
- POST /api/favorites returns 401 without auth
- DELETE /api/favorites/:id removes favorite and decrements like_count
- DELETE /api/favorites/:id returns 401 without auth

Commit: test: add favorites API integration tests

---

## Task 4: API integration - stats.test.ts

Create: api/src/routes/stats.test.ts

Test cases:
- GET /api/stats returns total, featured, techCount fields
- GET /api/tags returns deduplicated sorted tag array

Commit: test: add stats API integration tests

---

## Task 5: API integration - analytics.test.ts

Create: api/src/routes/analytics.test.ts

Test cases:
- POST /api/analytics with valid eventType returns 200
- POST /api/analytics with invalid eventType returns 400
- POST /api/analytics records event in DB
- POST /api/analytics rate limited at 60 req/min (send 61, expect 429)
- GET /api/analytics/summary returns 401 without auth
- GET /api/analytics/summary returns aggregated stats with auth
- GET /api/analytics/summary respects range param (range=7 vs range=30)

Commit: test: add analytics API integration tests

---

## Task 6: API integration - auth.test.ts

Create: api/src/routes/auth.test.ts

Precondition: Seed admin user in test DB before running auth tests.
Use the existing admin table seeding in setup.ts or add a beforeAll that inserts admin.

Test cases:
- POST /api/auth/login with valid credentials returns 200 and sets cookie
- POST /api/auth/login with invalid credentials returns 401
- GET /api/auth/me returns username when valid JWT provided
- GET /api/auth/me returns 401 without auth
- POST /api/auth/logout clears cookie

Commit: test: add auth API integration tests

---

## Task 7: API integration - upload.test.ts

Create: api/src/routes/upload.test.ts

Mock R2 at module level:
  vi.mock("@aws-sdk/client-s3", () => ({
    S3Client: vi.fn(() => ({ send: vi.fn().mockResolvedValue({}) })),
    PutObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
  }));
  vi.mock("@aws-sdk/s3-request-presigner", () => ({
    getSignedUrl: vi.fn().mockResolvedValue("https://mock-url"),
  }));

Test cases:
- POST /api/upload returns presigned URL with auth
- POST /api/upload returns 401 without auth
- POST /api/upload validates filename (rejects path traversal)
- POST /api/upload validates content-type (rejects non-image)
- DELETE /api/upload returns 204 with auth
- DELETE /api/upload returns 401 without auth

Commit: test: add upload API integration tests

---

## Task 8: Frontend component - ProjectCard.test.tsx

Create: src/components/ProjectCard.test.tsx

Mock ProjectCard dependencies:
  vi.mock("../data/cardGradients", () => ({ cardGradients: ["linear-gradient(...)"] }));
  vi.mock("react-router-dom", () => ({ ... }));

Mock userEvent:
  import userEvent from "@testing-library/user-event";

Test cases:
- renders project name and description
- renders tags as clickable spans
- tag click calls navigate with correct tag param (userEvent click)
- favorite button calls onFavoriteToggle prop
- open button present when hovered (simulate mouseEnter)

Commit: test: add ProjectCard component tests

---

## Task 9: Frontend component - FilterBar.test.tsx

Create: src/components/FilterBar.test.tsx

Test cases:
- renders all passed tags
- calls onTagChange when tag clicked
- active tag has visual distinction (aria-pressed or class)
- sort dropdown calls onSortChange
- featured toggle calls onFeaturedChange

Commit: test: add FilterBar component tests

---

## Task 10: Frontend component - Header.test.tsx

Create: src/components/Header.test.tsx

Mock Clerk:
  vi.mock("@clerk/react", () => ({
    useAuth: () => ({ isSignedIn: false }),
    SignInButton: ({ children }: any) => <button>{children}</button>,
    UserButton: () => <div>UserButton</div>,
  }));

Test cases:
- renders logo link to /
- renders nav links (projects, about)
- renders search input with onSearchChange prop
- shows SignInButton when not signed in
- shows UserButton when signed in (test both states)

Commit: test: add Header component tests

---

## Task 11: Frontend component - ProjectGrid.test.tsx

Create: src/components/ProjectGrid.test.tsx

Test cases:
- renders skeleton loading state when isLoading=true
- renders project cards when projects loaded
- renders empty state when projects=[] and !isLoading
- load more button present when hasMore=true
- calls onLoadMore when load more clicked

Commit: test: add ProjectGrid component tests

---

## Task 12: Utility - tagColors.test.ts

Create: src/lib/tagColors.test.ts

Test cases:
- hashTagColor is deterministic: same tag -> same color every time
- different tags produce different colors (statistically)
- return value has color, border, bg keys
- all colors in PALETTE are valid CSS color strings

Commit: test: add tagColors utility tests

---

## Task 13: Utility - password.test.ts (API)

Create: api/src/utils/password.test.ts

Test cases:
- hashPassword returns a bcrypt hash string
- verifyPassword returns true for correct password
- verifyPassword returns false for wrong password
- hash is different each time (due to salt)

Commit: test: add password utility tests

---

## Task 14: Hook - useAnalytics.test.ts

Create: src/hooks/useAnalytics.test.ts

Mock fetch:
  const fetchSpy = vi.spyOn(global, "fetch");
  fetchSpy.mockResolvedValueOnce(new Response("{"ok":true}", { status: 200 }));

Test cases:
- track() POSTs to /api/analytics with correct body
- track() swallows errors silently (no throw)
- does not call fetch when not tracking

Commit: test: add useAnalytics hook tests

---

## Verification

1. cd api && npm run test:run -- --reporter=verbose
2. npm run test:run -- --reporter=verbose
3. npm run test:run -- --coverage (target: routes >80%, components >60%)

All tests green = done.
