import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const BASE_URL = 'https://ginko-hub.example.com';

// 硬编码项目数据（与 generate-search-index.mjs 保持同步）
const projects = [
  {
    id: 'ginko-hub',
    name: 'Ginko Hub',
    description: 'AI 项目展示站，提供项目筛选、搜索和详情查看功能，基于 React + TypeScript + Vite 构建',
    tags: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
  },
  {
    id: 'hyperframes',
    name: 'HyperFrames',
    description: 'AI 驱动的视频合成框架，支持字幕、配音、转场等自动化视频制作流程',
    tags: ['Video', 'AI', 'Automation', 'React'],
  },
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

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'sitemap.xml'), xml);
console.log('Sitemap written to dist/sitemap.xml');
