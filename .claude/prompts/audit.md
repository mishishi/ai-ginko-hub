# Ginko Hub 全维度审计 Prompt

## 执行方式

对项目进行 8 个维度的全面审计。输出结构化报告，每条包含 severity（严重程度）、具体文件和行号、问题描述、修复建议。

---

## Severity 定义（严格遵守）

| Severity | 含义 | 上线阻断？ |
|----------|------|-----------|
| P0 CRITICAL | 认证失效 / 数据泄露 / 部署即故障 | **是** |
| P1 HIGH | 竞态 / 数据不一致 / 安全绕过 | 上线前修 |
| P2 MEDIUM | 功能缺陷 / 真正可访问性问题 / 错误处理缺失 | 上线后短期内修 |
| P3 LOW | 性能开销 / 代码重复 / UX 优化项 | 进迭代 |

---

## 9 维度审计类别

### 1. 安全（Security）— P0/P1

- 环境变量缺失时启动 throw 检查
- CORS 配置从环境变量读取，非硬编码
- SQL 注入风险（参数化查询）
- 认证中间件在所有受保护路由上正确应用
- 文件上传：类型验证、路径遍历防护、大小限制
- 敏感信息不写入日志或客户端代码
- 用户输入转义（XSS 防护）

### 2. 后端 / API（Backend & API）— P0/P1/P2

- REST 惯例：正确的 HTTP 方法、状态码、错误响应格式
- 认证：JWT/Cookie 验证、权限检查
- 速率限制：全局 + 关键路由差异化保护
- 数据验证：Zod schema 在所有输入点生效
- 竞态条件：先查后写 → 依赖数据库唯一约束
- 事务性：涉及多表操作是否在事务中
- 分页：所有列表 API 是否支持分页
- 缓存：频繁调用的数据是否有缓存策略

### 3. 正确性（Correctness）— P1/P2

- 竞态条件（TOCTOU）
- 异步操作 try/catch/finally，UI 状态保证恢复
- 乐观更新错误时回滚逻辑
- 排序/过滤/分页边界情况正确
- 多 Tab 同时操作同一资源时的状态一致性
- JSON 序列化/反序列化一致（日期格式、null vs undefined）

### 4. 可访问性（Accessibility）— P2

- 表单输入有 `<label>` 或 `aria-label`
- 按钮/链接有可访问名称（不能只有图标）
- 焦点状态可见（focus ring）
- 动态内容变化有 `aria-live` 通知
- 颜色对比度 ≥ 4.5:1（正文）/ 3:1（大文本）
- 图像有描述性 alt 或父级 aria-label

### 5. 错误状态处理（Error/Loading/Empty）— P2

- 所有异步操作处理 loading / error / empty 三态
- API 错误时用户有反馈（toast / 文案）
- 网络错误 / 超时有用户可见提示
- 空状态有引导 UI（不是白屏）

### 6. 前端代码质量（Code Quality）— P3

- 代码重复（相似逻辑超过 3 处应抽取）
- 组件单一职责（一个文件做一件事）
- 事件处理用 useCallback 避免不必要的重渲染
- 魔法数字/字符串抽取为常量
- 硬编码值（URL、ID、用户名）是否可通过环境变量配置
- 注释只在逻辑不显然时添加（不添乱）

### 7. 性能（Performance）— P3

- 重复计算有缓存（useMemo / module 级缓存）
- 图片 lazy loading
- fetch 有 AbortSignal timeout
- 大量列表（>100 项）考虑虚拟化
- 无不必要的重渲染（useCallback / React.memo 合理使用）

### 8. 架构与可维护性（Architecture & Maintainability）— P3

- 组件结构是否清晰（按职责分组）
- API 层和数据层分离
- 类型定义是否完整（无 `as any` 逃逸）
- 环境变量有 .env.example 或文档说明
- 迁移脚本是否可重复执行（幂等性）

### 9. SEO / 社交分享 — P2

- `<title>` 和 `<meta name="description">` 在每个页面动态设置
- Open Graph 标签（og:title、og:description、og:image）完整
- og:url 使用 `<meta>` 标签而非依赖 JavaScript（社交爬虫可能不执行 JS）
- 语义化 HTML（`<main>`、`<article>`、`<nav>`）辅助爬虫理解页面结构
- 页面有 canonical URL

