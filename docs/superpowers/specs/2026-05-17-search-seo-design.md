# 搜索 + SEO 增强设计

> **目标：** 为 Ginko Hub 添加全文搜索（Pagefind）和 Sitemap

---

## A. 全文搜索 — Pagefind JS API

### 问题

Pagefind 默认依赖已渲染 HTML 建立索引，但这是 SPA，构建时 HTML 是空的。

### 解决方案：Pagefind JavaScript API

在构建时读取 `src/data/projects.ts` 的项目数据，直接通过 API 写入 Pagefind 索引。

### 安装

```bash
npm install -D pagefind@^1.1.0
```

### 索引构建脚本

新建 `scripts/index-projects.mjs`：

```js
import { index } from 'pagefind';
import { readFileSync } from 'fs';

// 读取构建产物中的项目数据（Vite 注入）
// 构建后 pagefind 索引生成在 dist/pagefind/

const idx = await index({ 
  // 索引存储在 dist/pagefind/
});

// 手动注入项目数据（绕开 HTML 扫描）
const projects = JSON.parse(readFileSync('./dist/assets/*.js', 'utf-8'))
  .filter(src => src.includes('projects')) // 找包含项目数据的 chunk
  // 从 JS bundle 中提取项目数据...

// 示例：用项目 ID 列表构建伪记录（Pagefind 实际通过 URL 搜索）
for (const project of projectsData) {
  await idx.addRecord({
    id: project.id,
    url: `/project/${project.id}`,
    title: project.name,
    excerpt: project.description,
    meta: { tags: project.tags.join(' ') },
    language: 'zh',
  });
}

await idx.write({ directory: 'dist/pagefind' });
console.log('Pagefind index written to dist/pagefind');
```

**更好的方案：直接在 Vite 构建后 hook 中生成**

修改 `vite.config.ts`，在 `closeBundle` 时调用 pagefind CLI：

```ts
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

export default defineConfig({
  plugins: [{
    name: 'pagefind-index',
    closeBundle() {
      // 输出纯 JSON 项目列表供 pagefind 消费
      // 实际通过 pagefind --site dist --output-path dist/pagefind
      // 但 SPA 问题仍存在，用 JS API 更直接
    }
  }]
});
```

### 最终方案：独立构建脚本

1. 构建后执行 Node 脚本
2. 脚本读取 `src/data/projects.ts`，生成 JSON 索引文件
3. Pagefind 读取该 JSON 生成索引

`scripts/generate-search-index.mjs`：

```js
import { writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// 生成项目数据 JSON（构建时可用）
// 实际从 src/data/projects.ts 的数据硬编码或动态读取
const projects = [
  // 从 src/data/projects.ts 解析的项目数据
];

const outDir = join(root, 'dist', 'pagefind');
mkdirSync(outDir, { recursive: true });

// 使用 pagefind JS API 写入索引
const { index } = await import('pagefind');

const idx = await index();
for (const p of projects) {
  await idx.addRecord({
    url: `/project/${p.id}`,
    title: p.name,
    excerpt: p.description.slice(0, 200),
    meta: { tags: p.tags.join(' ') },
  });
}

await idx.write({ directory: outDir });
console.log('Pagefind index generated');
```

### 搜索 UI

**修改 `Header.tsx`**：

```tsx
// 搜索状态
const [query, setQuery] = useState('');
const [results, setResults] = useState<SearchResult[]>([]);
const [searching, setSearching] = useState(false);

// useEffect: 当 query 变化时，调用 pagefind 搜索
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

搜索面板在下拉浮层中显示结果列表，匹配关键词高亮。

---

## B. Sitemap 生成

### 方案

在 `vite build` 后执行 Node 脚本，读取 `src/data/projects.ts` 的项目数据，生成 `dist/sitemap.xml`。

`scripts/generate-sitemap.mjs`：

```js
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://ginko-hub.example.com';

const projects = [...]; // 读取 projects.ts 数据

const urls = [
  `<url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  `<url><loc>${BASE_URL}/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
  ...projects.map(p => 
    `<url><loc>${BASE_URL}/project/${p.id}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
  )
].join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

writeFileSync(join(__dirname, '..', 'dist', 'sitemap.xml'), xml);
console.log('Sitemap written');
```

### package.json 脚本

```json
{
  "scripts": {
    "postbuild": "node scripts/generate-search-index.mjs && node scripts/generate-sitemap.mjs"
  }
}
```

---

## 依赖项

- `pagefind@^1.1.0` (dev)
- 新建 `scripts/generate-search-index.mjs`
- 新建 `scripts/generate-sitemap.mjs`

---

## 文件变更汇总

| 操作 | 文件 |
|------|------|
| 安装 | `package.json` |
| 创建 | `scripts/generate-search-index.mjs` |
| 创建 | `scripts/generate-sitemap.mjs` |
| 修改 | `vite.config.ts` (添加 postbuild hook) |
| 修改 | `src/components/Header.tsx` (搜索 UI) |
| 修改 | `src/data/projects.ts` (暴露项目数据给构建脚本) |
