/**
 * 从 SQLite (data.db) 迁移项目数据到 PostgreSQL
 */
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const SQLITE_DB = join(root, 'api', 'data.db');

async function main() {
  // 用 sqlite3 命令行读取数据
  const { execSync } = await import('child_process');

  const rows = execSync(
    `sqlite3 "${SQLITE_DB}" "SELECT id, name, description, tags, url, thumbnail, created_at, featured, og_title, og_description, og_image, view_count, created_at_ts, updated_at FROM projects;"`,
    { encoding: 'utf-8' }
  ).trim();

  const projects = rows.split('\n').map(line => {
    const [id, name, description, tags, url, thumbnail, createdAt, featured, ogTitle, ogDescription, ogImage, viewCount, createdAtTs, updatedAt] = line.split('|');
    return { id, name, description, tags, url, thumbnail: thumbnail || null, createdAt, featured: featured === '1', ogTitle: ogTitle || null, ogDescription: ogDescription || null, ogImage: ogImage || null, viewCount: parseInt(viewCount) || 0, createdAtTs: parseInt(createdAtTs) || null, updatedAt: parseInt(updatedAt) || null };
  });

  console.log(`读取到 ${projects.length} 个项目`);

  // 直接用 psql 插入
  for (const p of projects) {
    const sql = `
INSERT INTO projects (id, name, description, tags, url, thumbnail, created_at, featured, og_title, og_description, og_image, view_count, created_at_ts, updated_at, repo_url)
VALUES (
  '${p.id.replace(/'/g, "''")}',
  '${p.name.replace(/'/g, "''")}',
  '${p.description.replace(/'/g, "''")}',
  '${p.tags.replace(/'/g, "''")}',
  '${p.url.replace(/'/g, "''")}',
  ${p.thumbnail ? `'${p.thumbnail.replace(/'/g, "''")}'` : 'NULL'},
  '${p.createdAt}',
  ${p.featured},
  ${p.ogTitle ? `'${p.ogTitle.replace(/'/g, "''")}'` : 'NULL'},
  ${p.ogDescription ? `'${p.ogDescription.replace(/'/g, "''")}'` : 'NULL'},
  ${p.ogImage ? `'${p.ogImage.replace(/'/g, "''")}'` : 'NULL'},
  ${p.viewCount},
  ${p.createdAtTs ? Math.floor(p.createdAtTs / 1000) : 'NULL'},
  ${p.updatedAt ? Math.floor(p.updatedAt / 1000) : 'NULL'},
  NULL
) ON CONFLICT (id) DO NOTHING;`;
    try {
      execSync(`psql "${process.env.DATABASE_URL}" -c "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf-8', stdio: 'pipe' });
      console.log(`  ✓ ${p.name}`);
    } catch (err) {
      console.error(`  ✗ ${p.name}: ${err.message}`);
    }
  }

  console.log('迁移完成');
}

main().catch(err => { console.error(err); process.exit(1); });
