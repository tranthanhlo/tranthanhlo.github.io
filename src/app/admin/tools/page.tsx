import { Notice, PageHead } from '@/components/admin/ui';
import { ToolOrderList } from '@/components/admin/ToolOrderList';
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
      {tools.length === 0 ? (
        <p className="text-soft">Chưa có tool nào.</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-faint">Kéo biểu tượng ⠿ hoặc bấm ↑ ↓ để đổi thứ tự hiển thị, rồi bấm Lưu thứ tự.</p>
          <ToolOrderList
            tools={tools.map((x) => ({ id: x.id, name: x.name, iconUrl: x.iconUrl, platform: x.platform, published: x.published, isSample: x.isSample }))}
          />
        </>
      )}
    </>
  );
}
