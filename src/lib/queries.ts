import { and, asc, count, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { TargetType } from '@/db/schema';

const { tools, videos, posts, comments, likes, saves, subscriptions, users, commentLikes } = schema;

export type Tool = typeof tools.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type VideoWithTool = Video & { tool: Pick<Tool, 'id' | 'slug' | 'name' | 'nameEn' | 'iconUrl'> | null };

interface Opts {
  drafts?: boolean; // admin screens also see unpublished items
}

/* ---------- tools ---------- */

export async function getTools({ drafts = false }: Opts = {}): Promise<Tool[]> {
  const db = await getDb();
  return db.select().from(tools).where(drafts ? undefined : eq(tools.published, true)).orderBy(asc(tools.sortOrder), asc(tools.name));
}

export async function getToolBySlug(slug: string, { drafts = false }: Opts = {}): Promise<Tool | null> {
  const db = await getDb();
  const [row] = await db.select().from(tools).where(and(eq(tools.slug, slug), drafts ? undefined : eq(tools.published, true)));
  return row ?? null;
}

export async function getToolById(id: number): Promise<Tool | null> {
  const db = await getDb();
  const [row] = await db.select().from(tools).where(eq(tools.id, id));
  return row ?? null;
}

/* ---------- videos ---------- */

const videoWithTool = {
  video: videos,
  tool: { id: tools.id, slug: tools.slug, name: tools.name, nameEn: tools.nameEn, iconUrl: tools.iconUrl },
};

interface VideoFilter extends Opts {
  toolId?: number;
  vertical?: boolean;
  excludeId?: number;
  limit?: number;
}

export async function getVideos(f: VideoFilter = {}): Promise<VideoWithTool[]> {
  const db = await getDb();
  const where = and(
    f.drafts ? undefined : eq(videos.published, true),
    f.toolId != null ? eq(videos.toolId, f.toolId) : undefined,
    f.vertical != null ? eq(videos.vertical, f.vertical) : undefined,
    f.excludeId != null ? ne(videos.id, f.excludeId) : undefined,
  );
  const q = db.select(videoWithTool).from(videos).leftJoin(tools, eq(videos.toolId, tools.id)).where(where).orderBy(desc(videos.publishedAt));
  const rows = await (f.limit ? q.limit(f.limit) : q);
  return rows.map((r) => ({ ...r.video, tool: r.tool && r.tool.id != null ? r.tool : null }));
}

export async function getVideoBySlug(slug: string, { drafts = false }: Opts = {}): Promise<VideoWithTool | null> {
  const db = await getDb();
  const [r] = await db
    .select(videoWithTool)
    .from(videos)
    .leftJoin(tools, eq(videos.toolId, tools.id))
    .where(and(eq(videos.slug, slug), drafts ? undefined : eq(videos.published, true)));
  return r ? { ...r.video, tool: r.tool && r.tool.id != null ? r.tool : null } : null;
}

export async function getVideoById(id: number): Promise<Video | null> {
  const db = await getDb();
  const [row] = await db.select().from(videos).where(eq(videos.id, id));
  return row ?? null;
}

// Same tool first, then the newest of the rest
export async function getRelatedVideos(video: VideoWithTool, limit = 8): Promise<VideoWithTool[]> {
  const same = video.toolId != null ? await getVideos({ toolId: video.toolId, excludeId: video.id, limit }) : [];
  if (same.length >= limit) return same;
  const others = await getVideos({ excludeId: video.id, limit: limit * 2 });
  const seen = new Set(same.map((v) => v.id));
  return [...same, ...others.filter((v) => !seen.has(v.id))].slice(0, limit);
}

/* ---------- posts ---------- */

export async function getPosts({ drafts = false, limit, tag }: Opts & { limit?: number; tag?: string } = {}): Promise<Post[]> {
  const db = await getDb();
  const where = and(drafts ? undefined : eq(posts.published, true), tag ? sql`${tag} = ANY(${posts.tags})` : undefined);
  const q = db.select().from(posts).where(where).orderBy(desc(posts.publishedAt));
  return limit ? q.limit(limit) : q;
}

export async function getPostBySlug(slug: string, { drafts = false }: Opts = {}): Promise<Post | null> {
  const db = await getDb();
  const [row] = await db.select().from(posts).where(and(eq(posts.slug, slug), drafts ? undefined : eq(posts.published, true)));
  return row ?? null;
}

export async function getPostById(id: number): Promise<Post | null> {
  const db = await getDb();
  const [row] = await db.select().from(posts).where(eq(posts.id, id));
  return row ?? null;
}

export async function getAllTags(): Promise<string[]> {
  const rows = await getPosts();
  return [...new Set(rows.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, 'vi'));
}

// posts are newest first: the "previous" (older) post is the next in the list
export async function getNeighbours(post: Post): Promise<{ prev: Post | null; next: Post | null }> {
  const all = await getPosts();
  const i = all.findIndex((p) => p.id === post.id);
  return { prev: i >= 0 ? (all[i + 1] ?? null) : null, next: i > 0 ? all[i - 1] : null };
}

/* ---------- engagement ---------- */

export async function getEngagement(type: TargetType, id: number, userId?: string | null) {
  const db = await getDb();
  const [[likeRow], [commentRow]] = await Promise.all([
    db.select({ n: count() }).from(likes).where(and(eq(likes.targetType, type), eq(likes.targetId, id))),
    db
      .select({ n: count() })
      .from(comments)
      .where(and(eq(comments.targetType, type), eq(comments.targetId, id), eq(comments.hidden, false))),
  ]);
  let liked = false;
  let saved = false;
  if (userId) {
    const [l] = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.targetType, type), eq(likes.targetId, id)));
    const [s] = await db.select().from(saves).where(and(eq(saves.userId, userId), eq(saves.targetType, type), eq(saves.targetId, id)));
    liked = !!l;
    saved = !!s;
  }
  return { likes: likeRow.n, comments: commentRow.n, liked, saved };
}

