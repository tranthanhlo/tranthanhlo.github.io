import { and, count, eq, gt, lt } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { stripDiacritics } from '@/lib/text';

const { rateEvents, settings } = schema;

export const LIMITS = {
  react: { max: 60, windowMs: 60_000 }, // likes, saves, follows: 60 a minute
  comment: { max: 10, windowMs: 10 * 60_000 }, // comments: 10 every 10 minutes
} as const;

export const MAX_LINKS = 2;

// Records one action and says whether it is still within the limit. Stored in the database so it
// works on serverless (many short-lived servers). Old rows are swept now and then.
export async function allow(userId: string, kind: keyof typeof LIMITS): Promise<boolean> {
  const { max, windowMs } = LIMITS[kind];
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: count() })
    .from(rateEvents)
    .where(and(eq(rateEvents.userId, userId), eq(rateEvents.kind, kind), gt(rateEvents.createdAt, new Date(Date.now() - windowMs))));
  if (n >= max) return false;
  await db.insert(rateEvents).values({ userId, kind });
  if (Math.random() < 0.05) await db.delete(rateEvents).where(lt(rateEvents.createdAt, new Date(Date.now() - 86_400_000)));
  return true;
}

export const countLinks = (text: string) => (text.match(/https?:\/\//g) ?? []).length;

/* ---------- blocked words (edited in /admin/comments) ---------- */

const BLOCKED_KEY = 'blocked_words';

export async function getBlockedWords(): Promise<string[]> {
  const db = await getDb();
  const [row] = await db.select().from(settings).where(eq(settings.key, BLOCKED_KEY));
  return parseWords(row?.value ?? '');
}

export async function setBlockedWords(raw: string): Promise<void> {
  const db = await getDb();
  const value = parseWords(raw).join('\n');
  await db.insert(settings).values({ key: BLOCKED_KEY, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

export function parseWords(raw: string): string[] {
  return [...new Set(raw.split(/[\n,]+/).map((w) => w.trim().toLowerCase()).filter(Boolean))].slice(0, 500);
}

const norm = (s: string) => stripDiacritics(s).toLowerCase();

// true when the text contains one of the words (accents and capitals ignored, whole words or phrases only)
export function containsBlocked(text: string, words: string[]): boolean {
  if (words.length === 0) return false;
  const hay = ` ${norm(text).replace(/[^a-z0-9]+/g, ' ')} `;
  return words.some((w) => {
    const needle = norm(w).replace(/[^a-z0-9]+/g, ' ').trim();
    return needle.length > 0 && hay.includes(` ${needle} `);
  });
}
