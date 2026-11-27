// The write actions, run against a real Postgres (PGlite in memory) with a pretend signed-in person.
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as schema from '@/db/schema';
import { memoryDb, type TestDb } from './helpers.test-utils';

const state = vi.hoisted(() => ({ db: null as unknown, ip: '10.0.0.1', session: null as null | { user: { id: string; email: string; name: string } } }));

vi.mock('@/db', async () => ({ getDb: async () => state.db, schema: await import('@/db/schema') }));
vi.mock('@/auth', () => ({ auth: async () => state.session, signIn: vi.fn(), signOut: vi.fn(), handlers: {} }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-real-ip': state.ip }) }));
vi.mock('next/cache',() => ({ revalidateTag: vi.fn(), unstable_cache: (fn: () => unknown) => fn }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const engage = await import('@/actions/engage');
const admin = await import('@/actions/admin');
const { getComments, getNotifications } = await import('@/lib/queries');
const { allow } = await import('@/lib/rate-limit');

let db: TestDb;
const { users, tools, videos, comments, likes, subscriptions } = schema;
const ids = { video: 0, draft: 0, tool: 0 };

const as = (who: 'admin' | 'alice' | 'bob' | 'banned' | null) => {
  state.session = who ? { user: { id: who, email: `${who}@test.local`, name: who } } : null;
};

beforeAll(async () => {
  db = await memoryDb();
  state.db = db;
  await db.insert(users).values([
    { id: 'admin', email: 'admin@test.local', name: 'Admin', role: 'admin' },
    { id: 'alice', email: 'alice@test.local', name: 'Alice' },
    { id: 'bob', email: 'bob@test.local', name: 'Bob' },
    { id: 'banned', email: 'banned@test.local', name: 'Banned', banned: true },
  ]);
  const [t] = await db.insert(tools).values({ slug: 't', name: 'Tool', published: true }).returning();
  const [v] = await db.insert(videos).values({ slug: 'v', title: 'Video', toolId: t.id, published: true, publishedAt: new Date(Date.now() - 86_400_000) }).returning();
  const [d] = await db.insert(videos).values({ slug: 'd', title: 'Draft', published: false }).returning();
  Object.assign(ids, { video: v.id, draft: d.id, tool: t.id });
});

beforeEach(() => as(null));

describe('signed out', () => {
  it('cannot like, comment or follow', async () => {
    expect(await engage.toggleLike('video', ids.video)).toEqual({ ok: false, error: 'not-signed-in' });
    expect(await engage.addComment('video', ids.video, 'hi')).toEqual({ ok: false, error: 'not-signed-in' });
    expect(await engage.toggleFollow('all')).toEqual({ ok: false, error: 'not-signed-in' });
    expect(await engage.deleteComment(1)).toEqual({ ok: false, error: 'not-signed-in' });
  });
});

describe('likes', () => {
  it('turns on and off and never doubles', async () => {
    as('alice');
    expect(await engage.toggleLike('video', ids.video)).toMatchObject({ ok: true, on: true, total: 1 });
    expect(await engage.toggleLike('video', ids.video)).toMatchObject({ ok: true, on: false, total: 0 });
    await Promise.all([engage.toggleLike('video', ids.video), engage.toggleLike('video', ids.video)]);
    const rows = await db.select().from(likes).where(eq(likes.userId, 'alice'));
    expect(rows.length).toBeLessThanOrEqual(1);
  });
  it('refuses drafts and bad input', async () => {
    as('alice');
    expect(await engage.toggleLike('video', ids.draft)).toEqual({ ok: false, error: 'not-found' });
    expect(await engage.toggleLike('evil', ids.video)).toEqual({ ok: false, error: 'bad-input' });
    expect(await engage.toggleLike('video', 'x')).toEqual({ ok: false, error: 'bad-input' });
  });
});

describe('comments', () => {
  it('keeps HTML as plain text and checks length and links', async () => {
    as('bob');
    expect(await engage.addComment('video', ids.video, '   ')).toEqual({ ok: false, error: 'empty' });
    expect(await engage.addComment('video', ids.video, 'x'.repeat(2001))).toEqual({ ok: false, error: 'too-long' });
    expect(await engage.addComment('video', ids.video, 'https://a.b https://c.d https://e.f')).toEqual({ ok: false, error: 'too-many-links' });
    expect(await engage.addComment('video', ids.video, '<img src=x onerror=alert(1)>')).toMatchObject({ ok: true });
    const [row] = await db.select().from(comments).where(eq(comments.userId, 'bob'));
    expect(row.body).toBe('<img src=x onerror=alert(1)>');
  });
  it('makes people wait 20 seconds between comments', async () => {
    as('bob');
    expect(await engage.addComment('video', ids.video, 'again')).toEqual({ ok: false, error: 'too-fast' });
  });
  it('only lets the author edit, and the author or the admin delete', async () => {
    const [c] = await db.select().from(comments).where(eq(comments.userId, 'bob'));
    as('alice');
    expect(await engage.editComment(c.id, 'hacked')).toEqual({ ok: false, error: 'forbidden' });
    expect(await engage.deleteComment(c.id)).toEqual({ ok: false, error: 'forbidden' });
    as('admin');
    expect(await engage.editComment(c.id, 'admin edit')).toEqual({ ok: false, error: 'forbidden' });
    as('bob');
    expect(await engage.editComment(c.id, 'fixed')).toMatchObject({ ok: true });
    as('admin');
    expect(await engage.deleteComment(c.id)).toEqual({ ok: true });
  });
  it('blocks banned people', async () => {
    as('banned');
    expect(await engage.addComment('video', ids.video, 'hello')).toEqual({ ok: false, error: 'banned' });
  });
  it('holds comments with blocked words for review', async () => {
    await db.insert(schema.settings).values({ key: 'blocked_words', value: 'quảng cáo' });
    as('alice');
    expect(await engage.addComment('video', ids.video, 'Mua QUANG CAO đi')).toEqual({ ok: true, held: true });
    const [row] = await db.select().from(comments).where(eq(comments.userId, 'alice'));
    expect(row.hidden).toBe(true);
    const page = await getComments('video', ids.video);
    expect(page.items.find((c) => c.id === row.id)).toBeUndefined();
  });
  it('allows only one level of replies', async () => {
    const [parent] = await db.insert(comments).values({ userId: 'bob', targetType: 'video', targetId: ids.video, body: 'top', createdAt: new Date(Date.now() - 60_000) }).returning();
    const [reply] = await db.insert(comments).values({ userId: 'bob', targetType: 'video', targetId: ids.video, parentId: parent.id, body: 'reply', createdAt: new Date(Date.now() - 60_000) }).returning();
    as('admin');
    expect(await engage.addComment('video', ids.video, 'reply to a reply', reply.id)).toEqual({ ok: false, error: 'bad-input' });
  });
});

describe('comment pages and likes', () => {
  it('pages 20 at a time and sorts by likes', async () => {
    await db.delete(comments);
    const rows = await db
      .insert(comments)
      .values(Array.from({ length: 25 }, (_, i) => ({ userId: 'bob', targetType: 'video' as const, targetId: ids.video, body: `c${i}`, createdAt: new Date(Date.now() - (25 - i) * 1000) })))
      .returning();
    as('alice');
    expect(await engage.toggleCommentLike(rows[3].id)).toMatchObject({ ok: true, on: true, total: 1 });
    expect(await engage.toggleCommentLike(rows[3].id)).toMatchObject({ ok: true, on: false, total: 0 });
    await engage.toggleCommentLike(rows[3].id);

    const first = await getComments('video', ids.video, { userId: 'alice', sort: 'top' });
    expect(first.items.length).toBe(20);
    expect(first.hasMore).toBe(true);
    expect(first.items[0]).toMatchObject({ body: 'c3', likes: 1, liked: true });
    const second = await getComments('video', ids.video, { sort: 'top', offset: 20 });
    expect(second.items.length).toBe(5);
    expect(second.hasMore).toBe(false);
    const newest = await getComments('video', ids.video, { sort: 'new' });
    expect(newest.items[0].body).toBe('c24');
  });
});

describe('rate limits', () => {
  it('stops after 60 reactions a minute', async () => {
    for (let i = 0; i < 60; i++) expect(await allow('bob', 'react')).toBe(true);
    expect(await allow('bob', 'react')).toBe(false);
    as('bob');
    expect(await engage.toggleLike('video', ids.video)).toEqual({ ok: false, error: 'rate-limited' });
  });
});

describe('the bell', () => {
  it('counts what is new since following, and clears when seen', async () => {
    as('alice');
    expect(await engage.toggleFollow(`tool:${ids.tool}`)).toEqual({ ok: true, on: true });
    expect((await getNotifications('alice')).unread).toBe(0); // the video was published before she followed
    await db.insert(videos).values({ slug: 'new', title: 'New', toolId: ids.tool, published: true, publishedAt: new Date(Date.now() + 1000) });
    expect((await getNotifications('alice')).unread).toBe(1);
    await engage.markNotificationsSeen();
    await db.update(users).set({ notificationsSeenAt: new Date(Date.now() + 5000) }).where(eq(users.id, 'alice'));
    expect((await getNotifications('alice')).unread).toBe(0);
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, 'alice'));
    expect(sub.unsubscribeToken).toMatch(/^[a-f0-9]{32}$/);
  });
});

describe('views', () => {
  it('counts published items only', async () => {
    state.ip = '10.0.0.1';
    await engage.addView('video', ids.video);
    await engage.addView('video', ids.draft);
    const [v] = await db.select().from(videos).where(eq(videos.id, ids.video));
    const [d] = await db.select().from(videos).where(eq(videos.id, ids.draft));
    expect(v.views).toBe(1);
    expect(d.views).toBe(0);
  });
  it('counts the same visitor once an hour, and never stores the address', async () => {
    state.ip = '10.0.0.2';
    await engage.addView('video', ids.video);
    await engage.addView('video', ids.video);
    state.ip = '10.0.0.3';
    await engage.addView('video', ids.video);
    const [v] = await db.select().from(videos).where(eq(videos.id, ids.video));
    expect(v.views).toBe(3); // 1 from the test above + 2 visitors
    const rows = await db.select().from(schema.viewEvents);
    expect(rows.some((r) => r.visitor.includes('10.0.0'))).toBe(false);
  });
  it('caps one visitor at 120 views an hour', async () => {
    const { countView, VIEW_MAX_PER_WINDOW } = await import('@/lib/views');
    let counted = 0;
    for (let i = 0; i < VIEW_MAX_PER_WINDOW + 5; i++) if (await countView('pump', `video:${1000 + i}`)) counted++;
    expect(counted).toBe(VIEW_MAX_PER_WINDOW);
  });
});

describe('admin actions', () => {
  const form = (fields: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    return fd;
  };
  it('refuse members and visitors', async () => {
    as('alice');
    await expect(admin.saveVideo(form({ title: 'x' }))).rejects.toThrow('not-admin');
    await expect(admin.reorderTools([ids.tool])).rejects.toThrow('not-admin');
    as(null);
    await expect(admin.deleteVideo(form({ id: String(ids.video) }))).rejects.toThrow('not-admin');
  });
  it('save a video from a YouTube link for the admin', async () => {
    as('admin');
    await expect(admin.saveVideo(form({ title: 'Từ admin', youtube: 'https://youtu.be/jNQXAC9IVRw', published: 'on' }))).rejects.toThrow('REDIRECT:/admin/videos?saved=1');
    const [row] = await db.select().from(videos).where(eq(videos.title, 'Từ admin'));
    expect(row).toMatchObject({ youtubeId: 'jNQXAC9IVRw', published: true, slug: 'tu-admin' });
    const log = await db.select().from(schema.adminEvents).where(eq(schema.adminEvents.action, 'video.create'));
    expect(log).toMatchObject([{ email: 'admin@test.local', target: 'Từ admin' }]);
  });
  it('log nothing for refused attempts', async () => {
    as('alice');
    await expect(admin.deletePost(form({ id: '1' }))).rejects.toThrow('not-admin');
    const log = await db.select().from(schema.adminEvents).where(eq(schema.adminEvents.email, 'alice@test.local'));
    expect(log).toEqual([]);
  });
  it('never store javascript: links for tools', async () => {
    as('admin');
    await expect(admin.saveTool(form({ name: 'Evil', downloadUrl: 'javascript:alert(1)', githubUrl: 'https://github.com/x' }))).rejects.toThrow('REDIRECT');
    const [row] = await db.select().from(tools).where(eq(tools.name, 'Evil'));
    expect(row.downloadUrl).toBeNull();
    expect(row.githubUrl).toBe('https://github.com/x');
  });
});
