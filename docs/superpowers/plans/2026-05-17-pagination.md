# 分页功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为项目列表添加"加载更多"分页，API 支持 limit/offset，前端追加内容而非全量刷新。

**Architecture:** API 层在 projects 路由添加分页参数并返回 X-Total-Count 头；前端 data 层 fetchProjects 改为返回 `{ projects, total }`；HomePage 维护追加模式的项目列表和加载更多状态；ProjectGrid 接收 hasMore/loadingMore/onLoadMore props 渲染按钮。

**Tech Stack:** React, TypeScript, Fastify, Drizzle ORM, Tailwind CSS

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `api/src/routes/projects.ts` | GET handler 支持 limit/offset，返回 X-Total-Count 头 |
| `src/data/projects.ts` | fetchProjects 增加 limit/offset 参数，返回 `{ projects, total }` |
| `src/pages/HomePage.tsx` | 分页状态（追加模式）、加载更多逻辑、筛选重置 |
| `src/components/ProjectGrid.tsx` | Props 增加 hasMore/onLoadMore/loadingMore，渲染加载更多按钮 |

---

## Task 1: API 分页支持

**Files:**
- Modify: `api/src/routes/projects.ts:26-57`

### 修改 GET /api/projects Handler

找到当前的 GET handler，修改为：

```typescript
app.get('/api/projects', async (request) => {
  const db = await getDb();
  const { tag, q, limit, offset } = request.query as {
    tag?: string;
    q?: string;
    limit?: string;
    offset?: string;
  };

  let results = await db.select().from(projects);

  // Filter by tag
  if (tag) {
    results = results.filter((p) => {
      const tags = parseTags(p.tags);
      return tags.includes(tag);
    });
  }

  // Filter by search query
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }

  const total = results.length;

  // Apply pagination
  const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 12;
  const offsetNum = offset ? parseInt(offset, 10) : 0;
  const paginatedResults = results.slice(offsetNum, offsetNum + limitNum);

  // Parse tags back to array
  const parsed = paginatedResults.map((p) => ({
    ...p,
    tags: parseTags(p.tags),
  }));

  return reply.header('X-Total-Count', total).send(parsed);
});
```

> 注意：Fastify reply 需要在 return 之前设置 header，或者直接用 `reply.header().send()` 链式调用。

### 验证方法
```bash
curl http://localhost:4001/api/projects
curl http://localhost:4001/api/projects?limit=3&offset=0
# 检查响应头: X-Total-Count
```

---

## Task 2: fetchProjects 签名变更

**Files:**
- Modify: `src/data/projects.ts`

### 修改 fetchProjects 函数

```typescript
export async function fetchProjects(
  tag?: string,
  q?: string,
  limit?: number,
  offset?: number
): Promise<{ projects: Project[]; total: number }> {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (q) params.set('q', q);
  if (limit !== undefined) params.set('limit', String(limit));
  if (offset !== undefined) params.set('offset', String(offset));
  const url = `${API_BASE}/api/projects${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch projects');
  const total = Number(res.headers.get('X-Total-Count') || 0);
  return { projects: await res.json(), total };
}
```

### 验证方法
在浏览器控制台或 devtools 检查网络请求，确认 X-Total-Count 头存在。

---

## Task 3: HomePage 分页状态与逻辑

**Files:**
- Modify: `src/pages/HomePage.tsx`

### 变更点

1. **新增 state**（在现有的 `projects` state 后）:
```typescript
const [page, setPage] = useState(0);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const [total, setTotal] = useState(0);
```

2. **重构 useEffect（初始加载）**，使用 `fetchProjects(tag, q, PAGE_SIZE, 0)` 返回 `{ projects, total }`:
```typescript
const PAGE_SIZE = 12;

useEffect(() => {
  fetchProjects(activeTag || undefined, searchQuery || undefined, PAGE_SIZE, 0)
    .then(({ projects: data, total: totalCount }) => {
      setProjects(data);
      setTotal(totalCount);
      setHasMore(data.length < totalCount);
      setPage(1);
    })
    .catch(() => setProjects([]))
    .finally(() => setLoading(false));
}, []); // 首次加载
```

3. **添加 loadMore 函数**:
```typescript
const loadMore = useCallback(async () => {
  if (loadingMore || !hasMore) return;
  setLoadingMore(true);
  const offset = page * PAGE_SIZE;
  try {
    const { projects: data, total: totalCount } = await fetchProjects(
      activeTag || undefined,
      searchQuery || undefined,
      PAGE_SIZE,
      offset
    );
    setProjects((prev) => [...prev, ...data]);
    setTotal(totalCount);
    setHasMore(projects.length + data.length < totalCount);
    setPage((p) => p + 1);
  } finally {
    setLoadingMore(false);
  }
}, [page, activeTag, searchQuery, projects.length, hasMore, loadingMore]);
```

4. **筛选变化时重置**:
```typescript
// 在筛选变化时重置
useEffect(() => {
  setLoading(true);
  setPage(0);
  setHasMore(true);
  fetchProjects(activeTag || undefined, searchQuery || undefined, PAGE_SIZE, 0)
    .then(({ projects: data, total: totalCount }) => {
      setProjects(data);
      setTotal(totalCount);
      setHasMore(data.length < totalCount);
      setPage(1);
    })
    .catch(() => setProjects([]))
    .finally(() => setLoading(false));
}, [activeTag, searchQuery]);
```

5. **传递给 ProjectGrid**:
```typescript
<ProjectGrid
  projects={filtered}
  loading={loading}
  hasMore={hasMore}
  loadingMore={loadingMore}
  onLoadMore={loadMore}
/>
```

6. **删除原有的单次 `useEffect(() => { fetchProjects()... })`**

---

## Task 4: ProjectGrid 加载更多按钮

**Files:**
- Modify: `src/components/ProjectGrid.tsx`

### Props 接口变更

```typescript
interface Props {
  projects: Project[];
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}
```

### 渲染加载更多按钮

在网格下方 `</div>` 前添加：

```tsx
{!loading && hasMore && (
  <div className="col-span-full flex justify-center pt-8">
    <button
      onClick={onLoadMore}
      disabled={loadingMore}
      className="px-6 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loadingMore ? '加载中...' : '加载更多'}
    </button>
  </div>
)}
```

注意：`col-span-full` 让这个 div 占满整行网格列数，实现居中效果。

---

## 验证清单

- [ ] `curl localhost:4001/api/projects?limit=2&offset=0` 返回 2 个，响应头有 X-Total-Count
- [ ] `curl localhost:4001/api/projects?tag=React` 返回过滤后数据
- [ ] 首页加载后只显示 12 个（或更少）项目
- [ ] 点击"加载更多"后追加项目，不是覆盖
- [ ] 切换筛选条件时重置到第一页
- [ ] 所有项目加载完后"加载更多"按钮消失
- [ ] 加载更多过程中按钮禁用，显示"加载中..."
