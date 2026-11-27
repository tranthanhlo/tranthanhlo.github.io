'use server';

import { and, count, desc, eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { clientIp, countView, visitorKey } from '@/lib/views';
import { getDb, schema } from '@/db';
import type { TargetType } from '@/db/schema';
import { AuthError, getSessionUser, requireUser } from '@/lib/session';
import { getComments, type CommentSort } from '@/lib/queries';
import { toCommentItems } from '@/lib/comments';
import { isLang } from '@/lib/i18n';
import { allow, containsBlocked, countLinks, getBlockedWords, MAX_LINKS } from '@/lib/rate-limit';

const { likes, saves, comments, subscriptions, videos, posts, tools, users, commentLikes } = schema;

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const slowDown = { ok: false as const, error: 'rate-limited' };

const isType = (v: unknown): v is TargetType => v === 'video' || v === 'post';

// the target must exist and be published
async function targetExists(type: TargetType, id: number): Promise<boolean> {
  const db = await getDb();
  const table = type === 'video' ? videos : posts;
  const [row] = await db.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.published, true)));
  return !!row;
}

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof AuthError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: 'server' };
}

/* ---------- like / save: pressing twice never doubles ---------- */

async function toggle(table: typeof likes | typeof saves, type: unknown, id: unknown): Promise<Result<{ on: boolean; total: number }>> {
  try {
    if (!isType(type) || !Number.isInteger(id)) return { ok: false, error: 'bad-input' };
    const user = await requireUser();
    if (!(await allow(user.id, 'react'))) return slowDown;
    if (!(await targetExists(type, id as number))) return { ok: false, error: 'not-found' };
    const db = await getDb();
    const key = and(eq(table.userId, user.id), eq(table.targetType, type), eq(table.targetId, id as number));
    const [existing] = await db.select().from(table).where(key);
    if (existing) await db.delete(table).where(key);
    else await db.insert(table).values({ userId: user.id, targetType: type, targetId: id as number }).onConflictDoNothing();
    const [{ n }] = await db.select({ n: count() }).from(table).where(and(eq(table.targetType, type), eq(table.targetId, id as number)));
    return { ok: true, on: !existing, total: n };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleLike(type: unknown, id: unknown) {
  return toggle(likes, type, id);
}
export async function toggleSave(type: unknown, id: unknown) {
  return toggle(saves, type, id);
}

/* ---------- follow ---------- */

export async function toggleFollow(scope: unknown): Promise<Result<{ on: boolean }>> {
  try {
    if (typeof scope !== 'string') return { ok: false, error: 'bad-input' };
    const user = await requireUser();
    if (!(await allow(user.id, 'react'))) return slowDown;
    const db = await getDb();
    if (scope !== 'all') {
      const m = scope.match(/^tool:(\d+)$/);
      if (!m) return { ok: false, error: 'bad-input' };
      const [tool] = await db.select({ id: tools.id }).from(tools).where(and(eq(tools.id, Number(m[1])), eq(tools.published, true)));
      if (!tool) return { ok: false, error: 'not-found' };
    }
    const key = and(eq(subscriptions.userId, user.id), eq(subscriptions.scope, scope));
    const [existing] = await db.select().from(subscriptions).where(key);
    if (existing) await db.delete(subscriptions).where(key);
    else await db.insert(subscriptions).values({ userId: user.id, scope }).onConflictDoNothing();
    return { ok: true, on: !existing };
  } catch (e) {
    return fail(e);
  }
}

/* ---------- comments ---------- */

const MAX_LEN = 2000;
const COOLDOWN_MS = 20_000;

export async function addComment(type: unknown, id: unknown, body: unknown, parentId?: unknown): Promise<Result<{ held?: boolean }>> {
  try {
    if (!isType(type) || !Number.isInteger(id) || typeof body !== 'string') return { ok: false, error: 'bad-input' };
    const user = await requireUser();
    const text = body.trim();
    if (!text) return { ok: false, error: 'empty' };
    if (text.length > MAX_LEN) return { ok: false, error: 'too-long' };
    if (countLinks(text) > MAX_LINKS) return { ok: false, error: 'too-many-links' };
    if (!(await targetExists(type, id as number))) return { ok: false, error: 'not-found' };

    const db = await getDb();
    const [last] = await db.select({ at: comments.createdAt }).from(comments).where(eq(comments.userId, user.id)).orderBy(desc(comments.createdAt)).limit(1);
    if (last && Date.now() - last.at.getTime() < COOLDOWN_MS) return { ok: false, error: 'too-fast' };

    let parent: number | null = null;
    if (parentId != null) {
      if (!Number.isInteger(parentId)) return { ok: false, error: 'bad-input' };
      const [p] = await db.select().from(comments).where(eq(comments.id, parentId as number));
      // replies go one level deep, under a visible comment of the same item
      if (!p || p.parentId !== null || p.hidden || p.targetType !== type || p.targetId !== id) return { ok: false, error: 'bad-input' };
      parent = p.id;
    }
    if (!(await allow(user.id, 'comment'))) return slowDown;
    // a comment with a blocked word is kept but hidden until the admin looks at it
    const held = containsBlocked(text, await getBlockedWords());
    await db.insert(comments).values({ userId: user.id, targetType: type, targetId: id as number, parentId: parent, body: text, hidden: held });
    return { ok: true, held };
  } catch (e) {
    return fail(e);
  }
}

export async function editComment(commentId: unknown, body: unknown): Promise<Result<{ held?: boolean }>> {
  try {
    if (!Number.isInteger(commentId) || typeof body !== 'string') return { ok: false, error: 'bad-input' };
    const user = await requireUser();
    const text = body.trim();
    if (!text) return { ok: false, error: 'empty' };
    if (text.length > MAX_LEN) return { ok: false, error: 'too-long' };
    if (countLinks(text) > MAX_LINKS) return { ok: false, error: 'too-many-links' };
    const held = containsBlocked(text, await getBlockedWords());
    const db = await getDb();
    // the user id is part of the condition: nobody can edit someone else's comment
    const rows = await db
      .update(comments)
      .set({ body: text, editedAt: new Date(), ...(held ? { hidden: true } : {}) })
      .where(and(eq(comments.id, commentId as number), eq(comments.userId, user.id)))
      .returning({ id: comments.id });
    return rows.length ? { ok: true, held } : { ok: false, error: 'forbidden' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteComment(commentId: unknown): Promise<Result> {
  try {
    if (!Number.isInteger(commentId)) return { ok: false, error: 'bad-input' };
    const session = await getSessionUser();
    if (!session) return { ok: false, error: 'not-signed-in' };
    const db = await getDb();
    const where = session.isAdmin
      ? eq(comments.id, commentId as number)
      : and(eq(comments.id, commentId as number), eq(comments.userId, session.id));
    const rows = await db.delete(comments).where(where).returning({ id: comments.id });
    // replies hang off their parent, so they go with it
    if (rows.length) await db.delete(comments).where(eq(comments.parentId, commentId as number));
    return rows.length ? { ok: true } : { ok: false, error: 'forbidden' };
  } catch (e) {
    return fail(e);
  }
}

/* ---------- views ---------- */

// Counts one view. No login needed. Only a one-way hash of the visitor's address is kept, for a day,
// so the same visitor counts once an hour per item.
export async function addView(type: unknown, id: unknown): Promise<void> {
  if (!isType(type) || !Number.isInteger(id)) return;
  if (!(await countView(visitorKey(clientIp(await headers())), `${type}:${id}`))) return;
  const db = await getDb();
  const table = type === 'video' ? videos : posts;
  await db
    .update(table)
    .set({ views: sql`${table.views} + 1` })
    .where(and(eq(table.id, id as number), eq(table.published, true)));
}

// The bell is cleared once the notifications page has been opened
export async function markNotificationsSeen(): Promise<void> {
  try {
    const user = await requireUser();
    const db = await getDb();
    await db.update(users).set({ notificationsSeenAt: new Date() }).where(eq(users.id, user.id));
  } catch {
    // signed out: nothing to remember
  }
}

/* ---------- more comments / comment likes ---------- */

// The next page of comments (anyone can read them)
export async function loadComments(type: unknown, id: unknown, lang: unknown, sort: unknown, offset: unknown) {
  if (!isType(type) || !Number.isInteger(id) || !Number.isInteger(offset) || (offset as number) < 0) return { items: [], hasMore: false };
  const l = typeof lang === 'string' && isLang(lang) ? lang : 'vi';
  const me = await getSessionUser();
  const page = await getComments(type, id as number, { userId: me?.id, sort: (sort === 'new' ? 'new' : 'top') as CommentSort, offset: offset as number });
  return { items: toCommentItems(page.items, l), hasMore: page.hasMore };
}

export async function toggleCommentLike(commentId: unknown): Promise<Result<{ on: boolean; total: number }>> {
  try {
    if (!Number.isInteger(commentId)) return { ok: false, error: 'bad-input' };
    const user = await requireUser();
    if (!(await allow(user.id, 'react'))) return slowDown;
    const db = await getDb();
    const [c] = await db.select({ id: comments.id }).from(comments).where(and(eq(comments.id, commentId as number), eq(comments.hidden, false)));
    if (!c) return { ok: false, error: 'not-found' };
    const key = and(eq(commentLikes.userId, user.id), eq(commentLikes.commentId, c.id));
    const [existing] = await db.select().from(commentLikes).where(key);
    if (existing) await db.delete(commentLikes).where(key);
    else await db.insert(commentLikes).values({ userId: user.id, commentId: c.id }).onConflictDoNothing();
    const [{ n }] = await db.select({ n: count() }).from(commentLikes).where(eq(commentLikes.commentId, c.id));
    return { ok: true, on: !existing, total: n };
  } catch (e) {
    return fail(e);
  }
}
