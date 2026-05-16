import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from './schema.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../data.db');

let db: ReturnType<typeof drizzle> | null = null;
let rawDb: Database | null = null;

export async function getDb() {
  if (db && rawDb) {
    try {
      rawDb.exec('SELECT 1');
      return db;
    } catch {
      db = null;
      rawDb = null;
    }
  }

  const SQL = await initSqlJs();

  // Load existing data if file exists
  try {
    const fs = await import('fs');
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      rawDb = new SQL.Database(fileBuffer);
    } else {
      rawDb = new SQL.Database();
    }
  } catch {
    rawDb = new SQL.Database();
  }

  db = drizzle(rawDb, { schema });
  return db;
}

export async function saveDb() {
  if (rawDb) {
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    const fs = await import('fs/promises');
    await fs.writeFile(dbPath, buffer);
  }
}

export { schema };
