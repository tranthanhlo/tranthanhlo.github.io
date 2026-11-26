'use server';

import { and, eq, inArray, or } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb, schema } from '@/db';
import { escapeHtml, sendMails, type Mail } from '@/lib/email';
import { renderMarkdown } from '@/lib/markdown';
import { requireAdmin } from '@/lib/session';
import { SITE, SITE_URL } from '@/lib/site';
import { slugify } from '@/lib/text';
import { parseYoutubeId, youtubeThumb } from '@/lib/youtube';

const { tools, videos, posts, comments, likes, saves, subscriptions, users, notificationsSent } = schema;

/* ---------- reading the forms ---------- */

const text = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const orNull = (fd: FormData, k: string) => text(fd, k) || null;
const flag = (fd: FormData, k: string) => fd.get(k) === 'on';
const whole = (fd: FormData, k: string, d = 0) => {
  const n = Number.parseInt(text(fd, k), 10);
  return Number.isFinite(n) ? n : d;
};
// links must be web addresses (never javascript: or data:)
const url = (fd: FormData, k: string): string | null => {
  const v = text(fd, k);
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return v.startsWith('/uploads/') ? v : null;
  }
};
const dateOr = (fd: FormData, k: string, d: Date) => {
  const v = text(fd, k);
  const date = v ? new Date(v) : d;
  return Number.isNaN(date.getTime()) ? d : date;
};

// make "slug" unique by adding -2, -3 … when taken
async function uniqueSlug(table: typeof tools | typeof videos | typeof posts, wanted: string, selfId?: number): Promise<string> {
  const db = await getDb();
  const base = slugify(wanted) || 'moi';
  for (let i = 1; i < 100; i++) {
    const s = i === 1 ? base : `${base}-${i}`;
    const [hit] = await db.select({ id: table.id }).from(table).where(eq(table.slug, s));
    if (!hit || hit.id === selfId) return s;
  }
  return `${base}-${Date.now()}`;
}

/* ---------- videos ---------- */

export async function lookupYoutube(input: string): Promise<{ ok: true; id: string; title: string; thumbnail: string } | { ok: false }> {
  await requireAdmin();
  const id = parseYoutubeId(String(input));
  if (!id) return { ok: false };
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, { cache: 'no-store' });
    if (!res.ok) return { ok: true, id, title: '', thumbnail: youtubeThumb(id) };
    const data = (await res.json()) as { title?: string; thumbnail_url?: string };
    return { ok: true, id, title: data.title ?? '', thumbnail: data.thumbnail_url ?? youtubeThumb(id) };
  } catch {
    return { ok: true, id, title: '', thumbnail: youtubeThumb(id) };
  }
}

export async function saveVideo(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  const id = whole(fd, 'id');
  const title = text(fd, 'title');
  if (!title) redirect(id ? `/admin/videos/${id}?error=title` : '/admin/videos/new?error=title');

  const link = text(fd, 'youtube');
  const youtubeId = link ? parseYoutubeId(link) : null;
  if (link && !youtubeId) redirect(id ? `/admin/videos/${id}?error=youtube` : '/admin/videos/new?error=youtube');

  const values = {
    title,
    titleEn: orNull(fd, 'titleEn'),
    description: text(fd, 'description'),
    descriptionEn: orNull(fd, 'descriptionEn'),
    youtubeId,
    toolId: whole(fd, 'toolId') || null,
    duration: orNull(fd, 'duration'),
    vertical: flag(fd, 'vertical'),
    thumbnailUrl: url(fd, 'thumbnailUrl'),
    publishedAt: dateOr(fd, 'publishedAt', new Date()),
    published: flag(fd, 'published'),
    isSample: false,
  };
  if (id) {
    await db.update(videos).set({ ...values, slug: await uniqueSlug(videos, text(fd, 'slug') || title, id) }).where(eq(videos.id, id));
  } else {
    await db.insert(videos).values({ ...values, slug: await uniqueSlug(videos, text(fd, 'slug') || title) });
  }
  redirect('/admin/videos?saved=1');
}

