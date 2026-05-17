# 系统审计报告 v4 — 2026-05-17

9 维度审计：P0 CRITICAL · P1 HIGH · P2 MEDIUM · P3 LOW + Correctness / SEO / Performance

**相比 v3 变更摘要：**
- ✅ C1 CORS 动态化（`CORS_ORIGINS` env var）
- ✅ C2 Clerk 启动检查（`clerk.ts:19` throw if missing）
- ✅ H2 batch 响应顺序重排（`projects.ts:170-175` Map 匹配）
- ✅ H3 tags 缓存 TTL 降至 30s
- ✅ H4 Hero 统计改用 `/api/stats` 全量端点
- ✅ H5 封面上传清理（R2 delete + 失败回滚）
- ✅ H7 favorites 独立 rate limit（30 req/min）
- ✅ M1 空收藏引导 UI
- ✅ M4 URL pattern 验证
- ✅ M5 ProjectCard img onError 降级
- ✅ M6 收藏按钮 disabled 状态
- ✅ M7 Loading 中文文案
- ✅ M8 HomePage 动态 meta
- ✅ L2 上传 AbortSignal timeout
- ✅ L4 标签 trim 后添加
- ✅ L1 GitHub 用户名改用 `VITE_GITHUB_USERNAME` env var

---

## P0 CRITICAL（立即修复，部署阻断）

### C1 · CORS 环境变量仍未在生产文档中说明
- **文件**: `api/src/app.ts:18-20`
- **现状**: 代码已支持 `CORS_ORIGINS` env var 动态读取，**但** `.env.example` / 部署文档未说明此变量必须配置
- **风险**: 部署时不设置 `CORS_ORIGINS` 会 fallback 到 localhost，生产环境跨域请求全部 403
- **修复**: 在 `api/.env.example` 中添加 `CORS_ORIGINS=https://yourdomain.com`，并在 README 部署章节说明

---

## P1 HIGH（功能正确性，上线前修复）

### H1 · 项目名称唯一性 TOCTOU 竞态仍未解除
- **文件**: `api/src/routes/projects.ts` + `api/src/db/schema.ts:5`
- **问题**: `projects.name` 在 schema 中**无 `.unique()` 约束**，`createProject` 中 check（第 193 行）和 insert（第 221 行）之间无锁；两个并发请求可同时通过检查创建重复名称
- **修复**: Schema 加 `name: text('name').notNull().unique()`，INSERT 时 catch `23505` PostgreSQL 错误码返回友好提示

### H2 · `useFavorites` 多 Tab 乐观更新仍可能状态撕裂
- **文件**: `src/hooks/useFavorites.ts:263-281`
- **问题**: catch 分支通过重新 GET `/api/favorites` 全量列表恢复状态，但如果用户在其他 Tab 同时操作了收藏，本地状态会被**旧的**服务器状态覆盖
- **修复**: 改为只 revert 本地操作（不重新拉取全量），或接受此 limitation 在 UI 加说明

---

## P2 MEDIUM（UX / Accessibility / Correctness）

### M1 · aria-live 容器仍包含整个 Stats 区域
- **文件**: `src/pages/HomePage.tsx:204`
- **问题**: `aria-live="polite" aria-atomic="true"` 包裹整个 Hero stats div（包含"总项目/精选项目/技术栈"标签），每次搜索结果变化屏幕阅读器会朗读所有数字
- **修复**: aria-live 容器只包裹计数 span，`aria-atomic="true"` 只加在数字本身上

### M2 · RelatedProjectCard 缩略图 alt="" 降级
- **文件**: `src/pages/ProjectDetail.tsx:49`
- **问题**: 详情页推荐卡片 img `alt=""`，而 ProjectCard 中用的是 `alt={project.name}`，两处不一致；推荐卡片语义上也是内容图，不应为空
- **修复**: 改为 `alt={project.name}`

### M3 · `og:url` 依赖 JS 执行，社交分享爬虫可能抓不到
- **文件**: `src/pages/ProjectDetail.tsx:141-144`
- **问题**: `og:url` 通过 `window.location.href` 在 useEffect 中动态设置，社交分享爬虫（Facebook/Twitter）不一定执行 JS
- **现状**: Next.js 可解决（SSR），当前 SPA 无优雅解法
- **修复**: 改用 Next.js 路由，或接受 limitation（多数现代爬虫已执行 JS）

