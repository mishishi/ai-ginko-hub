# 评论系统 — Utterances 集成设计

> **目标：** 用 GitHub Discussions 作为后端，为每个项目提供真实评论功能

## 仓库准备

- 新建 GitHub 仓库 `mishishi/ginko-hub-comments`
- 仓库设置中开启 **Discussions**（Settings → Features → ☑ Discussions）

## Architecture

```
ProjectDetail.tsx
  └── <CommentsSection projectId={id} />
        └── <script> utterances client.js
              → api.github.com/repos/mishishi/ginko-hub-comments/discussions
```

**Discussion 映射规则：**
```
project.id = "abc-123"  →  Discussion 标题 = "project-abc-123"
```

前缀 `project-` 用于和其他用途的 discussions 区分。

## 组件设计

### `src/components/CommentsSection.tsx`

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

**样式说明：**
- 外层容器 `bg-bg-card border-border rounded-xl p-6` 与站点卡片风格一致
- `theme="github-dark"` 匹配当前暗色主题

## 迁移步骤

1. 创建 `src/components/CommentsSection.tsx`
2. 在 `ProjectDetail.tsx` 中：
   - 导入 `CommentsSection`
   - 删除评论占位 `<section aria-labelledby="comments-heading">...</section>`
   - 替换为 `<CommentsSection projectId={id} />`

## 依赖项

无新增依赖。 utterances 通过 CDN 加载，无需 npm 包。

## 已排除的误报

- utterances 白屏问题（国内部分用户可能无法访问 utterances.github.io）— 监控观察，不做预判处理
- 访客必须有 GitHub 账号 — 产品决策，接受此限制
