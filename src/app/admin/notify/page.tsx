import { count } from 'drizzle-orm';
import { sendNotification } from '@/actions/admin';
import { ConfirmButton } from '@/components/ConfirmButton';
import { btnGhost, Notice, PageHead } from '@/components/admin/ui';
import { getDb, schema } from '@/db';
import { emailConfigured } from '@/lib/email';
import { getTools, getVideos } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const MESSAGES: Record<string, string> = {
  already: 'Mục này đã được gửi thông báo rồi, không gửi lần hai.',
  missing: 'Không tìm thấy mục này, hoặc mục chưa được đăng công khai.',
};

export default async function AdminNotify({ searchParams }: { searchParams: Promise<{ result?: string; n?: string; msg?: string }> }) {
  const sp = await searchParams;
  const db = await getDb();
  const { notificationsSent, subscriptions } = schema;
  const [sent, perScope, videos, tools] = await Promise.all([
    db.select().from(notificationsSent),
    db.select({ scope: subscriptions.scope, n: count() }).from(subscriptions).groupBy(subscriptions.scope),
    getVideos(),
    getTools(),
  ]);
  const wasSent = (kind: string, id: number) => sent.some((s) => s.kind === kind && s.targetId === id);
  const followers = (scope: string) => perScope.find((p) => p.scope === scope)?.n ?? 0;

  const item = (kind: 'video' | 'tool', id: number, title: string, extra: string, reach: number) => (
    <li key={`${kind}${id}`} className="flex items-center justify-between gap-3 border-b border-line py-2">
      <span className="min-w-0">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-xs text-faint">{extra} · khoảng {reach} người nhận</span>
      </span>
      {wasSent(kind, id) ? (
        <span className="shrink-0 text-sm text-faint">Đã gửi</span>
      ) : (
        <form action={sendNotification}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          <ConfirmButton message={`Gửi email thông báo “${title}” cho người theo dõi? Mỗi mục chỉ gửi được một lần.`} className={btnGhost}>
            Gửi thông báo
          </ConfirmButton>
        </form>
      )}
    </li>
  );

  return (
    <>
      <PageHead title="Thông báo" />
      <p className="mb-4 text-sm text-soft">
        Gửi email cho người theo dõi khi có video hoặc tool mới. Gửi bằng tay, mỗi mục một lần. Người theo dõi cả kênh: <strong>{followers('all')}</strong>.
      </p>
      {!emailConfigured() && (
        <Notice>
          Chưa cấu hình gửi email (thiếu RESEND_API_KEY hoặc EMAIL_FROM). Bấm gửi lúc này chỉ đếm số người sẽ nhận, chưa gửi gì và chưa đánh dấu là đã gửi.
        </Notice>
      )}
      {sp.result === 'sent' && <Notice>Đã gửi cho {sp.n} người.</Notice>}
      {sp.result === 'dry' && <Notice>Chạy thử: sẽ gửi cho {sp.n} người. Chưa gửi email nào.</Notice>}
      {sp.result === 'error' && <Notice kind="error">Gửi lỗi: {sp.msg}</Notice>}
      {sp.result && MESSAGES[sp.result] && <Notice kind="error">{MESSAGES[sp.result]}</Notice>}

      <h2 className="mb-1 mt-6 font-semibold">Video</h2>
      <ul>{videos.map((v) => item('video', v.id, v.title, v.tool?.name ?? 'Không có tool', followers('all') + (v.toolId ? followers(`tool:${v.toolId}`) : 0)))}</ul>
      <h2 className="mb-1 mt-8 font-semibold">Tool</h2>
      <ul>{tools.map((x) => item('tool', x.id, x.name, x.platform ?? '—', followers('all') + followers(`tool:${x.id}`)))}</ul>
      {videos.length + tools.length === 0 && <p className="text-soft">Chưa có gì để thông báo.</p>}
    </>
  );
}
