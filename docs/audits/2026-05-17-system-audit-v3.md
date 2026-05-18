# 系统审计报告 v3 — 2026-05-17

8 维度审计：P0 CRITICAL · P1 HIGH · P2 MEDIUM · P3 LOW + Correctness / SEO / Performance

---

## P0 CRITICAL（立即修复，部署阻断）

### C1 · CORS 硬编码 localhost，生产部署 API 请求全挂
- **文件**: `api/src/app.ts:20-23`
- **问题**: `origin` 仅包含 `localhost:4000` / `localhost:4173`，部署到任何公网域名时浏览器会拒绝跨域，API 请求 100% 失败
- **现状**: 代码中已有 `TODO(P0-4): 生产环境需从环境变量动态读取`
- **修复**: `origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4000']`
- **严重性**: 部署即故障，阻断级

### C2 · CLERK_SECRET_KEY 未定义时静默 401，不报错
- **文件**: `api/src/middleware/clerk.ts:34`
- **问题**: `verifyToken` 内部使用未定义的 `CLERK_SECRET_KEY`，Clerk SDK 会静默返回 401，所有带 Clerk token 的请求全部失败，用户无任何报错提示
- **对比**: `auth.ts:5` 会 `throw Error` 检查 JWT_SECRET
- **修复**: 启动时检查或 `requireClerkAuth` 头部加 `if (!process.env.CLERK_SECRET_KEY) throw new Error(...)`
- **严重性**: 配置遗漏时所有收藏/个人中心接口静默挂掉

---

## P1 HIGH（功能正确性，上线前修复）

### H1 · 项目名称唯一性检查存在 TOCTOU 竞态
- **文件**: `api/src/routes/projects.ts:189-198`
- **问题**: Check（第 193 行）和 Insert（第 221 行）之间无锁，两个并发请求可能同时通过检查，创建重复名称项目
- **修复**: DB 层加唯一约束 `unique()` 在 name 字段，catch `23505` PostgreSQL 唯一冲突错误

### H2 · `/api/projects/batch` 响应顺序与请求 ID 顺序不一致
- **文件**: `api/src/routes/projects.ts:170-175`
- **问题**: 分块查询结果 `rows.push(...chunkRows)` 保留了 DB 返回顺序，不一定与 `idList` 顺序一致。前端 `FavoritesPage.tsx:45` 直接赋值 `data.projects`，用户收藏的卡片顺序会随机抖动
- **修复**: 结果按 `idList` 顺序重排后再返回

### H3 · stats 缓存 TTL 5 分钟内新增项目标签不可见
- **文件**: `api/src/routes/stats.ts:8`
- **问题**: `_tagsCache` TTL 5 分钟，新增项目的标签在这期间不会出现在 FilterBar 的标签列表里
- **影响**: 用户看到空 FilterBar 或标签缺失，需要等 5 分钟
- **修复**: TTL 降低到 30 秒，或在 POST projects 时主动失效缓存

### H4 · HomePage Hero 统计数据仅基于首页 12 条数据，非全量
- **文件**: `src/pages/HomePage.tsx:141-142`
- **问题**: `featuredCount` 和 `allTags` 从已加载的 12 条项目计算，不是全量。用户浏览越多页，数字越准确，但首页展示偏低/偏少
- **影响**: 首页 Hero 区显示的"总项目 / 精选项目 / 技术栈"数字与实际不符
- **修复**: 改用 `/api/stats` 端点获取真实全量数字

### H5 · ProjectForm 封面上传失败时无清除，且无 R2 delete 接口
- **文件**: `src/admin/components/ProjectForm.tsx:61-83`
- **问题**: `handleThumbnailUpload` catch 中只 toast 错误，用户重试失败后无法清除已设置的 thumbnail；R2 没有 delete 接口，thumbnail 一旦设置就无法删除
- **修复**: 提供 R2 delete 接口；上传失败时清空 thumbnail 字段

### H6 · `useFavorites` 乐观更新在多 Tab 场景可能状态撕裂
- **文件**: `src/hooks/useFavorites.ts:262-281`
- **问题**: catch 分支重新 fetch `/api/favorites` 全量列表恢复状态，但如果用户在其他 Tab 同时操作了收藏，本地状态会被覆盖为旧的服务器状态
- **影响**: 多 Tab 场景下收藏状态可能短暂不一致

