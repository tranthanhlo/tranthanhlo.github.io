import Link from 'next/link';
import { Badge, Notice, PageHead } from '@/components/admin/ui';
import { ToolIcon } from '@/components/ToolIcon';
import { getTools } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminTools({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const tools = await getTools({ drafts: true });
  return (
    <>
      <PageHead title="Tool" action={{ href: '/admin/tools/new', label: '+ Thêm tool' }} />
      {sp.saved && <Notice>Đã lưu.</Notice>}
      {sp.deleted && <Notice>Đã xóa.</Notice>}
      {tools.length === 0 && <p className="text-soft">Chưa có tool nào.</p>}
      <ul>
        {tools.map((x) => (
          <li key={x.id}>
            <Link href={`/admin/tools/${x.id}`} className="press flex min-h-14 items-center justify-between gap-3 border-b border-line">
              <span className="flex min-w-0 items-center gap-3">
                <ToolIcon name={x.name} iconUrl={x.iconUrl} size={36} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{x.name}</span>
                  <span className="block truncate text-xs text-faint">
                    #{x.sortOrder} · {x.platform ?? '—'}
                    {x.isSample && ' · mẫu'}
                  </span>
                </span>
              </span>
              <Badge on={x.published} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
