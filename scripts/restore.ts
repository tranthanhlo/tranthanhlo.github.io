// Puts a backup file (from /admin/backup) into an EMPTY database.
//   DATABASE_URL=... npx tsx scripts/restore.ts path/to/backup.json
// Run `npm run db:migrate` first so the tables exist. It refuses to touch a database that already has content.
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { getDb, schema } from '../src/db';
import { BACKUP_TABLES } from '../src/lib/backup';

const DATE_KEYS = /At$|^emailVerified$|^expires$/;

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: npx tsx scripts/restore.ts backup.json');
  const dump = JSON.parse(readFileSync(file, 'utf8')) as { version: number; data: Record<string, Record<string, unknown>[]> };
  if (dump.version !== 1) throw new Error('Unknown backup version');

  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.users);
  if (n > 0) throw new Error('This database already has users. Restore only into an empty database.');

  for (const [name, table] of Object.entries(BACKUP_TABLES)) {
    const rows = (dump.data[name] ?? []).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, DATE_KEYS.test(k) && typeof v === 'string' ? new Date(v) : v])));
    for (let i = 0; i < rows.length; i += 200) await db.insert(table).values(rows.slice(i, i + 200) as never);
    console.log(`${name}: ${rows.length}`);
  }
  // numbered ids continue after the restored ones
  for (const t of ['tools', 'videos', 'posts', 'comments', 'subscriptions', 'notifications_sent', 'rate_events']) {
    await db.execute(sql.raw(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 0) + 1, false)`));
  }
  console.log('Restored.');
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e.message ?? e);
    process.exit(1);
  },
);