export interface CommentView {
  id: number;
  parentId: number | null;
  body: string;
  createdAt: Date;
  edited: boolean;
  userId: string;
  userName: string;
  userImage: string | null;
  isAdmin: boolean;
  likes: number;
  liked: boolean;
}

export type CommentSort = 'top' | 'new';

// One page of top-level comments (with all their replies), sorted by likes ("top") or by date ("new").
// A personal site has few comments, so they are read in one go and paged here.
export async function getComments(
  type: TargetType,
  id: number,
  { userId, sort = 'top', offset = 0, limit = 20 }: { userId?: string | null; sort?: CommentSort; offset?: number; limit?: number } = {},
): Promise<{ items: CommentView[]; hasMore: boolean }> {
  const db = await getDb();
  const rows = await db
    .select({
      id: comments.id,
      parentId: comments.parentId,
      body: comments.body,
      createdAt: comments.createdAt,
      editedAt: comments.editedAt,
      userId: users.id,
      userName: users.name,
      userImage: users.image,
      role: users.role,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.targetType, type), eq(comments.targetId, id), eq(comments.hidden, false)))
    .orderBy(asc(comments.createdAt));
  if (rows.length === 0) return { items: [], hasMore: false };

  const ids = rows.map((r) => r.id);
  const [counts, mine] = await Promise.all([
    db.select({ id: commentLikes.commentId, n: count() }).from(commentLikes).where(inArray(commentLikes.commentId, ids)).groupBy(commentLikes.commentId),
    userId
      ? db.select({ id: commentLikes.commentId }).from(commentLikes).where(and(eq(commentLikes.userId, userId), inArray(commentLikes.commentId, ids)))
      : Promise.resolve([] as { id: number }[]),
  ]);
  const likeCount = new Map(counts.map((c) => [c.id, c.n]));
  const likedSet = new Set(mine.map((m) => m.id));
  const all: CommentView[] = rows.map((r) => ({
    id: r.id,
    parentId: r.parentId,
    body: r.body,
    createdAt: r.createdAt,
    edited: !!r.editedAt,
    userId: r.userId,
    userName: r.userName ?? 'Ẩn danh',
    userImage: r.userImage,
    isAdmin: r.role === 'admin',
    likes: likeCount.get(r.id) ?? 0,
    liked: likedSet.has(r.id),
  }));

  const top = all.filter((c) => c.parentId === null);
  top.sort((a, b) =>
    sort === 'top' ? b.likes - a.likes || b.createdAt.getTime() - a.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const page = top.slice(offset, offset + limit);
  const pageIds = new Set(page.map((c) => c.id));
  const replies = all.filter((c) => c.parentId !== null && pageIds.has(c.parentId));
  return { items: [...page, ...replies], hasMore: offset + limit < top.length };
}

/* ---------- follows ---------- */

export async function getSubscriptionScopes(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select({ scope: subscriptions.scope }).from(subscriptions).where(eq(subscriptions.userId, userId));
  return rows.map((r) => r.scope);
}

/* ---------- a member's own lists ---------- */