---

## 产品功能维度（参考，需主观判断）— P3

- 是否有明确的用户价值（解决什么问题）
- 核心用户流程是否顺畅（注册 → 使用 → 分享）
- 功能是否有明显的功能腐化（placeholder / TODO 而非真实实现）
- 边界情况是否有处理（空数据、首次使用、网络断开）

---

## UX / UI 设计维度（参考）— P3

- 视觉一致性（颜色、字体、间距、圆角是否统一）
- 交互反馈（hover / active / disabled / loading 状态）
- 响应式布局在 375px / 768px / 1440px 下是否正常
- 动画是否流畅（prefer-reduced-motion 支持）
- 导航路径是否清晰（用户知道自己在哪、如何回去）

---

## 排除规则（FALSE POSITIVES — 不是 Bug）

以下模式**不要**报告为问题：

### Accessibility
- `alt=""` + 父元素有 `aria-label` 或 `role="button"` + aria-label = **合规**，装饰性图像允许空 alt
- `htmlFor` + `sr-only` label = **等效于** `aria-labelledby`，两者都合规
- 按钮组支持箭头键导航 = **可选增强**，非强制 WCAG 要求

### React 模式
- 非 React state 变量（模块级变量、ref）闭包使用 = **无陈旧问题**，只有 useState/useReducer 才受 deps 影响
- `handleXxx` 不用 `useCallback` = **风格选择**，作为普通 prop 传递不需要，只有在 `memo` 包裹的组件中才需要
- `useCallback` deps `[]` = **正确**，当回调不依赖任何响应式值时

### 错误处理
- async 函数内部已有 try/catch/finally 覆盖所有 throw 路径 = **无需外层再包**
- fetch 已有 AbortSignal.timeout() = **已有超时保护**

### 业务 / 架构
- 全局 rate limit 100 req/min = **可接受的默认策略**
- 静态数据文件（projects.ts）= **内容数据**，非 bug
- 第三方 SDK 默认行为（Clerk SDK 内部错误处理）= **非本项目范围**
- hardcoded fallback 值（如 `'mishishi'`）= **风格问题**，有环境变量路径时为合理降级

### API 设计
- `/api/stats` 缓存 5 分钟 = **合理的缓存策略**，非 bug
- REST 风格细节（路径命名、单复数）= **风格偏好**，不影响功能

---

## 输出格式

```markdown
# 系统审计报告 — YYYY-MM-DD

9 维度审计：P0 CRITICAL · P1 HIGH · P2 MEDIUM · P3 LOW

---

## P0 CRITICAL（立即修复，部署阻断）

### [ID] [标题]
- **文件**: `path/to/file:line`
- **问题**: 描述
- **修复**: 建议方案

---

## P1 HIGH（功能正确性，上线前修复）

---

## P2 MEDIUM（UX / Accessibility / 错误处理）

---

## P3 LOW（代码质量 / 性能 / 架构 / UX 优化）

### 产品功能

### 前端代码质量

### UX / UI 设计

### 架构与可维护性

---

## 已排除的误报

以下"问题"经核实不是 bug：
- [文件:行号] [描述] — [排除理由]
```

---

## 审计前准备

1. 读取 `CLAUDE.md` 了解项目技术栈和约定
2. 读取 `src/lib/api.ts` 了解 API 基础路径
3. 确认关键路由和中间件注册位置（`api/src/app.ts`）
4. 读取 auth 中间件实现，了解认证流程
5. 读取主要页面组件，了解产品功能范围

**关键原则：以文件当前实际内容为准，不依赖对话历史或之前的审计报告。每次审计开始前重新读取相关文件确认真实状态。**

## 审计原则

1. **每条报告必须有 `文件:行号`**，泛泛而谈的问题没有价值
2. **Severity 要从严**，宁可高报安全漏洞，不能漏报
3. **P3 不要过度报告**，代码风格问题 1 条总结即可，不用逐条列
4. **先确认真实状态再报告**，对存疑的问题必须读取文件验证，不要基于"之前修过"的假设跳过验证
4. **UX / 产品功能是主观判断**，标注 `[建议]` 而非强制要求
5. **排除规则要严格**，不是 bug 的不要报为 bug
