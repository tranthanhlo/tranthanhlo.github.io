import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShortsFeed } from '@/components/ShortsFeed';
import { devLoginEnabled } from '@/lib/admin';
import { loadEngage } from '@/lib/feed';
import { href, isLang, pick, strings, t } from '@/lib/i18n';
import { getVideos } from '@/lib/queries';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: t(lang).shortsTitle, alternates: { languages: { vi: '/shorts', en: '/en/shorts' } } };
}

export default async function ShortsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const ui = t(lang);
  const videos = await getVideos({ vertical: true });
  if (videos.length === 0) {
    return <p className="pad page py-10 text-soft">{ui.shortsEmpty}</p>;
  }
  const me = await getSessionUser();
  const engageFor = await loadEngage(videos, lang);

  return (
    <ShortsFeed
      signedIn={!!me}
      dev={devLoginEnabled()}
      s={strings(lang, 'signInTitle', 'signInBody', 'signInGoogle', 'devLogin', 'close', 'like', 'liked', 'save', 'saved', 'share', 'copiedLink', 'openComments', 'mute', 'unmute', 'videoSoon', 'play')}
      items={videos.map((v) => {
        const e = engageFor(v);
        return {
          id: v.id,
          title: pick(lang, v.title, v.titleEn),
          path: href(lang, `/video/${v.slug}`),
          youtubeId: v.youtubeId,
          thumbnailUrl: v.thumbnailUrl,
          toolName: v.tool ? pick(lang, v.tool.name, v.tool.nameEn) : null,
          toolPath: v.tool ? href(lang, `/tool/${v.tool.slug}`) : null,
          toolIcon: v.tool?.iconUrl ?? null,
          likes: e.stat.likes,
          liked: e.stat.liked,
          saved: e.stat.saved,
        };
      })}
    />
  );
}