export async function deleteVideo(fd: FormData) {
  await requireAdmin();
  const id = whole(fd, 'id');
  const db = await getDb();
  await removeEngagement('video', [id]);
  await db.delete(videos).where(eq(videos.id, id));
  redirect('/admin/videos?deleted=1');
}

/* ---------- tools ---------- */

export async function saveTool(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  const id = whole(fd, 'id');
  const name = text(fd, 'name');
  if (!name) redirect(id ? `/admin/tools/${id}?error=name` : '/admin/tools/new?error=name');

  const values = {
    name,
    nameEn: orNull(fd, 'nameEn'),
    tagline: text(fd, 'tagline'),
    taglineEn: orNull(fd, 'taglineEn'),
    description: text(fd, 'description'),
    descriptionEn: orNull(fd, 'descriptionEn'),
    iconUrl: url(fd, 'iconUrl'),
    platform: orNull(fd, 'platform'),
    downloadUrl: url(fd, 'downloadUrl'),
    githubUrl: url(fd, 'githubUrl'),
    docsUrl: url(fd, 'docsUrl'),
    status: fd.get('status') === 'released' ? ('released' as const) : ('dev' as const),
    sortOrder: whole(fd, 'sortOrder'),
    published: flag(fd, 'published'),
    isSample: false,
  };
  if (id) await db.update(tools).set({ ...values, slug: await uniqueSlug(tools, text(fd, 'slug') || name, id) }).where(eq(tools.id, id));
  else await db.insert(tools).values({ ...values, slug: await uniqueSlug(tools, text(fd, 'slug') || name) });
  redirect('/admin/tools?saved=1');
}

export async function deleteTool(fd: FormData) {
  await requireAdmin();
  const id = whole(fd, 'id');
  const db = await getDb();
  await db.delete(subscriptions).where(eq(subscriptions.scope, `tool:${id}`));
  await db.delete(tools).where(eq(tools.id, id)); // its videos stay, with no tool
  redirect('/admin/tools?deleted=1');
}

/* ---------- posts ---------- */

export async function savePost(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  const id = whole(fd, 'id');
  const title = text(fd, 'title');
  if (!title) redirect(id ? `/admin/posts/${id}?error=title` : '/admin/posts/new?error=title');

  const tags = text(fd, 'tags').split(',').map((s) => s.trim()).filter(Boolean);
  const values = {
    title,
    titleEn: orNull(fd, 'titleEn'),
    description: text(fd, 'description'),
    descriptionEn: orNull(fd, 'descriptionEn'),
    body: String(fd.get('body') ?? ''),
    bodyEn: orNull(fd, 'bodyEn') ? String(fd.get('bodyEn')) : null,
    coverUrl: url(fd, 'coverUrl'),
    tags,
    publishedAt: dateOr(fd, 'publishedAt', new Date()),
    published: flag(fd, 'published'),
    isSample: false,
  };
  if (id) await db.update(posts).set({ ...values, updatedAt: new Date(), slug: await uniqueSlug(posts, text(fd, 'slug') || title, id) }).where(eq(posts.id, id));
  else await db.insert(posts).values({ ...values, slug: await uniqueSlug(posts, text(fd, 'slug') || title) });
  redirect('/admin/posts?saved=1');
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const id = whole(fd, 'id');
  const db = await getDb();
  await removeEngagement('post', [id]);
  await db.delete(posts).where(eq(posts.id, id));
  redirect('/admin/posts?deleted=1');
}

// comments, likes and saves have no foreign key to the item, so they are cleared by hand
async function removeEngagement(type: 'video' | 'post', ids: number[]) {
  const db = await getDb();
  await db.delete(comments).where(and(eq(comments.targetType, type), inArray(comments.targetId, ids)));
  await db.delete(likes).where(and(eq(likes.targetType, type), inArray(likes.targetId, ids)));
  await db.delete(saves).where(and(eq(saves.targetType, type), inArray(saves.targetId, ids)));
}