### H7 · favorites 路由无独立 rate limit
- **文件**: `api/src/routes/favorites.ts:32-64`
- **问题**: 全局 100 req/min 的 rate limit 对 favorites 路径没有差异化保护，高频收藏/取消操作可能影响其他用户
- **修复**: 对 favorites 路由单独配置更严格的 limit（如 30 req/min）

---

## P2 MEDIUM（UX / Accessibility / Correctness）

### M1 · FavoritesPage 空收藏状态无引导 UI
- **文件**: `src/pages/FavoritesPage.tsx:30-35`
- **问题**: 当 `favorites.length === 0` 时直接显示空 ProjectGrid，没有"去收藏几个项目"的引导文案

### M2 · HomePage 搜索时 aria-live 会朗读整个项目列表
- **文件**: `src/pages/HomePage.tsx:173`
- **问题**: `aria-live="polite"` + `aria-atomic="true"` 容器包含整个项目列表 div，每次搜索结果变化，屏幕阅读器用户会听到每个项目名称的完整播报
- **修复**: aria-live 容器只包裹结果计数元素，移除 aria-atomic

### M3 · RelatedProjectCard 缩略图 alt="" 降级
- **文件**: `src/pages/ProjectDetail.tsx:47`
- **问题**: 详情页推荐卡片缩略图 alt=""，而 ProjectCard 中用的是 `alt={project.name}`，两处不一致

### M4 · ProjectForm URL 字段无格式验证
- **文件**: `src/admin/components/ProjectForm.tsx:119-126`
- **问题**: `type="url"` 但无 `pattern` 或 `onBlur` 校验，空字符串可提交

### M5 · ProjectCard 缩略图无 onError 降级
- **文件**: `src/components/ProjectCard.tsx:70-78`
- **问题**: `<img>` 无 `onError` 处理，R2 链接失效时显示破图

### M6 · ProjectDetail 收藏按钮无 disabled 状态
- **文件**: `src/pages/ProjectDetail.tsx:295-309`
- **问题**: `handleToggleFavorite` 是 async，但按钮没有 `disabled={toggling}`，用户可在处理中重复点击

### M7 · ProjectDetail 加载状态文案硬编码英文
- **文件**: `src/pages/ProjectDetail.tsx:171`
- **问题**: `Loading...` 是英文，UI 其他部分全部中文

### M8 · HomePage 缺少动态 meta description
- **文件**: `src/pages/HomePage.tsx`
- **问题**: `<title>` 和 `<meta name="description">` 始终是 index.html 的静态值，无 useEffect 更新，搜索爬虫抓不到

### M9 · og:url 依赖 JS 爬虫可能不执行
- **文件**: `index.html:22-27`
- **问题**: 依赖内联脚本 `window.location.origin` 实时设置，但社交分享爬虫（Facebook、Twitter）不一定执行 JS

---

## P3 LOW（优化项，进迭代）

### L1 · Footer GitHub 用户名硬编码
- **文件**: `src/pages/HomePage.tsx:261`
- **问题**: `https://github.com/mishishi` 写死，应为环境变量

### L2 · 图片上传 PUT 请求无超时
- **文件**: `src/admin/components/ProjectForm.tsx:71-75`
- **问题**: PUT to presignedUrl 无 timeout，网络慢时 fetch 无限挂起
- **修复**: `{ signal: AbortSignal.timeout(30000) }`

### L3 · 批量获取项目无请求超时
- **文件**: `src/pages/FavoritesPage.tsx:41-57`
- **问题**: `fetch(...).then(...)` 无 AbortSignal timeout
- **修复**: 30 秒 timeout via `AbortSignal.timeout()`

### L4 · 标签 enter 键可添加空标签
- **文件**: `src/admin/components/ProjectForm.tsx:168`
- **问题**: `onKeyDown` 处理 Enter 添加标签，但如果 input 里全是空格也会添加成功
- **修复**: trim 后检查非空

### L5 · `hashTagColor` 每渲染重算
- **文件**: `src/components/ProjectCard.tsx:140`
- **问题**: `hashTagColor(tag)` 在 render 内每次调用，32 项数组查找 + 字符串 hash，几十张卡片 × 几个标签 = 毫秒级开销
- **修复**: `useMemo` 或 `useRef` 缓存标签颜色映射

### L6 · FilterBar 标签按钮无 arrow key 导航
- **文件**: `src/components/FilterBar.tsx`（未读取）
- **问题**: 作为已知 Accessibility 问题记录，标签组应支持左右箭头切换焦点

