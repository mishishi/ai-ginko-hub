import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// 硬编码项目数据（与实际项目保持同步）
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

const outDir = join(root, 'dist', 'pagefind');
mkdirSync(outDir, { recursive: true });

const { createIndex } = await import('pagefind');

const { index: idx, errors } = await createIndex();
if (errors.length > 0) {
  console.error('Pagefind index errors:', errors);
}

for (const p of projects) {
  await idx.addCustomRecord({
    url: `/project/${p.id}`,
    content: `${p.name} ${p.description} ${p.tags.join(' ')}`,
    language: 'zh',
    meta: { title: p.name, tags: p.tags.join(' ') },
  });
}

const result = await idx.writeFiles({ outputPath: outDir });
if (result.errors.length > 0) {
  console.error('Pagefind write errors:', result.errors);
}
console.log('Pagefind index written to dist/pagefind');
