import { neon } from '@neondatabase/serverless';
import { SCHEMA_STATEMENTS } from '@/db/schema';

function getConnectionString() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      'No Postgres connection string found. Set DATABASE_URL (or POSTGRES_URL) — ' +
      'in Vercel, add the Postgres/Neon integration and it will be injected automatically.'
    );
  }
  return url;
}

const globalForDb = globalThis;

function getSql() {
  if (!globalForDb.__sql) {
    globalForDb.__sql = neon(getConnectionString());
  }
  return globalForDb.__sql;
}

// Lazy — avoids throwing at import time (e.g. during `next build`) if the
// connection string isn't set yet, same reasoning as lib/openai.js.
export const sql = (...args) => getSql()(...args);

let schemaReady;

// CREATE TABLE IF NOT EXISTS is idempotent; memoized per warm instance so
// repository calls don't re-check on every request.
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const statement of SCHEMA_STATEMENTS) {
        await getSql().query(statement);
      }
    })();
  }
  return schemaReady;
}
