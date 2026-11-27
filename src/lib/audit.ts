import { desc } from 'drizzle-orm';
import { getDb, schema } from '@/db';

// Writes one line to the admin log. A failure here never stops the action itself.
export async function logAdmin(email: string | null | undefined, action: string, target: string | number = ''): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(schema.adminEvents).values({ email: email ?? '?', action, target: String(target) });
  } catch (e) {
    console.error('admin log failed', e);
  }
}

export async function recentAdminEvents(limit = 30) {
  const db = await getDb();
  return db.select().from(schema.adminEvents).orderBy(desc(schema.adminEvents.createdAt)).limit(limit);
}
