# Ginko Hub — AI 项目展示站

## 项目定位

AI 辅助开发的项目合集展示站。本质是一个带筛选/搜索的卡片画廊，每张卡片代表一个独立项目。

## 技术栈

| 层 | 选型 | 注意 |
|----|------|------|
| 框架 | React 19 | — |
| 构建 | Vite 8 | `npm run dev` / `npm run build` |
| 样式 | Tailwind CSS v4 | `@import "tailwindcss"`，无 tailwind.config.js |
| 语言 | TypeScript 6 (strict) | `noUnusedLocals` / `noUnusedParameters` / `verbatimModuleSyntax` |
| 字体 | Playfair Display (heading) + Outfit (body) | Google Fonts 加载 |

## 项目结构

```
src/
├── components/          # UI 组件
│   ├── Header.tsx       # 顶栏：logo + 搜索框
│   ├── FilterBar.tsx    # 标签筛选按钮组
│   ├── ProjectGrid.tsx  # 项目列表网格 (含空状态)
│   └── ProjectCard.tsx  # 单张项目卡片 (含滚动渐入动画)
├── hooks/
│   └── useScrollReveal.ts  # IntersectionObserver 滚动渐入
├── data/
│   └── projects.ts      # 项目数据 + 自动生成的 allTags
├── types/
│   └── index.ts         # Project 接口定义
├── App.tsx              # 主页布局 + 筛选/搜索逻辑 + URL 同步
├── main.tsx             # 入口
└── index.css            # Tailwind + @theme 设计令牌 + 全局样式
```

## 设计令牌 (Tailwind @theme)

不要直接用 `#c97d5c` 等裸色值，一律用 theme 变量：

```
bg-base        #0a0a0c    背景
bg-surface     #121214    表面
bg-elevated    #1a1a1c    抬高层
bg-card        #151518    卡片
bg-card-hover  #1d1d20    卡片悬停

text-primary   #ece8e3    主文字
text-secondary #a8a4a0    次要文字
text-muted     #8a8784    弱化文字

accent         #c97d5c    强调色 (陶土)
accent-dim     #b8704e    强调色暗
accent-glow    rgba(...)  强调色辉光
sage           #7d9a8e    辅助色 (鼠尾草)

border         #2a2a2d    边框
border-hover   #3a3a3d    边框悬停
border-accent  rgba(...)  强调色边框
```

## 组件规范

- **命名导出 + PascalCase**：`export default function Header()`
- **Props 接口**：`interface Props` 定义在组件文件内
- **事件处理**：useCallback 包裹事件处理器
- **UI 状态**：loading / error / empty 三态必须处理
- **用户可见文案**：中文（当前项目覆盖全局"英文"设定）

## 关键代码约定

1. **import type**：类型导入用 `import type { Foo }`（`verbatimModuleSyntax` 要求）
2. **URL 同步**：筛选/搜索状态同步到 `?q=&tag=` URL 参数
3. **标签颜色**：`tagColors` map 在 ProjectCard.tsx 中维护，key 为标签名
4. **卡片渐变**：8 种深色渐变循环分配给卡片
5. **滚动动画**：`useScrollReveal` hook + `.reveal` / `.reveal.visible` CSS class
6. **无障碍**：Focus-visible outline、sr-only 跳转链接、aria-label/pressed/expanded

## 常用命令

```bash
npm run dev       # 开发服务器
npm run build     # 类型检查 + 构建
npm run preview   # 预览构建产物
npm run lint      # ESLint
```

## 新增项目

在 `src/data/projects.ts` 的 `projects` 数组中追加，`allTags` 会自动从所有项目的 tags 推导。

## 雷区

- 不要用内联 style 代替 Tailwind 设计令牌
- 不要用 emoji 当 UI 图标 — 用内联 SVG
- 不要在 `<main>` 上加 `z-0`
- 不要用 `crypto.randomUUID` — 用工具函数 `uuid()`