### L7 · HomePage stats 区域无 error 状态
- **文件**: `src/pages/HomePage.tsx`
- **问题**: stats 区域（如 featuredCount）计算基于本地数据，无 error boundary，数据出错时无降级

---

## 已确认正确的项（不计入问题）

| 项 | 位置 | 说明 |
|----|------|------|
| favorites CASCADE delete | schema.ts:30 | `onDelete: 'cascade'` 已处理 |
| navigate replace | FavoritesPage.tsx:22 | `{ replace: true }` 正确 |
| toggle 幂等保护 | useFavorites.ts:203 | `_toggleInflight` Set 防重复 |
| parseTags 单次解析 | projects.ts:108 | 不再需要重复解析 |
| API_BASE localhost 兜底 | lib/api.ts | 已有 fallback |
| Clerk token 校验 | clerk.ts | 有 graceful error handling |
| SQL GREATEST 防护负数 | favorites.ts:92 | `GREATEST(..., 0)` 正确 |
| AbortController 规范 | 多处 | StrictMode 兼容 |
| allTags 静态推导 | HomePage.tsx:142 | 等同于数据来源，正确 |
| RelatedProjectCard id 过滤 | ProjectDetail.tsx:158 | `p.id !== project.id` 正确 |

---

## 汇总

| ID | 维度 | 严重性 | 文件 | 描述 |
|----|------|--------|------|------|
| C1 | Security | P0 | api/src/app.ts:20 | CORS 硬编码 localhost，生产必挂 |
| C2 | Security | P0 | api/src/middleware/clerk.ts:34 | CLERK_SECRET_KEY 未定义静默 401 |
| H1 | Correctness | P1 | api/src/routes/projects.ts:193 | 名称唯一性 TOCTOU 竞态 |
| H2 | Correctness | P1 | api/src/routes/projects.ts:170 | batch 响应顺序与请求不一致 |
| H3 | UX | P1 | api/src/routes/stats.ts:8 | tags 缓存 5 分钟导致新标签不出现 |
| H4 | UX | P1 | src/pages/HomePage.tsx:141 | Hero 统计数据仅基于首页 12 条 |
| H5 | UX | P1 | src/admin/components/ProjectForm.tsx:61 | 封面上传失败无清除，无 R2 delete |
| H6 | Correctness | P1 | src/hooks/useFavorites.ts:262 | 多 Tab 乐观更新状态撕裂 |
| H7 | Security | P1 | api/src/routes/favorites.ts:32 | favorites 无独立 rate limit |
| M1 | UX | P2 | src/pages/FavoritesPage.tsx:30 | 空收藏无引导 UI |
| M2 | Accessibility | P2 | src/pages/HomePage.tsx:173 | aria-live 会朗读整个项目列表 |
| M3 | Accessibility | P2 | src/pages/ProjectDetail.tsx:47 | RelatedProjectCard alt="" |
| M4 | Correctness | P2 | src/admin/components/ProjectForm.tsx:119 | URL 字段无格式验证 |
| M5 | UX | P2 | src/components/ProjectCard.tsx:70 | 缩略图无 onError 降级 |
| M6 | UX | P2 | src/pages/ProjectDetail.tsx:295 | 收藏按钮无 disabled 状态 |
| M7 | UX | P2 | src/pages/ProjectDetail.tsx:171 | Loading 文案英文 |
| M8 | SEO | P2 | src/pages/HomePage.tsx | HomePage 缺动态 meta |
| M9 | SEO | P2 | index.html:22 | og:url 依赖 JS 爬虫可能不执行 |
| L1 | Maintainability | P3 | src/pages/HomePage.tsx:261 | GitHub 用户名硬编码 |
| L2 | Performance | P3 | src/admin/components/ProjectForm.tsx:71 | 上传无 timeout |
| L3 | Performance | P3 | src/pages/FavoritesPage.tsx:41 | batch fetch 无 timeout |
| L4 | UX | P3 | src/admin/components/ProjectForm.tsx:168 | 标签 enter 可添加空标签 |
| L5 | Performance | P3 | src/components/ProjectCard.tsx:140 | hashTagColor 每渲染重算 |
| L6 | Accessibility | P3 | src/components/FilterBar.tsx | 标签无 arrow key 导航 |

**总计: 2 P0 · 6 P1 · 9 P2 · 6 P3**
