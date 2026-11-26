import Link from 'next/link';
import { Badge, Notice, PageHead } from '@/components/admin/ui';
import { getPosts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminPosts({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const posts = await getPosts({ drafts: true });
  return (
    <>
      <PageHead title="Bài viết" action={{ href: '/admin/posts/new', label: '+ Viết bài' }} />
      {sp.saved && <Notice>Đã lưu.</Notice>}
      {sp.deleted && <Notice>Đã xóa.</Notice>}
      {posts.length === 0 && <p className="text-soft">Chưa có bài nào.</p>}
      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/posts/${p.id}`} className="press flex min-h-14 items-center justify-between gap-3 border-b border-line">
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.title}</span>
                <span className="block truncate text-xs text-faint">
                  {p.publishedAt.toISOString().slice(0, 10)}
                  {p.titleEn && ' · có bản tiếng Anh'}
                  {p.isSample && ' · mẫu'}
                </span>
              </span>
              <Badge on={p.published} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
