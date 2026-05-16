# 系统审计报告 — 2026-05-17

## 概述

对 AI Ginko Hub 进行全面审计，覆盖产品功能、UX 设计、页面布局、后端/API、代码质量、性能、SEO、无障碍 8 个维度，共识别约 45 个问题。

---

## 一、产品/功能 (Product/Functionality)

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| P-1 | **评论功能是占位符**，无实际功能 | 中 | `src/pages/ProjectDetail.tsx` |
| P-2 | **About 页使用硬编码数据**（项目数=10、精选=4、allTags 数组） | 高 | `src/pages/About.tsx` |
| P-3 | **社交链接为假链接**（github.com/ginko、x.com/ginko） | 中 | `src/pages/About.tsx` |
| P-4 | **无分页/无限滚动**，项目增多后影响性能 | 中 | `src/pages/HomePage.tsx` |
| P-5 | **无收藏功能**，用户无法保存感兴趣的项目 | 低 | — |
| P-6 | **无 404 页面**，未找到项目时体验不友好 | 低 | — |
| P-7 | **无错误 toast 提示**，操作失败时用户无感知 | 中 | — |

---

## 二、UX/UI 设计

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| U-1 | **ProjectCard 缩略图 alt=""**，无障碍-alt 文本缺失 | 高 | `src/components/ProjectCard.tsx:40` |
| U-2 | **About 页 h1 层级不合理**，只有一个 h1 但内容结构不清晰 | 中 | `src/pages/About.tsx` |
| U-3 | **内联 style 色值**，如 `style={{ backgroundColor: '#f3f4f6' }}`，应使用 Tailwind 令牌 | 中 | 多个组件 |
| U-4 | **卡片 hover 阴影过重**，在深色背景上影响可读性 | 低 | `src/components/ProjectCard.tsx` |
| U-5 | **搜索输入框较窄**，在宽屏上显得不协调 | 低 | `src/components/Header.tsx` |
| U-6 | **无面包屑导航**，在详情页/编辑页用户难以理解当前位置 | 低 | `src/pages/ProjectDetail.tsx` |
| U-7 | **favicon 未定制**，使用浏览器默认 | 低 | `index.html` |

---

## 三、页面布局

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| L-1 | **Hero 区域平淡**，数据展示与首页分离，视觉冲击不足 | 低 | `src/pages/HomePage.tsx` |
| L-2 | **详情页缩略图布局不合理**，左侧大图右侧信息不符合移动端习惯 | 中 | `src/pages/ProjectDetail.tsx` |
| L-3 | **搜索框和 FilterBar 区域重叠**，两者同时存在时视觉混乱 | 低 | `src/pages/HomePage.tsx` |
| L-4 | **Footer 内容单薄**，仅有版权信息 | 低 | `src/App.tsx` |

---

## 四、后端/API

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| B-1 | **Math.random() 生成 ID**（安全风险，应使用 uuid） | 高 | `api/src/routes/projects.ts` |
| B-2 | **JWT 存 localStorage**（XSS 风险，应使用 httpOnly cookie） | 高 | `src/admin/contexts/AdminAuthContext.tsx` |
| B-3 | **无 API 限流**，admin 接口暴露在公网 | 中 | `api/src/routes/admin.ts` |
| B-4 | **viewCount 未 await saveDb**（更新可能丢失） | 中 | `api/src/routes/projects.ts` |
| B-5 | **CORS 仅允许 localhost**（部署后需修改） | 中 | `api/src/index.js` |
| B-6 | **无数据库迁移工具**，生产环境更新 schema 困难 | 低 | `api/src/db/` |

---

## 五、代码质量

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| C-1 | **Project 类型不完整**，缺少 viewCount、ogTitle、ogDescription、ogImage 字段 | 高 | `src/types/index.ts` |
| C-2 | **About 页硬编码 allTags 数组**，24 个标签与实际数据不同步 | 高 | `src/pages/About.tsx` |
| C-3 | **搜索前后端不一致**：HomePage 前端也筛标签但 API 只收 q 参数 | 中 | `src/data/projects.ts` vs `HomePage.tsx` |
| C-4 | **repoUrl 字段未使用**，但存在于 schema 和类型中 | 低 | `src/types/index.ts` |

---

## 六、性能

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| P-1 | **无分页/无限滚动**，大数据集一次性加载 | 中 | `src/data/projects.ts` |
| P-2 | **缩略图无懒加载**，首屏外图片即时请求 | 中 | `src/components/ProjectCard.tsx` |
| P-3 | **无 WebP 格式**，未利用现代图片格式 | 低 | `src/components/ProjectForm.tsx` |
| P-4 | **无 HTTP 缓存头**，静态资源无缓存策略 | 低 | `api/src/index.js` |

---

## 七、SEO

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| S-1 | **html 无 lang 属性**，应为 `lang="zh-CN"` | 中 | `index.html` |
| S-2 | **og-default.png 不存在**，OG 默认图配置错误 | 中 | `index.html` |
| S-3 | **无 robots.txt 和 sitemap.xml** | 低 | — |
| S-4 | **无 Twitter OG 标签**（twitter:card 等） | 低 | `index.html` |
| S-5 | **无 JSON-LD 结构化数据** | 低 | — |
| S-6 | **ProjectCard alt="" 影响搜索索引** | 中 | `src/components/ProjectCard.tsx` |

---

## 八、无障碍 (Accessibility)

| # | 问题 | 严重程度 | 文件 |
|---|------|----------|------|
| A-1 | **详情页只有一个 h1**，heading 层级不完整 | 低 | `src/pages/ProjectDetail.tsx` |
| A-2 | **焦点顺序未测试**，键盘导航可能不顺畅 | 低 | 多个页面 |
| A-3 | **颜色对比度未验证**，部分文字可能不满足 WCAG AA | 低 | 多个组件 |

---

## 修复优先级建议

### P0（立即修复）
- B-1: Math.random() ID → 改用 uuid
- B-2: JWT localStorage → httpOnly cookie
- C-1: Project 类型补全字段
- U-1: ProjectCard alt="" → 改为项目名称

### P1（下个迭代）
- P-2: About 页接 API
- P-3: 社交链接改为真实地址或移除
- S-1: html lang="zh-CN"
- B-4: viewCount await saveDb

### P2（逐步改进）
- P-4 / P-1: 添加分页
- C-3: 搜索逻辑统一
- P-6: 添加 404 页面
- U-2: About 页 heading 结构

---

## 下次审计计划

建议按季度或重大功能发布后进行系统审计，持续跟踪问题修复进度。