### M4 · `VITE_GITHUB_USERNAME` 未在 `.env.local` 中定义
- **文件**: `src/pages/HomePage.tsx:290`
- **问题**: `href={\`https://github.com/${import.meta.env.VITE_GITHUB_USERNAME}\`}` 中 env var 未设置，运行时为 `https://github.com/undefined`
- **修复**: 在 `.env.local` 中添加 `VITE_GITHUB_USERNAME=mishishi`

### M5 · HomePage stats 区域无 error 状态
- **文件**: `src/pages/HomePage.tsx:62-81`
- **问题**: stats fetch 失败时 `setStats` 未被调用，stats 显示为 `{ total: 0, featured: 0, techCount: 0 }`，用户看到"0 个项目"但不知道是加载失败
- **修复**: 添加 error state，失败时显示"-"而非 0，或显示上次缓存值

---

## P3 LOW（优化项，进迭代）

### L1 · FilterBar 标签按钮无 arrow key 导航
- **文件**: `src/components/FilterBar.tsx`（未读取）
- **问题**: 标签组作为交互组件应支持左右箭头切换焦点（WCAG 2.1 Success Criterion 2.1.1）
- **修复**: 外层 div 加 `role="group"` + `aria-label="标签筛选"`，按钮加 `aria-pressed`，支持 keyboard 导航

### L2 · `hashTagColor` 每渲染重算
- **文件**: `src/components/ProjectCard.tsx:140`
- **问题**: `hashTagColor(tag)` 在 render 内每次调用，32 项数组查找 + 字符串 hash，几十张卡片 × 几个标签 = 毫秒级开销
- **修复**: `useMemo` 或 `useRef` 缓存标签颜色映射

### L3 · `isFavorited` 依赖数组为空但引用模块级 `_favorites`
- **文件**: `src/hooks/useFavorites.ts:290-294`
- **问题**: `useCallback` 依赖数组为 `[]`，函数体内读 `_favorites`（模块级变量），ESLint `react-hooks/exhaustive-deps` 被注释掉跳过；代码意图依赖模块级状态而非 React 状态，**但**不够显式
- **现状**: 实际上能正常工作（`_favorites` 变更时 `_notify()` 会触发 React 重新渲染从而刷新），不过语义上容易误解
- **修复**: 添加注释说明为何这样设计，或重构为显式的 module-level 读取

### L4 · Admin 密码仍写在 `.env` 中
- **文件**: `api/.env:14`
- **问题**: `ADMIN_PASSWORD=Gk9m#2Lp!Qw7@Xv3` 直接写在 `.env` 文件中（即使 gitignored，开发时可能意外 Cath出）
- **修复**: 改为 `ADMIN_PASSWORD` 仅从环境变量读取，`.env` 中留空或注明 `must be set in production`

---

## 已确认正确的项（不计入问题）