export async function getSavedItems(userId: string, kind: 'saves' | 'likes') {
  const db = await getDb();
  const table = kind === 'saves' ? saves : likes;
  const rows = await db.select().from(table).where(eq(table.userId, userId)).orderBy(desc(table.createdAt));
  const videoIds = rows.filter((r) => r.targetType === 'video').map((r) => r.targetId);
  const postIds = rows.filter((r) => r.targetType === 'post').map((r) => r.targetId);
  const [vids, pts] = await Promise.all([
    videoIds.length
      ? db.select(videoWithTool).from(videos).leftJoin(tools, eq(videos.toolId, tools.id)).where(and(inArray(videos.id, videoIds), eq(videos.published, true)))
      : Promise.resolve([]),
    postIds.length ? db.select().from(posts).where(and(inArray(posts.id, postIds), eq(posts.published, true))) : Promise.resolve([]),
  ]);
  return {
    videos: vids.map((r) => ({ ...r.video, tool: r.tool && r.tool.id != null ? r.tool : null })) as VideoWithTool[],
    posts: pts as Post[],
  };
}

/* ---------- numbers shown on feed cards ---------- */

export interface CardStat {
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
}

// Likes, comments and "did I like/save it" for many videos at once (a few queries, not one per card)
export async function getCardStats(ids: number[], userId?: string | null): Promise<Record<number, CardStat>> {
  const out: Record<number, CardStat> = Object.fromEntries(ids.map((id) => [id, { likes: 0, comments: 0, liked: false, saved: false }]));
  if (ids.length === 0) return out;
  const db = await getDb();
  const [likeRows, commentRows, mineLikes, mineSaves] = await Promise.all([
    db.select({ id: likes.targetId, n: count() }).from(likes).where(and(eq(likes.targetType, 'video'), inArray(likes.targetId, ids))).groupBy(likes.targetId),
    db
      .select({ id: comments.targetId, n: count() })
      .from(comments)
      .where(and(eq(comments.targetType, 'video'), inArray(comments.targetId, ids), eq(comments.hidden, false)))
      .groupBy(comments.targetId),
    userId ? db.select({ id: likes.targetId }).from(likes).where(and(eq(likes.userId, userId), eq(likes.targetType, 'video'), inArray(likes.targetId, ids))) : Promise.resolve([]),
    userId ? db.select({ id: saves.targetId }).from(saves).where(and(eq(saves.userId, userId), eq(saves.targetType, 'video'), inArray(saves.targetId, ids))) : Promise.resolve([]),
  ]);
  for (const r of likeRows) out[r.id].likes = r.n;
  for (const r of commentRows) out[r.id].comments = r.n;
  for (const r of mineLikes) out[r.id].liked = true;
  for (const r of mineSaves) out[r.id].saved = true;
  return out;
}

export async function getFollowerCount(scope: string): Promise<number> {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(subscriptions).where(eq(subscriptions.scope, scope));
  return row.n;
}

/* ---------- the bell ---------- */

export interface NotificationItem {
  kind: 'video' | 'tool';
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  toolName: string | null;
  toolNameEn: string | null;
  thumb: string | null;
  youtubeId: string | null;
  date: Date;
  isNew: boolean;
}

// New videos and tools from what this person follows (the whole channel or single tools).
// "New" means published after they last opened the notifications page (or after they started following).
export async function getNotifications(userId: string, limit = 30): Promise<{ items: NotificationItem[]; unread: number }> {
  const db = await getDb();
  const [subs, [me]] = await Promise.all([
    db.select().from(subscriptions).where(eq(subscriptions.userId, userId)),
    db.select({ seen: users.notificationsSeenAt }).from(users).where(eq(users.id, userId)),
  ]);
  if (subs.length === 0) return { items: [], unread: 0 };
  const everything = subs.some((x) => x.scope === 'all');
  const toolIds = new Set(subs.filter((x) => x.scope.startsWith('tool:')).map((x) => Number(x.scope.slice(5))));
  const firstFollow = new Date(Math.min(...subs.map((x) => x.createdAt.getTime())));
  const since = me?.seen ?? firstFollow;

  const [vids, tls] = await Promise.all([getVideos({ limit: 60 }), getTools()]);
  const items: NotificationItem[] = [
    ...vids
      .filter((v) => everything || (v.toolId != null && toolIds.has(v.toolId)))
      .map((v) => ({
        kind: 'video' as const,
        id: v.id,
        title: v.title,
        titleEn: v.titleEn,
        slug: v.slug,
        toolName: v.tool?.name ?? null,
        toolNameEn: v.tool?.nameEn ?? null,
        thumb: v.thumbnailUrl,
        youtubeId: v.youtubeId,
        date: v.publishedAt,
        isNew: v.publishedAt > since,
      })),
    ...tls
      .filter((x) => everything || toolIds.has(x.id))
      .map((x) => ({
        kind: 'tool' as const,
        id: x.id,
        title: x.name,
        titleEn: x.nameEn,
        slug: x.slug,
        toolName: x.name,
        toolNameEn: x.nameEn,
        thumb: x.iconUrl,
        youtubeId: null,
        date: x.createdAt,
        isNew: x.createdAt > since,
      })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
  return { items, unread: items.filter((i) => i.isNew).length };
}
