import { createHash } from 'node:crypto';
import { and, count, eq, gt, lt } from 'drizzle-orm';
import { getDb, schema } from '@/db';

const { viewEvents } = schema;

export const VIEW_WINDOW_MS = 60 * 60_000; // the same visitor counts once an hour per item
export const VIEW_MAX_PER_WINDOW = 120; // and at most this many views an hour in total

// The address the request came from. On Vercel these headers are set by Vercel itself.
export function clientIp(h: Headers): string {
  return h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

// One-way, salted with the site's secret: the stored value cannot be turned back into an address.
export function visitorKey(ip: string, secret = process.env.AUTH_SECRET ?? 'local'): string {
  return createHash('sha256').update(`${secret}:${ip}`).digest('hex').slice(0, 32);
}

// Records the view when it should count; says whether it did.
export async function countView(visitor: string, target: string, now = Date.now()): Promise<boolean> {
  const db = await getDb();
  const since = new Date(now - VIEW_WINDOW_MS);
  const recent = and(eq(viewEvents.visitor, visitor), gt(viewEvents.createdAt, since));
  const [[same], [{ n }]] = await Promise.all([
    db.select({ id: viewEvents.id }).from(viewEvents).where(and(recent, eq(viewEvents.target, target))).limit(1),
    db.select({ n: count() }).from(viewEvents).where(recent),
  ]);
  if (same || n >= VIEW_MAX_PER_WINDOW) return false;
  await db.insert(viewEvents).values({ visitor, target });
  if (Math.random() < 0.05) await db.delete(viewEvents).where(lt(viewEvents.createdAt, new Date(now - 86_400_000)));
  return true;
}
