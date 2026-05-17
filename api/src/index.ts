import 'dotenv/config';
import { buildApp } from './app.js';
import { getDb } from './db/index.js';

// Validate critical environment variables at startup
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'undefined' || jwtSecret === 'your-secret-key-here') {
  console.error('[Startup] JWT_SECRET is not configured. Set a strong secret in .env (NODE_ENV=production in deployment).');
  process.exit(1);
}

getDb(); // warm up DB connection before accepting requests
const app = await buildApp();
const port = Number(process.env.PORT) || 4001;

// Start server and wait until truly ready to accept connections
await app.listen({ port });
await app.ready(); // ensures all plugins are loaded and server is fully listening
console.log(`Server running on http://localhost:${port}`);
