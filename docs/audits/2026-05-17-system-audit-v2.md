# 系统审计报告 v2 — 2026-05-17（完整审计）

## 概述

本次审计覆盖产品功能、UX 设计、页面布局、后端/API、代码质量、性能、SEO、无障碍 8 个维度，共识别 21 个问题（不含 CRITICAL #1-2，标记为生产前处理）。

---

## CRITICAL（生产前处理）

| # | 问题 | 严重程度 | 状态 | 文件 |
|---|------|----------|------|------|
| C-1 | `NODE_TLS_REJECT_UNAUTHORIZED=0` 禁用 TLS 验证 | CRITICAL | 生产前处理 | `api/src/index.ts` |
| C-2 | CORS 硬编码 localhost，生产环境需配置 | CRITICAL | 生产前处理 | `api/src/app.ts` |

---

## 一、后端/API

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| B-1 | **DELETE 无 CASCADE**：删除项目后收藏记录未清理 | HIGH | `api/src/routes/projects.ts` |
| B-2 | **/api/projects 全量加载**：内存中过滤 tag/q/featured，应在 SQL 层完成 | HIGH | `api/src/routes/projects.ts` |
| B-3 | **/api/stats 全表扫描**：COUNT/SUM 应在 SQL 层完成 | HIGH | `api/src/routes/projects.ts` |
| B-4 | **/api/tags 全表扫描**：应添加缓存 | HIGH | `api/src/routes/projects.ts` |
| B-5 | **FavoritesPage N+1**：用 `Promise.all` 并发 fetch 每个项目 | HIGH | `src/pages/FavoritesPage.tsx` |

---

## 二、代码质量

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| C-1 | **parseTags 重复定义**：projects.ts 和 ProjectForm.tsx 各有一份 | MEDIUM | `api/src/routes/projects.ts`, `src/admin/components/ProjectForm.tsx` |
| C-2 | **stats 路由无错误处理**：数据库错误时返回 500 但无日志 | MEDIUM | `api/src/routes/projects.ts` |
| C-3 | **项目名无唯一性校验**：重复名称可提交 | MEDIUM | `api/src/routes/projects.ts` |
| C-4 | **上传无文件大小限制**：图片上传可超大文件 | MEDIUM | `api/src/routes/upload.ts` |
| C-5 | **URL 无格式校验**：无效 URL 可保存 | MEDIUM | `api/src/routes/projects.ts` |
| C-6 | **useFavorites StrictMode 问题**：双倍挂载导致并发请求 | MEDIUM | `src/hooks/useFavorites.ts` |
| C-7 | **无 bundle 分割**：admin 路由未做 code splitting | MEDIUM | `src/App.tsx` |
| C-8 | **迁移脚本凭证硬编码**：应使用环境变量 | MEDIUM | `api/src/db/migrations/` |
| C-9 | **Clerk error logging**：生产环境应发送到监控服务 | LOW | `src/admin/contexts/AdminAuthContext.tsx` |

---

## 三、产品/功能

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| P-1 | **评论功能是占位符**：无实际功能 | LOW | `src/pages/ProjectDetail.tsx` |
| P-2 | **navigate replace 模式**：浏览历史被替代，Back 行为不符合预期 | LOW | `src/pages/FavoritesPage.tsx` |

---

## 四、UX/UI 设计

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| U-1 | **ProfilePage 缩略图 alt=""** | LOW | `src/pages/ProfilePage.tsx` |
| U-2 | **ProjectCard 仍有残留 alt=""** | LOW | `src/components/ProjectCard.tsx` |

---

## 五、性能

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| Per-1 | **无 bundle 分割**：admin 路由应 lazy loading | MEDIUM | `src/App.tsx` |

---

## 修复优先级

### P0 — CRITICAL（生产前处理）
- C-1: NODE_TLS_REJECT_UNAUTHORIZED=0 ✅
- C-2: CORS 硬编码 localhost ✅

### P1 — HIGH（立即修复）
- B-1: DELETE 添加 CASCADE 或手动清理 favorites
- B-2: /api/projects 移至 SQL 过滤 + 分页
- B-3: /api/stats 改 SQL 聚合
- B-4: /api/tags 添加缓存
- B-5: FavoritesPage 消除 N+1

### P2 — MEDIUM（逐步修复）
- C-1: parseTags 统一为一份
- C-2: stats 路由添加 try/catch
- C-3: 项目名唯一性校验
- C-4: 上传文件大小限制（5MB）
- C-5: URL 格式校验（zod）
- C-6: useFavorites StrictMode 问题
- C-7: admin bundle 分割
- C-8: 迁移脚本环境变量
- Per-1: 同 C-7

### P3 — LOW（体验优化）
- C-9: Clerk 错误日志
- P-1: 评论功能
- P-2: navigate replace
- U-1: ProfilePage alt
- U-2: ProjectCard alt 残留

---

## 下次审计计划

建议按季度或重大功能发布后进行系统审计，持续跟踪问题修复进度。
