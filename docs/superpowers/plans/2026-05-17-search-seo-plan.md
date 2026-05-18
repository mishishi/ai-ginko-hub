# 搜索 + SEO 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Ginko Hub 添加全文搜索（Pagefind JS API）和 Sitemap 生成

**Architecture:**
- 构建后 Node 脚本读取 `src/data/projects.ts` 数据，通过 Pagefind JS API 生成索引
- Sitemap 在 postbuild 时由独立脚本生成
- 搜索 UI 集成在 `Header.tsx`，下拉浮层展示结果

**Tech Stack:** pagefind@^1.1.0 (dev), Node.js postbuild 脚本

---

## Task 1: 安装 Pagefind

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 pagefind**

Run: `cd /Users/zhurenbao/Jason/ai-workspaces/ai-ginko-hub && npm install -D pagefind@^1.1.0`
Expected: 无 error 输出

- [ ] **Step 2: 验证安装**

Run: `npx pagefind --version`
Expected: `1.1.0` 或更高版本

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add pagefind for full-text search"
```

---

## Task 2: 创建搜索索引生成脚本

**Files:**
- Create: `scripts/generate-search-index.mjs`

- [ ] **Step 1: 创建脚本目录**

Run: `mkdir -p scripts`

- [ ] **Step 2: 编写脚本**

```js
// scripts/generate-search-index.mjs
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// 硬编码项目数据（与 src/data/projects.ts 保持同步）
const projects = [
  { id: 'ginko-hub', name: 'Ginko Hub', description: 'AI 项目展示站', tags: ['React', 'TypeScript', 'Vite'] },
  // 更多项目从 src/data/projects.ts 复制粘贴
];

const outDir = join(root, 'dist', 'pagefind');
mkdirSync(outDir, { recursive: true });

const { index } = await import('pagefind');

const idx = await index();
for (const p of projects) {
  await idx.addRecord({
    url: `/project/${p.id}`,
    title: p.name,
    excerpt: p.description.slice(0, 200),
    meta: { tags: p.tags.join(' ') },
    language: 'zh',
  });
}

await idx.write({ directory: outDir });
console.log('Pagefind index written to dist/pagefind');
```

**注意：** `projects` 数组内容需要从 `src/data/projects.ts` 中复制实际数据。

- [ ] **Step 3: 运行脚本验证**

Run: `npm run build && node scripts/generate-search-index.mjs`
Expected: 输出 "Pagefind index written"，无 error

- [ ] **Step 4: 验证生成的文件**

Run: `ls -la dist/pagefind/`
Expected: 存在 `pagefind.js` 等索引文件

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-search-index.mjs
git commit -m "feat(search): add search index generation script"
```

---

## Task 3: 创建 Sitemap 生成脚本

**Files:**
- Create: `scripts/generate-sitemap.mjs`

- [ ] **Step 1: 编写脚本**

```js
// scripts/generate-sitemap.mjs
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const BASE_URL = 'https://ginko-hub.example.com'; // TODO: 替换为实际域名

// 硬编码项目数据（与 src/data/projects.ts 保持同步）
const projects = [
  { id: 'ginko-hub', name: 'Ginko Hub', description: 'AI 项目展示站', tags: ['React', 'TypeScript', 'Vite'] },
  // 更多项目从 src/data/projects.ts 复制粘贴
];

const today = new Date().toISOString().split('T')[0];

const staticUrls = [
  `<url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  `<url><loc>${BASE_URL}/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
];

const projectUrls = projects.map(p =>
  `<url><loc>${BASE_URL}/project/${p.id}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
);

const urls = [...staticUrls, ...projectUrls].join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

writeFileSync(join(root, 'dist', 'sitemap.xml'), xml);
console.log('Sitemap written to dist/sitemap.xml');
```

**注意：** `BASE_URL` 和 `projects` 数组需要替换为实际值。

- [ ] **Step 2: 运行脚本验证**

Run: `node scripts/generate-sitemap.mjs && cat dist/sitemap.xml`
Expected: 输出了正确的 sitemap XML，无 error

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-sitemap.mjs
git commit -m "feat(seo): add sitemap generation script"
```

---

## Task 4: 配置 package.json postbuild 脚本

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 添加 postbuild 脚本**

在 `package.json` 的 `scripts` 中添加：

```json
{
  "scripts": {
    "postbuild": "node scripts/generate-search-index.mjs && node scripts/generate-sitemap.mjs"
  }
}
```

- [ ] **Step 2: 验证完整构建流程**

Run: `npm run build`
Expected: 构建成功，pagefind 索引和 sitemap.xml 都生成了

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(build): add postbuild scripts for search index and sitemap"
```

---

## Task 5: 搜索 UI 集成到 Header

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: 读取当前 Header.tsx 实现**

Read: `src/components/Header.tsx`

- [ ] **Step 2: 添加搜索状态和逻辑**

在 Header 组件中添加：

```tsx
const [query, setQuery] = useState('');
const [results, setResults] = useState<any[]>([]);
const [searching, setSearching] = useState(false);

useEffect(() => {
  if (!query.trim()) { setResults([]); return; }
  let cancelled = false;
  setSearching(true);

  import('/pagefind/pagefind.js').then(async (pf) => {
    if (cancelled) return;
    const search = await pf.search(query);
    const data = await Promise.all(search.results.slice(0, 5).map(r => r.data()));
    if (!cancelled) { setResults(data); setSearching(false); }
  }).catch(() => { if (!cancelled) setSearching(false); });

  return () => { cancelled = true; };
}, [query]);
```

- [ ] **Step 3: 在 Header 的搜索框中添加 onChange**

找到现有的搜索 input，添加 `onChange` 事件处理 `setQuery`

- [ ] **Step 4: 添加搜索结果下拉浮层**

在搜索框下方添加结果列表浮层，渲染 `results.map(r => ...)` 高亮关键词

- [ ] **Step 5: 验证构建**

Run: `npm run build`
Expected: 编译成功，无错误

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat(search): integrate Pagefind search UI in Header"
```

---

## 依赖项

- `pagefind@^1.1.0` (dev)

## 文件变更汇总

| 操作 | 文件 |
|------|------|
| 安装 | `package.json` |
| 创建 | `scripts/generate-search-index.mjs` |
| 创建 | `scripts/generate-sitemap.mjs` |
| 修改 | `package.json` (postbuild) |
| 修改 | `src/components/Header.tsx` (搜索 UI) |
