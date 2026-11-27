import Link from 'next/link';
import { count, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { Badge, PageHead } from '@/components/admin/ui';
import { getPosts, getVideos } from '@/lib/queries';
import { recentAdminEvents } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const db = await getDb();
  const { videos, tools, posts, comments, users, subscriptions } = schema;
  const [[v], [t], [p], [c], [u], [s]] = await Promise.all([
    db.select({ n: count() }).from(videos),
    db.select({ n: count() }).from(tools),
    db.select({ n: count() }).from(posts),
    db.select({ n: count() }).from(comments).where(eq(comments.hidden, false)),
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(subscriptions),
  ]);
  const [recentVideos, recentPosts, log] = await Promise.all([getVideos({ drafts: true, limit: 5 }), getPosts({ drafts: true, limit: 5 }), recentAdminEvents(30)]);

  const stats = [
    { label: 'Video', n: v.n, to: '/admin/videos' },
    { label: 'Tool', n: t.n, to: '/admin/tools' },
    { label: 'Bài viết', n: p.n, to: '/admin/posts' },
    { label: 'Bình luận', n: c.n, to: '/admin/comments' },
    { label: 'Thành viên', n: u.n, to: '/admin/comments' },
    { label: 'Lượt theo dõi', n: s.n, to: '/admin/notify' },
  ];

  return (
    <>
      <PageHead title="Tổng quan" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((x) => (
          <Link key={x.label} href={x.to} className="press rounded-2xl bg-surface p-4">
            <p className="text-sm text-faint">{x.label}</p>
            <p className="text-3xl font-semibold">{x.n}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-2 font-semibold">Video mới sửa</h2>
          <ul>
            {recentVideos.map((x) => (
              <li key={x.id}>
                <Link href={`/admin/videos/${x.id}`} className="press flex min-h-12 items-center justify-between gap-3 border-b border-line">
                  <span className="truncate">{x.title}</span>
                  <Badge on={x.published} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold">Bài viết mới sửa</h2>
          <ul>
            {recentPosts.map((x) => (
              <li key={x.id}>
                <Link href={`/admin/posts/${x.id}`} className="press flex min-h-12 items-center justify-between gap-3 border-b border-line">
                  <span className="truncate">{x.title}</span>
                  <Badge on={x.published} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-2 font-semibold">Nhật ký admin</h2>
        {log.length === 0 ? (
          <p className="text-sm text-faint">Chưa có thao tác nào.</p>
        ) : (
          <ul className="text-sm">
            {log.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-3 border-b border-line py-2">
                <time className="text-faint tabular-nums" dateTime={e.createdAt.toISOString()}>
                  {e.createdAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </time>
                <span className="font-medium">{e.action}</span>
                <span className="min-w-0 truncate">{e.target}</span>
                <span className="ml-auto text-faint">{e.email}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