/* ---------- editor helper ---------- */

export async function previewMarkdown(md: string): Promise<string> {
  await requireAdmin();
  return (await renderMarkdown(String(md ?? ''))).html;
}

/* ---------- moderation ---------- */

export async function setCommentHidden(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db.update(comments).set({ hidden: fd.get('hidden') === '1' }).where(eq(comments.id, whole(fd, 'id')));
  redirect('/admin/comments');
}

export async function setUserBanned(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  const userId = text(fd, 'userId');
  // an admin cannot lock themselves out
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (u && u.role !== 'admin') await db.update(users).set({ banned: fd.get('banned') === '1' }).where(eq(users.id, userId));
  redirect('/admin/comments');
}

/* ---------- "new video / tool" emails (sent by hand, once per item) ---------- */

export async function sendNotification(fd: FormData) {
  await requireAdmin();
  const kind = fd.get('kind') === 'tool' ? 'tool' : 'video';
  const id = whole(fd, 'id');
  const db = await getDb();

  const [already] = await db.select().from(notificationsSent).where(and(eq(notificationsSent.kind, kind), eq(notificationsSent.targetId, id)));
  if (already) redirect('/admin/notify?result=already');

  let title = '';
  let blurb = '';
  let path = '';
  const scopes: string[] = ['all'];
  if (kind === 'video') {
    const [v] = await db.select().from(videos).where(and(eq(videos.id, id), eq(videos.published, true)));
    if (!v) redirect('/admin/notify?result=missing');
    title = v.title;
    blurb = v.description.replace(/[#*_`>\[\]]/g, '').slice(0, 200);
    path = `/video/${v.slug}`;
    if (v.toolId) scopes.push(`tool:${v.toolId}`);
  } else {
    const [x] = await db.select().from(tools).where(and(eq(tools.id, id), eq(tools.published, true)));
    if (!x) redirect('/admin/notify?result=missing');
    title = x.name;
    blurb = x.tagline;
    path = `/tool/${x.slug}`;
    scopes.push(`tool:${x.id}`);
  }

  const rows = await db
    .select({ email: users.email, token: subscriptions.unsubscribeToken, userId: users.id })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .where(and(or(...scopes.map((s) => eq(subscriptions.scope, s))), eq(users.banned, false)));
  // one email per person, even if they follow both the channel and the tool
  const seen = new Set<string>();
  const mails: Mail[] = [];
  const link = `${SITE_URL}${path}`;
  for (const r of rows) {
    if (!r.email || seen.has(r.userId)) continue;
    seen.add(r.userId);
    const unsub = `${SITE_URL}/huy-theo-doi/${r.token}`;
    mails.push({
      to: r.email,
      subject: `${kind === 'video' ? 'Video mới' : 'Tool mới'}: ${title}`,
      unsubscribeUrl: unsub,
      text: `${title}\n\n${blurb}\n\nXem: ${link}\n\nHủy theo dõi: ${unsub}`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:16px">
<p style="color:#6b655a;font-size:13px;margin:0">${escapeHtml(SITE.name)}</p>
<h1 style="font-size:22px;margin:8px 0">${escapeHtml(title)}</h1>
<p style="color:#444">${escapeHtml(blurb)}</p>
<p><a href="${link}" style="display:inline-block;background:#85601e;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${kind === 'video' ? 'Xem video' : 'Xem tool'}</a></p>
<p style="color:#888;font-size:12px;margin-top:32px">Bạn nhận email này vì đã theo dõi. <a href="${unsub}" style="color:#888">Hủy theo dõi</a></p></div>`,
    });
  }

  const result = await sendMails(mails);
  if (result.error) redirect(`/admin/notify?result=error&msg=${encodeURIComponent(result.error)}`);
  if (result.dryRun) redirect(`/admin/notify?result=dry&n=${mails.length}`);
  await db.insert(notificationsSent).values({ kind, targetId: id, recipients: result.sent }).onConflictDoNothing();
  redirect(`/admin/notify?result=sent&n=${result.sent}`);
}
