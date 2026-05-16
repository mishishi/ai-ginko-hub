# 分页/加载更多 实现设计

> **日期:** 2026-05-17
> **类型:** 功能增强
> **状态:** 已批准

## 概述

为项目列表添加服务器端分页，通过"加载更多"按钮追加内容，避免一次性加载所有项目。

## API 变更

### 路由
`GET /api/projects`

### 新增查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | number | 12 | 每页数量 |
| `offset` | number | 0 | 跳过数量 |

### 响应

- 响应头 `X-Total-Count` 返回符合条件的项目总数
- 响应体为 `Project[]`

```typescript
// 请求
GET /api/projects?tag=React&limit=12&offset=0

// 响应头
X-Total-Count: 28

// 响应体
Project[]
```

## 前端变更

### 状态

```typescript
const [projects, setProjects] = useState<Project[]>([]);     // 追加模式
const [page, setPage] = useState(0);                         // 当前页
const [hasMore, setHasMore] = useState(true);               // 是否还有更多
const [loadingMore, setLoadingMore] = useState(false);       // 加载中防重
const [total, setTotal] = useState(0);                       // 总数（来自 X-Total-Count）
```

### 加载逻辑

```typescript
const PAGE_SIZE = 12;

const loadProjects = useCallback(async (reset = false) => {
  const currentOffset = reset ? 0 : page * PAGE_SIZE;
  const data = await fetchProjects(activeTag || undefined, searchQuery || undefined, PAGE_SIZE, currentOffset);

  if (reset) {
    setProjects(data.projects);
    setPage(1);
  } else {
    setProjects(prev => [...prev, ...data.projects]);
    setPage(prev => prev + 1);
  }
  setTotal(data.total);
  setHasMore(projects.length < data.total);
}, [page, activeTag, searchQuery]);
```

### fetchProjects 签名变更

```typescript
// src/data/projects.ts
export async function fetchProjects(
  tag?: string,
  q?: string,
  limit?: number,
  offset?: number
): Promise<{ projects: Project[]; total: number }> {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (q) params.set('q', q);
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  const url = `${API_BASE}/api/projects${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch projects');
  const total = Number(res.headers.get('X-Total-Count') || 0);
  return { projects: await res.json(), total };
}
```

## UI 组件

在 `ProjectGrid` 中添加"加载更多"按钮，渲染在网格下方居中。

```tsx
{hasMore && (
  <div className="col-span-full flex justify-center pt-8">
    <button
      onClick={handleLoadMore}
      disabled={loadingMore}
      className="px-6 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer disabled:opacity-50"
    >
      {loadingMore ? '加载中...' : '加载更多'}
    </button>
  </div>
)}
```

## 筛选/搜索重置

当 `activeTag` 或 `searchQuery` 变化时，需要重置分页状态并重新加载第一页。

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `api/src/routes/projects.ts` | 修改 GET handler 支持 limit/offset，添加 X-Total-Count 响应头 |
| `src/data/projects.ts` | 修改 fetchProjects 签名，增加 limit/offset 参数，返回 { projects, total } |
| `src/pages/HomePage.tsx` | 重构加载逻辑，支持分页加载、加载更多按钮 |
| `src/components/ProjectGrid.tsx` | Props 增加 `hasMore`/`onLoadMore`/`loadingMore`，渲染加载更多按钮 |

## 行为规则

1. 首次加载时显示 12 个项目
2. 筛选条件变化时重置为第一页
3. 加载更多时追加而非覆盖
4. 已加载数量 >= 总数时隐藏加载更多按钮
5. 加载更多过程中按钮禁用，防止重复请求
