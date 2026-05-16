# Ginko Hub 完整产品设计规格

**项目**: ai-ginko-hub
**日期**: 2026-05-16
**状态**: 已批准
**参考**: UI/UX Pro Max Design Intelligence

---

## 1. 背景与目标

Ginko Hub 从纯展示型站点演进为完整产品，兼顾三个核心目标：
- **项目曝光**：让访问者发现并跳转到各个项目
- **个人品牌**：展示开发者能力和技术栈
- **作品集沉淀**：AI 辅助开发的完整履历

---

## 2. 技术架构

### 演进路径

```
当前：React 19 + Vite + Tailwind CSS v4 (静态 SPA)
演进：React 19 + Vite + Tailwind + Fastify API + SQLite
最终：SSR (Vite SSR) 或 SPA + API 分离
```

### 目录结构

```
ai-ginko-hub/
├── src/                    # 前端 (现有)
│   ├── components/
│   ├── pages/              # 新增：ProjectDetail, About, Admin
│   ├── hooks/
│   ├── App.tsx
│   └── main.tsx
├── api/                    # 新增：Fastify 后端
│   ├── index.ts            # API 入口
│   ├── routes/
│   │   ├── projects.ts     # 项目 CRUD
│   │   ├── auth.ts          # 管理员认证
│   │   ├── stats.ts         # 统计数据
│   │   └── subscribe.ts     # 订阅
│   ├── db/
│   │   ├── schema.sql       # SQLite 表结构
│   │   └── index.ts        # 数据库连接
│   └── middleware/
│       └── auth.ts          # JWT 认证中间件
├── cli/                    # 新增：独立 CLI 包
│   ├── src/
│   │   └── index.ts         # CLI 入口 (Commander.js)
│   └── package.json
├── package.json            # 现有 + 新增 workspace 脚本
└── docs/superpowers/specs/ # 设计文档
```

### 技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 前端框架 | React 19 (现有) | 不变 |
| 构建工具 | Vite 8 (现有) | 不变 |
| 样式 | Tailwind CSS v4 (现有) | 不变 |
| 后端框架 | Fastify ESM | 轻量、高性能、ESM 原生 |
| 数据库 | SQLite | 单文件、零运维、够用 |
| ORM | better-sqlite3 | 同步 API，够用且简单 |
| CLI | Commander.js | 轻量、TypeScript 支持 |
| 认证 | JWT (jose) | 简单、无状态 |
| 订阅邮件 | SendGrid / Mailgun | 可选，后期接入 |
| 图表 | D3.js 或轻量库 | 现有依赖复用 |

### 数据模型

```sql
-- projects 表
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL,          -- JSON array
  url TEXT NOT NULL,
  created_at TEXT NOT NULL,     -- ISO date
  featured INTEGER DEFAULT 0,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,                -- 封面图 URL
  view_count INTEGER DEFAULT 0,
  created_at_ts INTEGER,        -- Unix timestamp for sorting
  updated_at INTEGER
);

-- profile 表
CREATE TABLE profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL,
  bio TEXT,
  skills TEXT NOT NULL,         -- JSON array
  social_links TEXT NOT NULL,    -- JSON object
  updated_at INTEGER
);

-- subscribers 表
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  subscribed INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- comments 表
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- admin 表 (简单单账号)
CREATE TABLE admin (
  id INTEGER PRIMARY KEY DEFAULT 1,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL
);
```

### API 设计

```
GET    /api/projects              # 列表 (public, 支持 ?tag= / ?q= 筛选)
GET    /api/projects/:id          # 详情 (public, view_count +1)
POST   /api/projects              # 创建 (auth required)
PUT    /api/projects/:id          # 更新 (auth required)
DELETE /api/projects/:id          # 删除 (auth required)

GET    /api/stats                 # 统计数据 (public)
GET    /api/profile               # Profile (public)
PUT    /api/profile               # 更新 Profile (auth required)

POST   /api/subscribe             # 订阅 (public)
DELETE /api/subscribe/:email     # 取消订阅 (public)

POST   /api/auth/login            # 管理员登录 → JWT
POST   /api/auth/logout           # 登出 (前端清除 token)
GET    /api/auth/me               # 当前用户验证

GET    /api/comments/:projectId   # 获取项目评论 (public)
POST   /api/comments/:projectId   # 提交评论 (public, 简单验证码)
```

---

## 3. 功能规格

### 3.1 项目详情页

**路由**: `/project/:id`

**内容**:
- 项目封面图 (og_image 或占位图)
- 项目名称 + 描述
- 技术标签
- 外部链接按钮 (打开项目)
- 访问量统计
- 相关项目推荐 (同标签，随机取 2-3 个)
- 评论列表

**SEO**:
- 动态 `<title>` + `<meta description>` + `<og:image>`
- 来自 projects 表的 og_title / og_description / og_image

**URL**: `/project/ai-chat`

---

### 3.2 深色/浅色主题

**实现**:
- 检测系统偏好: `prefers-color-scheme`
- 手动切换: Header 或 Profile 页中的切换按钮
- 持久化: `localStorage.setItem('theme', 'light' | 'dark')`
- CSS 变量切换: `data-theme="light"` on `<html>`

**Tailwind 适配** (使用 `dark:` class 或 CSS 变量):
```css
[data-theme="light"] {
  --color-bg-base: #fafaf9;
  --color-bg-card: #ffffff;
  --color-text-primary: #1c1917;
  /* ... */
}
```

