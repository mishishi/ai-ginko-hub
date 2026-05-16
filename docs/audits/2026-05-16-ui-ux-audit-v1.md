# UI/UX Audit Report — v1

**Date:** 2026-05-16
**Auditor:** ui-ux-pro-max skill
**Scope:** HomePage, About, ProjectDetail, Header, FilterBar, ProjectCard, ProjectGrid
**Design System:** Ginko Hub (Portfolio Grid, Motion-Driven style)

---

## Audit Summary

| Category | Result |
|---|---|
| Accessibility | 2 issues → FIXED |
| Animation | 1 issue → FIXED |
| Typography & Color | 2 issues → FIXED |
| Interaction & Cursor | PASS |
| Layout & Responsive | PASS |
| Consistency | 1 issue → FIXED |

**Total: 5 issues — 5 fixed (0 critical, 2 high, 3 medium)**

---

## Issue #1 — prefers-reduced-motion 未应用到 .badge-reveal ✅ FIXED

**Status:** Fixed in `src/index.css`
**Fix:** 在 `prefers-reduced-motion` 媒体查询中添加了 `.badge-reveal` 重置规则。

**Severity:** HIGH
**Category:** Accessibility / Animation
**Files:** `src/index.css:151-155`

### Description

`prefers-reduced-motion` 媒体查询中重置了 `.reveal` 和 `.hero-animate`，但 `.badge-reveal` 的 `translate-y` 动画未被抑制。

当用户开启 `prefers-reduced-motion` 时，精选徽章仍会有一个 300ms 的 `translate-y` 动画（从 `translate-y-[-8px]` 到 `translate-y(0)`），违反无障碍规范。

### Location in CSS

```css
/* index.css:151-155 */
.reveal.visible .badge-reveal {
  opacity: 1;
  transform: translateY(0);
}
```

媒体查询中没有包含 `.badge-reveal` 的重置规则。

### Fix Required

在 `prefers-reduced-motion` 媒体查询中添加：

```css
.badge-reveal {
  opacity: 1 !important;
  transform: none !important;
  transition: none !important;
}
```

---

## Issue #2 — 无 aria-pressed 状态指示 ✅ FIXED

**Status:** Fixed in `src/components/Header.tsx`
**Fix:** 主题切换按钮添加了 `aria-pressed={theme === 'dark'}` 属性。

---

## Issue #3 — 滚动条在 light mode 下背景色不匹配 ✅ FIXED

**Status:** Fixed in `src/index.css`
**Fix:** 为 `[data-theme="light"]` 添加了专用滚动条颜色，覆盖 track 和 thumb。

---

## Issue #4 — About.tsx 硬编码占位内容 ✅ FIXED

**Status:** Fixed in `src/pages/About.tsx`
**Fix:** "Your Name" → "Ginko"，头像缩写 GH → GK，社交链接更新为 `@ginko` 示例账户。

---

## Issue #5 — ProjectDetail 封面区域无实际图片 ✅ FIXED

**Status:** Fixed in `src/pages/ProjectDetail.tsx`
**Fix:** 为所有 10 个项目创建了 SVG 封面图，统一放置在 `public/thumbnails/` 目录下，并在 `ProjectDetail` 页面渲染 `project.thumbnail`（如果存在）。

---

## Verified as Correct ✓

| Rule | Implementation |
|---|---|
| Skip to content link | 所有页面均有 `sr-only focus:not-sr-only` 跳转链接 |
| aria-labels on icon buttons | 所有 SVG icon button 均有 aria-label |
| aria-pressed on filter toggles | FilterBar 按钮正确使用 `aria-pressed` |
| aria-live for dynamic content | HomePage 结果计数使用 `aria-live="polite"` |
| cursor-pointer on interactive cards | ProjectCard 和 RelatedProjectCard 均有 `cursor-pointer` |
| prefers-reduced-motion (core) | `.reveal` 和 `.hero-animate` 已正确处理 |
| Focus ring style | `:focus-visible { outline: 2px solid var(--color-accent) }` |
| Loading skeleton | ProjectGrid 有骨架屏 |
| Empty state | ProjectGrid 有空状态 UI |
| Hover transitions | 卡片 hover 使用 `transition-all duration-300` |
| Keyboard navigation | 所有交互元素可 tab 聚焦，有 Enter/Space 处理 |
| Form labels | LoginPage 表单有 `<label for>` |
| Semantic HTML | 使用 `<main>`, `<nav>`, `<header>`, `<section>` |
| No emoji icons | 所有图标均使用内联 SVG |
| No layout-shifting hovers | hover 使用 `translate` 而非 width/height |

---

## Next Audit Checklist

下次审计开始前，逐一验证以上 5 个问题是否已全部修复，再开始检查新问题。
已修复：Issue #1 ✅ | Issue #2 ✅ | Issue #3 ✅ | Issue #4 ✅ | Issue #5 ✅
