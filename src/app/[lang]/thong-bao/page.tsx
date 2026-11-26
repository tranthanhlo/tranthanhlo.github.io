import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MarkSeen } from '@/components/MarkSeen';
import { Thumb } from '@/components/Thumb';
import { ToolIcon } from '@/components/ToolIcon';
import { href, isLang, pick, t, timeAgo } from '@/lib/i18n';
import { getNotifications } from '@/lib/queries';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Thông báo · Notifications', robots: { index: false } };

export default async function NotificationsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const me = await getSessionUser();
  if (!me) redirect(`/dang-nhap?next=${encodeURIComponent(href(lang, '/thong-bao'))}`);
  const ui = t(lang);
  const { items, unread } = await getNotifications(me.id);
  const now = Date.now();

  return (
    <div className="pad page max-w-2xl py-5">
      <MarkSeen unread={unread} />
      <h1 className="mb-4 text-2xl font-semibold">{ui.notifTitle}</h1>
      {items.length === 0 && <p className="text-soft">{ui.notifEmpty}</p>}
      <ul className="grid gap-1">
        {items.map((n) => {
          const title = pick(lang, n.title, n.titleEn);
          const tool = n.toolName ? pick(lang, n.toolName, n.toolNameEn) : '';
          const to = href(lang, n.kind === 'video' ? `/video/${n.slug}` : `/tool/${n.slug}`);
          return (
            <li key={`${n.kind}${n.id}`}>
              <Link href={to} className="press hoverable flex items-start gap-3 rounded-xl py-2">
                <span aria-hidden="true" className={`mt-4 size-2 shrink-0 rounded-full ${n.isNew ? 'bg-red-600' : 'bg-transparent'}`} />
                <ToolIcon name={tool || title} iconUrl={n.kind === 'tool' ? n.thumb : null} size={40} round />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[15px] leading-snug">
                    {n.kind === 'video' ? `${ui.notifVideo(tool || '')}: ${title}` : `${ui.notifTool}: ${title}`}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-faint">{timeAgo(n.date, lang, now)}</span>
                </span>
                {n.kind === 'video' && (
                  <span className="w-28 shrink-0 overflow-hidden rounded-lg">
                    <Thumb youtubeId={n.youtubeId} thumbnailUrl={n.thumb} title={title} toolName={tool} lang={lang} small />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
