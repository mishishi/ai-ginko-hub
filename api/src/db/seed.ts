import { getDb, saveDb, schema } from './index.js';
import { hashPassword } from '../utils/password.js';
import 'dotenv/config';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seed() {
  if (!ADMIN_PASSWORD) {
    console.error('[Seed] ADMIN_PASSWORD is not set. Please configure it in .env before seeding.');
    process.exit(1);
  }

  const db = await getDb();
  const passwordHash = hashPassword(ADMIN_PASSWORD);

  await db.insert(schema.admin)
    .values({ username: ADMIN_USERNAME, passwordHash })
    .onConflictDoNothing();

  await saveDb();
  console.log(`Admin seeded: ${ADMIN_USERNAME}`);
}

seed();
