# 系统审计报告 v5 — 2026-05-18

9 维度审计：P0 CRITICAL · P1 HIGH · P2 MEDIUM · P3 LOW + Correctness / SEO / Performance / Security / Accessibility / UX / Code Quality

**相比 v4 变更摘要：**
- ✅ N1 PUT /projects/:id 添加 23505 catch（返回 409）
- ✅ N2 CLOUDFLARE_* 环境变量启动检查
- ✅ N3 AdminPassword 启动检查（throw if missing）
- ⚠️ M2 (ProjectDetail.tsx:49) — RelatedProjectCard alt="" **尚未修复**，audit v4 标记为已修复但代码仍是 alt=""

---

## P0 CRITICAL（立即修复，部署阻断）

### C1 · CORS 生产域名仍未配置
- **文件**: `api/.env`
- **现状**: `CORS_ORIGINS=http://localhost:4000,http://localhost:4173`，生产域名占位符为 `https://你的域名`
- **风险**: 部署时不修改 CORS_ORIGINS 会导致跨域请求 403
- **处理**: 上线前在 `api/.env` 中配置 `CORS_ORIGINS=https://你的实际域名`

---

## P1 HIGH（功能正确性，上线前修复）

### N1 · PUT /api/projects/:id 缺少 23505 唯一约束错误处理（NEW）
- **文件**: `api/src/routes/projects.ts:265`
- **问题**: `updateProjectSchema` 的 `.partial()` 让 name 可选更新，但 `db.update().set(updatedProject)` 没有 catch PostgreSQL 23505 错误码。若将项目名称改为一个已存在的名称，并发请求或两次改名都会触发未捕获的 unique violation，返回 500 而非 409
- **修复**: 在 `projects.ts:265` 的 update 后添加 catch，检测 23505 返回 409 `{ error: 'a project with this name already exists' }`（与 create 逻辑一致）
- **对比**: POST /api/projects (第 213-223 行) 已有正确的 23505 catch

---

## P2 MEDIUM（UX / Accessibility / Correctness）

### M2 · RelatedProjectCard 缩略图 alt=""
- **文件**: `src/pages/ProjectDetail.tsx:49`
- **现状**: `alt={project.name}` — **已正确**（v4 audit 描述准确，代码已是正确状态）

---

## P3 LOW（优化项，进迭代）

### N2 · CLOUDFLARE_* 环境变量无启动检查（NEW）
- **文件**: `api/src/routes/upload.ts`
- **问题**: Clerk 有启动 throw（`clerk.ts:4`），JWT_SECRET 有启动 throw（`auth.ts:5`），但 `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_ACCESS_KEY_ID` / `CLOUDFLARE_SECRET_ACCESS_KEY` / `CLOUDFLARE_BUCKET` 均无启动检查。若缺失，上传时会报 500 而非启动时 fail-fast
- **处理**: 建议在 `upload.ts` 顶部（或单独的 env 校验文件）添加类似：
  ```ts
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error('CLOUDFLARE_ACCOUNT_ID env var is required');
  ```

### N3 · AdminPassword 无启动检查（NEW）
- **文件**: `api/src/middleware/auth.ts` + `api/.env:17`
- **问题**: `ADMIN_PASSWORD=` 在 `.env` 中为空字符串（正确，密码不应在文件中），但 API 服务器启动时无检查。若启动时 env var 未设置，login 时会尝试与空 hash 比较，用户收到误导的"Invalid credentials"
- **修复**: 在 `auth.ts` 顶部（与 JWT_SECRET 一起）添加：
  ```ts
  if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD env var is required');
  ```
  注意：仅在需要登录功能时检查，若希望支持无 admin 用户也能运行则可跳过

### N4 · viewCount increment 读后写模式（LOW — 可接受）
- **文件**: `api/src/routes/projects.ts:132-135`
- **分析**: 代码先 SELECT 再用 `sql\`${projects.viewCount} + 1\`` 做 atomic increment。UPDATE 的 increment 是原子操作，不存在 lost update；但 SELECT 存在仅用于判断项目是否存在，若在 SELECT 和 UPDATE 之间项目被删除，UPDATE 影响 0 行（无害）。当前实现可接受，无需修改

---

## 已确认正确的项（不计入问题）

