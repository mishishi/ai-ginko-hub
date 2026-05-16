# 收藏功能 + Clerk 用户认证 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为公开站点接入 Clerk 第三方登录，并实现收藏功能。

**Architecture:** Clerk 作为身份提供商（GitHub/Google），userId 直接关联收藏数据，不建本地用户表。公开侧 API（GET favorites）需要验证 Clerk JWT，POST/DELETE favorites 同理。Admin 侧不受影响。

**Tech Stack:** @clerk/fastify（后端 JWT 验证）、@clerk/clerk-sdk-node 或 @clerk/react（前端）、Drizzle ORM + SQLite、react-hot-toast（已有）

---

## 文件结构

```
api/src/
├── middleware/
│   └── clerk.ts          # JWT 验证中间件（新增）
├── routes/
│   ├── favorites.ts       # 收藏 CRUD API（新增）
│   └── auth.ts           # Clerk webhook（新增，可选）
src/
├── components/
│   └── ProjectCard.tsx   # 心形收藏按钮（修改）
├── pages/
│   └── FavoritesPage.tsx # 收藏列表页（新增）
├── App.tsx               # 路由 + ClerkProvider（修改）
├── main.tsx              # Vite 环境变量（修改）
.env.local               # Clerk 密钥（新增）
```

---

### Task 1: Clerk 后端 JWT 验证中间件

**Files:**
- Create: `api/src/middleware/clerk.ts`
- Modify: `api/src/app.ts`

- [ ] **Step 1: 安装 @clerk/fastify**

```bash
cd /Users/zhurenbao/Jason/ai-workspaces/ai-ginko-hub/api && npm install @clerk/fastify
```

- [ ] **Step 2: 创建 clerk 中间件**

```ts
// api/src/middleware/clerk.ts
import { verifyToken } from '@clerk/fastify';

export interface ClerkUser {
  userId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    clerkUser?: ClerkUser;
  }
}

export async function requireClerkAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Get token from Authorization header or __session cookie
  const authHeader = request.headers.authorization;
  const sessionToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.cookies.__session;

  if (!sessionToken) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const { userId } = await verifyToken(sessionToken, {
      issuer: process.env.CLERK_ISSUER, // https://clerk.example.com
      audience: process.env.CLERK_AUDIENCE, // your frontend domain
    });
    request.clerkUser = { userId };
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
```

- [ ] **Step 3: 注册中间件到 app.ts**

```ts
// api/src/app.ts
import { clerkPlugin } from '@clerk/fastify';

// 在 buildApp() 中注册
await app.register(clerkPlugin, {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  issuer: process.env.CLERK_ISSUER,
});
```

- [ ] **Step 4: commit**

```bash
cd /Users/zhurenbao/Jason/ai-workspaces/ai-ginko-hub
git add api/src/middleware/clerk.ts api/src/app.ts api/package.json api/package-lock.json
git commit -m "feat(api): Clerk JWT 验证中间件"
```

---

### Task 2: Favorites 数据库 Schema

**Files:**
- Modify: `api/src/db/schema.ts`

- [ ] **Step 1: 添加 favorites 表**

```ts
// api/src/db/schema.ts
export const favorites = sqliteTable('favorites', {
  id: text('id').primaryKey(), // UUID
  projectId: text('project_id').notNull().references(() => projects.id),
  userId: text('user_id').notNull(), // Clerk user.id
  createdAt: integer('created_at_ts').notNull(), // Unix timestamp
});
```

- [ ] **Step 2: 生成迁移（drizzle-kit push 或手动）**

```bash
cd /Users/zhurenbao/Jason/ai-workspaces/ai-ginko-hub/api
npx drizzle-kit push
```

注意：SQLite 不支持外键约束，需要手动检查 schema 是否正确。

- [ ] **Step 3: commit**

```bash
git add api/src/db/schema.ts
git commit -m "feat(api): 添加 favorites 表 schema"
```

---

### Task 3: Favorites API 路由

**Files:**
- Create: `api/src/routes/favorites.ts`
- Modify: `api/src/app.ts`

- [ ] **Step 1: 创建 favorites 路由**

```ts
// api/src/routes/favorites.ts
import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../db/index.js';
import { favorites } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

function generateId(): string {
  return uuidv4();
}

export async function favoriteRoutes(app: FastifyInstance) {
  // GET /api/favorites - 获取当前用户所有收藏
  app.get('/api/favorites', async (request, reply) => {
    const userId = request.clerkUser?.userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const db = await getDb();
    const results = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .all();

    return results.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      createdAt: f.createdAt,
    }));
  });

  // POST /api/favorites - 添加收藏
  app.post('/api/favorites', async (request, reply) => {
    const userId = request.clerkUser?.userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { projectId } = request.body as { projectId?: string };
    if (!projectId) {
      return reply.status(400).send({ error: 'projectId is required' });
    }

    const db = await getDb();

    // 检查是否已收藏
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.projectId, projectId)))
      .limit(1)
      .all();

    if (existing.length > 0) {
      return { id: existing[0].id, projectId, createdAt: existing[0].createdAt };
    }

    const id = generateId();
    const createdAt = Date.now();
    await db.insert(favorites).values({ id, projectId, userId, createdAt }).run();
    await saveDb();

    return reply.status(201).send({ id, projectId, createdAt });
  });

  // DELETE /api/favorites/:projectId - 取消收藏
  app.delete('/api/favorites/:projectId', async (request, reply) => {
    const userId = request.clerkUser?.userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { projectId } = request.params as { projectId: string };

    const db = await getDb();
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.projectId, projectId)))
      .run();
    await saveDb();

    return reply.status(204).send();
  });
}
```

- [ ] **Step 2: 在 app.ts 注册路由**

