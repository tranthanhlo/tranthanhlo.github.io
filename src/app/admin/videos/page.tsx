import Link from 'next/link';
import { Badge, Notice, PageHead } from '@/components/admin/ui';
import { getVideos } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminVideos({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const videos = await getVideos({ drafts: true });
  return (
    <>
      <PageHead title="Video" action={{ href: '/admin/videos/new', label: '+ Thêm video' }} />
      {sp.saved && <Notice>Đã lưu.</Notice>}
      {sp.deleted && <Notice>Đã xóa.</Notice>}
      {videos.length === 0 && <p className="text-soft">Chưa có video nào.</p>}
      <ul>
        {videos.map((v) => (
          <li key={v.id}>
            <Link href={`/admin/videos/${v.id}`} className="press flex min-h-14 items-center justify-between gap-3 border-b border-line">
              <span className="min-w-0">
                <span className="block truncate font-medium">{v.title}</span>
                <span className="block truncate text-xs text-faint">
                  {v.tool?.name ?? 'Không có tool'} · {v.youtubeId ? 'YouTube' : 'chưa có video'}
                  {v.isSample && ' · mẫu'}
                </span>
              </span>
              <Badge on={v.published} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
