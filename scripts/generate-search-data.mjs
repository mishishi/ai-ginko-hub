/**
 * 构建时生成搜索索引和 Sitemap
 * 流程：启动 API → 获取项目数据 → 生成 pagefind 索引 + sitemap.xml → 停止 API
 */
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const API_DIR = join(root, 'api');
const OUT_DIR = join(root, 'dist', 'pagefind');
const API_URL = 'http://localhost:4001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startApi() {
  const { spawn } = await import('child_process');
  console.log('[search-data] 启动 API...');
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: API_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  proc.stdout?.on('data', d => process.stdout.write(d));
  proc.stderr?.on('data', d => process.stderr.write(d));
  // 等待服务就绪
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      const res = await fetch(`${API_URL}/api/projects`);
      if (res.ok) {
        console.log('[search-data] API 就绪');
        return proc;
      }
    } catch {}
  }
  throw new Error('API 启动超时');
}

async function stopApi(proc) {
  console.log('[search-data] 停止 API...');
  process.kill(-proc.pid, 'SIGTERM');
  await sleep(1000);
}

async function fetchProjects() {
  console.log('[search-data] 获取项目数据...');
  const res = await fetch(`${API_URL}/api/projects?limit=100`);
  if (!res.ok) throw new Error(`获取项目失败: ${res.status}`);
  const projects = await res.json();
  console.log(`[search-data] 获取到 ${projects.length} 个项目`);
  return projects;
}

async function generatePagefind(projects) {
  mkdirSync(OUT_DIR, { recursive: true });
  const { createIndex } = await import('pagefind');

  const { index: idx, errors } = await createIndex();
  if (errors.length > 0) console.error('Pagefind index errors:', errors);

  for (const p of projects) {
    await idx.addCustomRecord({
      url: `/project/${p.id}`,
      content: `${p.name} ${p.description} ${(p.tags || []).join(' ')}`,
      language: 'zh',
      meta: { title: p.name, tags: (p.tags || []).join(' ') },
    });
  }

  const result = await idx.writeFiles({ outputPath: OUT_DIR });
  if (result.errors.length > 0) console.error('Pagefind write errors:', result.errors);
  console.log('[search-data] Pagefind 索引已生成');
}

async function generateSitemap(projects) {
  const BASE_URL = process.env.SITE_BASE_URL || 'https://ginko-hub.example.com';
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    `<url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${BASE_URL}/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
  ];

  const projectUrls = projects.map(p =>
    `<url><loc>${BASE_URL}/project/${p.id}</loc><lastmod>${p.updatedAt ? p.updatedAt.split('T')[0] : today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
  );

  const urls = [...staticUrls, ...projectUrls].join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist', 'sitemap.xml'), xml);
  console.log('[search-data] Sitemap 已生成');
}

async function main() {
  let proc;
  try {
    proc = await startApi();
    const projects = await fetchProjects();
    await Promise.all([
      generatePagefind(projects),
      generateSitemap(projects),
    ]);
  } finally {
    if (proc) await stopApi(proc);
  }
}

main().catch(err => {
  console.error('[search-data] 失败:', err);
  process.exit(1);
});