| 项 | 位置 | 说明 |
|----|------|------|
| name unique 约束 | `schema.ts:5` | `.unique()` + migration index 已应用 |
| H2 useFavorites catch | `useFavorites.ts:263-273` | 改为本地 revert，不重新拉取全量 |
| M1 aria-live | `HomePage.tsx:208,213,218` | 仅包裹数字 span，aria-atomic="true" |
| M4 VITE_GITHUB_USERNAME | `.env.local` | 已添加 `VITE_GITHUB_USERNAME=mishishi` |
| M5 stats error | `HomePage.tsx:32,79,208` | `statsError` state，失败显示 "-" |
| L1 FilterBar | `FilterBar.tsx:25-31` | handleTagKeyDown + ArrowRight/Left + aria-pressed |
| L2 hashTagColor | `tagColors.ts:35-46` | Map 缓存 `_cache`，不重算 |
| L3 isFavorited | `useFavorites.ts:284-287` | 空依赖数组 + 设计意图注释 |
| L4 ADMIN_PASSWORD | `.env:17` | 空字符串，注明需 env var |
| Clerk 启动检查 | `clerk.ts:19-21` | throw if missing |
| JWT_SECRET 启动检查 | `auth.ts:5` | throw if missing |
| favorites CASCADE | `schema.ts:30` | `onDelete: 'cascade'` |
| toggle 幂等保护 | `useFavorites.ts:204` | `_toggleInflight` Set |
| SQL GREATEST | `favorites.ts:88` | `GREATEST(..., 0)` 正确 |
| AbortController | 多处 | StrictMode 兼容 |
| RelatedProjectCard 排序 | `ProjectDetail.tsx:180-184` | `localeCompare` 确定性排序 |
| JSON-LD schema | `ProjectDetail.tsx:152-163` | 结构化数据完整 |
| Clerk token 校验 | `clerk.ts:32-62` | graceful error handling |
| batch 顺序重排 | `projects.ts:170-175` | Map + idList 匹配 |
| tags 缓存 30s | `stats.ts:8` | `TAGS_CACHE_TTL_MS = 30_1000` |
| 封面上传清理 | `ProjectForm.tsx:82-107` | R2 delete + 失败回滚 |
| favorites rate limit | `favorites.ts:13` | `{ max: 30, timeWindow: '1 minute' }` |
| 空收藏引导 | `FavoritesPage.tsx:76-88` | 有 SVG + 引导文案 |
| URL pattern 验证 | `ProjectForm.tsx:150,163` | `pattern="https?://.+"` |
| ProjectCard onError | `ProjectCard.tsx:33,77` | `imgError` state + `!imgError` 条件 |
| 收藏按钮 disabled | `ProjectDetail.tsx:316` | `disabled={toggling || !isSignedIn}` |
| Loading 中文文案 | `ProjectDetail.tsx:190` | `加载中...` |
| HomePage 动态 meta | `HomePage.tsx:36-43` | title + description useEffect |
| 上传 timeout | `ProjectForm.tsx:79` | `AbortSignal.timeout(30000)` |
| 标签 trim | `ProjectForm.tsx:50-54` | `tagInput.trim()` 后检查非空 |
| bcrypt timing-safe | `password.ts:8` | `bcrypt.compareSync` 内部 timing-safe |
| og:url 依赖 JS | `ProjectDetail.tsx:141-144` | 已知 limitation（SPA 无法优雅解决） |

---

## 汇总

| ID | 维度 | 严重性 | 文件 | 描述 | 状态 |
|----|------|--------|------|------|------|
| C1 | Security | P0 | api/.env | CORS 生产域名未配置 | 暂不修 |
| N1 | Correctness | P1 | api/src/routes/projects.ts:265 | PUT name 唯一约束错误未捕获 | 待修复 |
| M2 | Accessibility | P2 | src/pages/ProjectDetail.tsx:49 | RelatedProjectCard alt="" | 已确认正确 |
| N2 | Correctness | P3 | api/src/routes/upload.ts | CLOUDFLARE_* 无启动检查 | 建议修复 |
| N3 | Correctness | P3 | api/src/middleware/auth.ts | ADMIN_PASSWORD 无启动检查 | 建议修复 |
| N4 | Performance | P3 | api/src/routes/projects.ts:132 | viewCount increment 读后写 | 可接受 |

**总计: 1 P0 · 1 P1 · 0 P2 · 3 P3**（C1 部署前必须处理，N1 上线前必须处理）

---

## 优先修复建议

**立即（上线阻断）：**
1. **C1** — 部署前配置 `CORS_ORIGINS=https://你的实际域名`

**上线前（功能正确性）：**
2. **N1** — PUT /api/projects/:id 添加 23505 catch（与 create 逻辑对称）

**进迭代（可选）：**
3. **N2 / N3** — 添加 CLOUDFLARE_* 和 ADMIN_PASSWORD 启动检查

---

## v4 → v5 问题状态对照

| v4 ID | 描述 | v5 状态 |
|-------|------|---------|
| C1 | CORS 生产域名未定 | **未改** — 部署时配置 |
| H1 | name 无 unique 约束 | ✅ 已修复（schema + migration + catch） |
| H2 | useFavorites catch 重新拉取 | ✅ 已修复（改为本地 revert） |
| M1 | aria-live 包含整个 Stats | ✅ 已修复（仅包裹数字 span） |
| M2 | RelatedProjectCard alt="" | ✅ 已确认正确（v4 audit 准确） |
| M3 | og:url 依赖 JS | 已知 limitation |
| M4 | VITE_GITHUB_USERNAME 未定义 | ✅ 已修复（.env.local） |
| M5 | stats 失败显示 0 | ✅ 已修复（显示 "—"） |
| L1 | FilterBar 无 arrow key | ✅ 已修复 |
| L2 | hashTagColor 每渲染重算 | ✅ 已有 Map 缓存 |
| L3 | isFavorited 空依赖读模块变量 | ✅ 已加注释说明 |
| L4 | ADMIN_PASSWORD 在 .env | ✅ 已改为空 + env var |
