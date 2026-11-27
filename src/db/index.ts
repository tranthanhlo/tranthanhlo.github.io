import { mkdirSync } from 'node:fs';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

// DATABASE_URL set → Neon Postgres (production). Empty → embedded PGlite in .data/ (local work).
// The connection is reused across hot reloads.
const g = globalThis as unknown as { __db?: Promise<DB> };

// The running site uses APP_DATABASE_URL when it is set: a database role that may read and write
// rows but cannot drop or change tables. DATABASE_URL (the owner) is then only used by migrations.
async function connect(): Promise<DB> {
  const url = process.env.APP_DATABASE_URL || process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    return drizzle(neon(url), { schema }) as unknown as DB;
  }
  // never fall back to the throw-away local database on a real deployment
  if (process.env.VERCEL) throw new Error('DATABASE_URL is not set. On Vercel, add the Neon Postgres integration (Storage tab) so it is filled in automatically.');
  const dir = process.env.PGLITE_DIR || './.data/pglite';
  mkdirSync(dir, { recursive: true });
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const client = new PGlite(dir);
  return drizzle(client, { schema }) as unknown as DB;
}

export const getDb = (): Promise<DB> => (g.__db ??= connect());
export { schema };
