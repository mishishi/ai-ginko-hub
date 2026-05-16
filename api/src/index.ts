// Disable TLS certificate verification for Clerk API calls behind corporate proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import 'dotenv/config';
import { buildApp } from './app.js';
import { getDb } from './db/index.js';

await getDb(); // warm up DB connection before accepting requests
const app = await buildApp();
const port = Number(process.env.PORT) || 4001;

// Start server and wait until truly ready to accept connections
await app.listen({ port });
await app.ready(); // ensures all plugins are loaded and server is fully listening
console.log(`Server running on http://localhost:${port}`);
