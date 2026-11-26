import { getDb, schema } from '@/db';

// Everything worth keeping, in an order that can be put back (parents before children).
// Sign-in tokens (accounts, sessions) are left out on purpose: they are secrets and Google recreates them.
export const BACKUP_TABLES = {
  users: schema.users,
  tools: schema.tools,
  videos: schema.videos,
  posts: schema.posts,
  comments: schema.comments,
  likes: schema.likes,
  saves: schema.saves,
  subscriptions: schema.subscriptions,
  commentLikes: schema.commentLikes,
  notificationsSent: schema.notificationsSent,
  settings: schema.settings,
} as const;

export async function exportAll() {
  const db = await getDb();
  const data: Record<string, unknown[]> = {};
  for (const [name, table] of Object.entries(BACKUP_TABLES)) data[name] = await db.select().from(table);
  return { version: 1, createdAt: new Date().toISOString(), data };
}