```ts
// api/src/app.ts
import { favoriteRoutes } from './routes/favorites.js';

// 在 buildApp() 中
await app.register(favoriteRoutes);
```

- [ ] **Step 3: commit**

```bash
git add api/src/routes/favorites.ts api/src/app.ts
git commit -m "feat(api): 添加 favorites REST API"
```

---

### Task 4: 前端 Clerk 接入

**Files:**
- Modify: `src/main.tsx`, `.env.local`

- [ ] **Step 1: 安装 @clerk/react**

```bash
cd /Users/zhurenbao/Jason/ai-workspaces/ai-ginko-hub
npm install @clerk/react
```

- [ ] **Step 2: 修改 main.tsx 接入 ClerkProvider**

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import './index.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey} afterSignInUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

注意：Vite 环境变量需要 `VITE_` 前缀。

- [ ] **Step 3: 添加环境变量**

```bash
# .env.local（需要创建）
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
```

- [ ] **Step 4: commit**

```bash
git add src/main.tsx .env.local package.json package-lock.json
git commit -m "feat: 接入 Clerk Provider"
```

---

### Task 5: Header 登录按钮 + UserButton

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: 添加 Clerk UserButton**

```tsx
// src/components/Header.tsx
import { SignInButton, UserButton, useAuth } from '@clerk/react';

// 在 Header 组件中（useAuth 是 React hook，Header 必须是客户端组件）
const { isSignedIn } = useAuth();

// 在 logo 旁边或导航栏右侧添加：
{isSignedIn ? (
  <UserButton afterSignOutUrl="/" />
) : (
  <SignInButton mode="modal">
    <button className="px-4 py-2 text-sm bg-accent text-bg-base rounded-lg font-medium">
      登录
    </button>
  </SignInButton>
)}
```

注意：`@clerk/clerk-sdk-node` 的 `useAuth` 是 React hook，需要在 ClerkProvider 内部使用。

- [ ] **Step 2: commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: Header 添加 Clerk 登录按钮"
```

---

### Task 6: ProjectCard 收藏按钮

**Files:**
- Modify: `src/components/ProjectCard.tsx`

- [ ] **Step 1: 添加心形收藏按钮**

```tsx
// src/components/ProjectCard.tsx
import { useAuth, useUser } from '@clerk/react';
import toast from 'react-hot-toast';

// 在 ProjectCard 内
const { isSignedIn } = useAuth();
const { getToken } = useUser();
const [isFavorited, setIsFavorited] = useState(false);
const [loading, setLoading] = useState(false);

// 初始化：检查是否已收藏
useEffect(() => {
  if (!isSignedIn) return;
  getToken().then((token) => {
    fetch(`${API_BASE}/api/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setIsFavorited(data.some((f: { projectId: string }) => f.projectId === project.id));
      });
  });
}, [isSignedIn, project.id, getToken]);

const toggleFavorite = async (e: React.MouseEvent) => {
  e.stopPropagation();
  if (!isSignedIn) {
    toast.error('请先登录后再收藏');
    return;
  }
  setLoading(true);
  try {
    const token = await getToken();
    if (isFavorited) {
      await fetch(`${API_BASE}/api/favorites/${project.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsFavorited(false);
    } else {
      await fetch(`${API_BASE}/api/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId: project.id }),
      });
      setIsFavorited(true);
      toast.success('已收藏');
    }
  } catch {
    toast.error('操作失败，请重试');
  } finally {
    setLoading(false);
  }
};
```

在心形图标按钮上触发 `toggleFavorite`。

- [ ] **Step 2: commit**

```bash
git add src/components/ProjectCard.tsx
git commit -m "feat: ProjectCard 添加收藏功能"
```

---

### Task 7: 收藏页 FavoritesPage

**Files:**
- Create: `src/pages/FavoritesPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 创建收藏页**

```tsx
// src/pages/FavoritesPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/react';
import Header from '../components/Header';
import ProjectGrid from '../components/ProjectGrid';
import { API_BASE } from '../lib/api';
import type { Project } from '../types';

export default function FavoritesPage() {
  const { isSignedIn } = useAuth();
  const { getToken } = useUser();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/');
      return;
    }
    getToken().then((token) => {
      fetch(`${API_BASE}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(async (favorites) => {
          // favorites 是 [{id, projectId, createdAt}]，需要 fetch 完整项目数据
          const projectIds = favorites.map((f: { projectId: string }) => f.projectId);
          const allProjects: Project[] = [];
          for (const id of projectIds) {
            const p = await fetch(`${API_BASE}/api/projects/${id}`).then((r) => r.json());
            allProjects.push(p);
          }
          setProjects(allProjects);
        })
        .finally(() => setLoading(false));
    });
  }, [isSignedIn, getToken, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-heading text-3xl text-text-primary mb-6">我的收藏</h1>
          <ProjectGrid projects={projects} loading={loading} hasMore={false} loadingMore={false} onLoadMore={() => {}} />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 在 App.tsx 添加路由**

```tsx
// src/App.tsx
import FavoritesPage from './pages/FavoritesPage';

// 路由
<Route path="/favorites" element={<FavoritesPage />} />
```

- [ ] **Step 3: commit**

```bash
git add src/pages/FavoritesPage.tsx src/App.tsx
git commit -m "feat: 添加收藏页 /favorites"
```

---

## 实施顺序

1. Task 1: Clerk 后端中间件（基础设施）
2. Task 2: Favorites Schema（数据库）
3. Task 3: Favorites API（核心逻辑）
4. Task 4: 前端 Clerk 接入
5. Task 5: Header 登录按钮
6. Task 6: ProjectCard 收藏按钮
7. Task 7: 收藏页

---
