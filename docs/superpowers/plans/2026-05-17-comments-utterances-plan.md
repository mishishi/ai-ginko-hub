# 评论系统 — Utterances 集成实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `ProjectDetail.tsx` 中的评论占位 UI 替换为真实的 utterances 评论区

**Architecture:** 新增 `CommentsSection` 组件，嵌入 utterances CDN 脚本，通过 `project-{id}` 格式的 issue term 映射到 GitHub Discussion

**Tech Stack:** utterances（CDN，无 npm 依赖）

---

## Task 1: 创建 CommentsSection 组件

**Files:**
- Create: `src/components/CommentsSection.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
interface Props {
  projectId: string;
}

export default function CommentsSection({ projectId }: Props) {
  return (
    <section aria-labelledby="comments-heading">
      <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-border">
        <h2 id="comments-heading" className="font-heading text-2xl text-text-primary">
          评论
        </h2>
      </div>
      <div className="bg-bg-card border border-border rounded-xl p-6">
        <script
          src="https://utteranc.es/client.js"
          repo="mishishi/ginko-hub-comments"
          issue-term={`project-${projectId}`}
          theme="github-dark"
          crossOrigin="anonymous"
          async
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit src/components/CommentsSection.tsx`
Expected: 无错误输出

- [ ] **Step 3: Commit**

```bash
git add src/components/CommentsSection.tsx
git commit -m "feat(comments): add CommentsSection component with utterances"
```

---

## Task 2: 替换 ProjectDetail.tsx 中的评论占位

**Files:**
- Modify: `src/pages/ProjectDetail.tsx` — 删除评论占位 section，导入并使用 CommentsSection

- [ ] **Step 1: 在文件顶部添加 import**

在 `ProjectDetail.tsx` 顶部找到其他 component import，添加：

```tsx
import CommentsSection from '../components/CommentsSection';
```

- [ ] **Step 2: 找到评论占位区块并删除**

在 `ProjectDetail.tsx` 中找到这段代码（约在 387-405 行）并删除整个 `<section>`：

```tsx
{/* Comments Placeholder */}
<section className="mb-12" aria-labelledby="comments-heading">
  <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-border">
    <h2 id="comments-heading" className="font-heading text-2xl text-text-primary">
      评论
    </h2>
    <span className="text-sm text-text-muted">
      待接入
    </span>
  </div>
  <div className="bg-bg-card border border-border rounded-xl p-8 text-center" role="status" aria-label="评论功能开发中">
    <div className="flex flex-col items-center gap-3">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <p className="text-text-muted text-sm">评论功能正在开发中</p>
    </div>
  </div>
</section>
```

- [ ] **Step 3: 在占位位置插入 CommentsSection**

在删除位置插入：

```tsx
<CommentsSection projectId={id!} />
```

注意：用 `id!` 因为上面已有 `if (!id) return` 的 guard。

- [ ] **Step 4: 验证构建**

Run: `npm run build`
Expected: 编译成功，无错误

- [ ] **Step 5: Commit**

```bash
git add src/pages/ProjectDetail.tsx
git commit -m "feat(comments): replace placeholder with utterances-powered CommentsSection"
```