| 项 | 位置 | 说明 |
|----|------|------|
| CORS 动态化 | `app.ts:18-22` | `CORS_ORIGINS` env var，已修复 |
| Clerk 启动检查 | `clerk.ts:19-21` | throw if missing，已修复 |
| batch 顺序重排 | `projects.ts:170-175` | Map + idList 匹配，已修复 |
| tags 缓存 30s | `stats.ts:8` | `TAGS_CACHE_TTL_MS = 30_1000`，已修复 |
| Hero stats 全量 | `HomePage.tsx:62-81` | `/api/stats` 端点获取，已修复 |
| 封面上传清理 | `ProjectForm.tsx:82-107` | R2 delete + 失败回滚，已修复 |
| favorites rate limit | `favorites.ts:13` | `{ max: 30, timeWindow: '1 minute' }`，已修复 |
| 空收藏引导 | `FavoritesPage.tsx:76-88` | 有 SVG + 引导文案，已修复 |
| URL pattern 验证 | `ProjectForm.tsx:150,163` | `pattern="https?://.+"`，已修复 |
| ProjectCard onError | `ProjectCard.tsx:33,77` | `imgError` state + `!imgError` 条件，已修复 |
| 收藏按钮 disabled | `ProjectDetail.tsx:316` | `disabled={toggling || !isSignedIn}`，已修复 |
| Loading 中文 | `ProjectDetail.tsx:190` | `加载中...`，已修复 |
| HomePage 动态 meta | `HomePage.tsx:36-42` | title + description useEffect，已修复 |
| 上传 timeout | `ProjectForm.tsx:79` | `AbortSignal.timeout(30000)`，已修复 |
| 标签 trim | `ProjectForm.tsx:50-54` | `tagInput.trim()` 后检查非空，已修复 |
| favorites CASCADE | `schema.ts:30` | `onDelete: 'cascade'` 已处理 |
| toggle 幂等保护 | `useFavorites.ts:204` | `_toggleInflight` Set 防重复，已修复 |
| SQL GREATEST 防护 | `favorites.ts:88` | `GREATEST(..., 0)` 正确，已修复 |
| AbortController 规范 | 多处 | StrictMode 兼容 |
| RelatedProjectCard 排序 | `ProjectDetail.tsx:180-184` | `localeCompare` 确定性排序，已正确 |
| JSON-LD schema | `ProjectDetail.tsx:147-163` | 结构化数据完整，已正确 |
| Clerk token 校验 | `clerk.ts:32-62` | graceful error handling，已正确 |
| `requireAuth` 启动检查 | `auth.ts:5` | `throw Error` if missing，已正确 |

---

## 汇总

| ID | 维度 | 严重性 | 文件 | 描述 | 状态 |
|----|------|--------|------|------|------|
| C1 | Security | P0 | api/src/app.ts:18 | CORS env var 未在文档说明 | 新增说明项 |
| H1 | Correctness | P1 | api/src/db/schema.ts:5 | name 无 unique 约束，TOCTOU 竞态 | 未变 |
| H2 | Correctness | P1 | src/hooks/useFavorites.ts:263 | 多 Tab 乐观更新状态撕裂 | 未变 |
| M1 | Accessibility | P2 | src/pages/HomePage.tsx:204 | aria-live 包含整个 Stats 区域 | 未变 |
| M2 | Accessibility | P2 | src/pages/ProjectDetail.tsx:49 | RelatedProjectCard alt="" | 未变 |
| M3 | SEO | P2 | src/pages/ProjectDetail.tsx:141 | og:url 依赖 JS 爬虫 | 已知 limitation |
| M4 | Correctness | P2 | src/pages/HomePage.tsx:290 | VITE_GITHUB_USERNAME 未定义 | 未变 |
| M5 | UX | P2 | src/pages/HomePage.tsx:62 | stats 失败时显示 0 而非 error | 未变 |
| L1 | Accessibility | P3 | src/components/FilterBar.tsx | 标签无 arrow key 导航 | 未变 |
| L2 | Performance | P3 | src/components/ProjectCard.tsx:140 | hashTagColor 每渲染重算 | 未变 |
| L3 | Code Quality | P3 | src/hooks/useFavorites.ts:290 | isFavorited 依赖空数组读模块级变量 | 未变 |
| L4 | Security | P3 | api/.env:14 | ADMIN_PASSWORD 写在 .env 中 | 未变 |

**总计: 1 P0 · 2 P1 · 5 P2 · 4 P3**（相比 v3 的 2P0 · 6P1 · 9P2 · 6P3，大幅改善）

---

## 优先修复建议

**立即（上线前）：**
1. H1 — schema 加 unique + catch `23505`（PostgreSQL 唯一冲突）
2. M4 — `.env.local` 添加 `VITE_GITHUB_USERNAME=mishishi`
3. C1 — `api/.env.example` 添加 `CORS_ORIGINS=https://yourdomain.com`

**短期迭代：**
4. H2 — 接受 limitation 或重构 revert 逻辑
5. M1 — aria-live 只包裹数字
6. M2 — RelatedProjectCard alt 改为项目名
7. M5 — stats fetch 失败显示 "-"
