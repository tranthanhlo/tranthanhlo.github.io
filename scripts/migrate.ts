// Applies the SQL files in ./drizzle to the database (Neon if DATABASE_URL is set, otherwise local PGlite)
import { mkdirSync } from 'node:fs';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { migrate as migrateNeon } from 'drizzle-orm/neon-http/migrator';

async function main() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    await migrateNeon(drizzle(neon(url)), { migrationsFolder: './drizzle' });
    console.log('Migrated Neon database');
  } else {
    if (process.env.VERCEL) throw new Error('DATABASE_URL is not set. On Vercel, add the Neon Postgres integration (Storage tab) so it is filled in automatically.');
    const dir = process.env.PGLITE_DIR || './.data/pglite';
    mkdirSync(dir, { recursive: true });
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const client = new PGlite(dir);
    await migratePglite(drizzle(client), { migrationsFolder: './drizzle' });
    await client.close();
    console.log('Migrated local PGlite database (.data/pglite)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