**注意**: 保持现有深色为默认，不强制要求浅色支持。

---

### 3.3 Profile 页 (About)

**路由**: `/about`

**内容**:
- 开发者头像 (上传或 URL)
- 姓名 + 一句话简介
- 个人介绍 (长文本)
- 技能标签 (来自 profile 表)
- 社交链接: GitHub / Twitter / Email 等 (来自 profile 表)
- 统计数据: 总项目数 / 精选数 / 技术栈数 (复用现有 Hero 数据)

---

### 3.4 CMS 管理后台

**路由**: `/admin` (独立布局，非展示站导航)

**功能**:

| 功能 | 描述 |
|------|------|
| 项目列表 | 表格展示所有项目，支持排序 |
| 项目编辑 | 表单编辑所有字段，含 SEO 区块 |
| 封面上传 | 上传图片到 `/public/uploads/`，存相对路径 |
| SEO 控制 | og_title / og_description / og_image 独立字段 |
| 数据统计 | 访问量 + 热门项目图表 |
| Profile 编辑 | About 页面内容编辑 |
| 登录认证 | JWT 登录，7 天过期 |

**安全**: 所有写操作需要有效 JWT；公开 API 不需要。

---

### 3.5 CLI 工具

**包名**: `@ginko/cli` (或 `ginko`)

**命令**:

```bash
ginko login                    # 登录 (保存 token 到 ~/.ginkorc)
ginko list                     # 列出所有项目
ginko add                      # 交互式新增项目
ginko edit <id>                # 交互式编辑项目
ginko delete <id>              # 删除项目 (确认提示)
ginko deploy                   # 构建 + 部署 (npm run build && 同步到托管)
ginko sync                     # 从远程 API 拉取数据 (可选)
ginko logout                   # 清除本地 token
```

**技术**: Commander.js + TypeScript，发布到 npm。

---

### 3.6 订阅通知

**邮箱订阅**:
- Header 或 Footer 放置订阅入口: email input + submit
- `POST /api/subscribe` 保存到 subscribers 表
- 后期可选接入 SendGrid/Mailgun 发送邮件

**RSS Feed**:
- `GET /feed.xml` 返回 RSS 2.0
- 新项目上线时自动出现在 feed 中

---

### 3.7 收藏与评论

**收藏**: 简单本地存储 (localStorage)，不需要后端。显示「收藏数」(需要后端聚合)。

**评论**:
- `GET /api/comments/:projectId` 获取列表
- `POST /api/comments/:projectId` 提交评论 (简单验证码防刷)
- 评论内容存 SQLite

---

## 4. 实施阶段

### 阶段 1: 静态增强 (不碰后端)

- [ ] 项目详情页 `/project/:id`
- [ ] 深色/浅色主题切换
- [ ] Profile 页 `/about`
- [ ] 路由结构调整 (React Router)
- [ ] 详情页 SEO meta 动态注入

### 阶段 2: 后端 + CMS

- [ ] Fastify + SQLite 搭建
- [ ] 项目 CRUD API
- [ ] 管理员认证 (JWT)
- [ ] CMS 管理后台 `/admin`
- [ ] 封面上传功能
- [ ] 统计数据 API + 图表

### 阶段 3: CLI + 订阅

- [ ] `ginko` CLI 工具开发
- [ ] `ginko deploy` 部署命令
- [ ] 邮箱订阅 API + 前端订阅入口
- [ ] RSS Feed `/feed.xml`

### 阶段 4: 互动功能

- [ ] 评论系统
- [ ] 收藏功能 (localStorage)
- [ ] 订阅邮件发送 (SendGrid/Mailgun)

---

## 5. UI/UX 设计方向

### 整体风格
- 现有「Motion-Driven Editorial」风格保持
- 深色主题为主，浅色作为可选
- 陶土色 (#c97d5c) + 鼠尾草色 (#7d9a8e) 品牌色不变

### 详情页布局
```
[Header - 固定导航]
[Hero Section - 项目封面大图 + 渐变遮罩]
[项目信息 - 名称/描述/标签/链接按钮]
[评论区]
[相关项目推荐 - 卡片网格]
[Footer]
```

### Admin 后台布局
```
[Admin Header - 固定]
[侧边导航 - Dashboard / 项目 / Profile]
[主内容区]
```

### 字体
- 保持现有 Playfair Display + Outfit
- 深浅主题下文字颜色适当调整对比度

---

## 6. 风险与约束

1. **单仓库管理**: Fastify API 和 React 前端在同仓库，通过 `concurrently` 同时启动开发
2. **SQLite 并发**: 少量用户场景够用，高并发需迁移 PostgreSQL
3. **CLI + 后端版本同步**: CLI 调用远程 API，API URL 通过环境变量配置
4. **封面上传**: 目前仅支持本地存储，CDN 加速后期考虑
5. **浅色主题**: 属锦上添花，不要求 100% 完美覆盖

---

## 7. 验收标准

- [ ] 所有现有 25 项 Pre-Delivery Checklist 持续通过
- [ ] 新增页面满足同等无障碍标准
- [ ] CLI 命令可独立安装和运行
- [ ] CMS 后台所有写操作需认证
- [ ] API 有基本输入验证
- [ ] 构建产物 <= 300KB (当前 208KB)
