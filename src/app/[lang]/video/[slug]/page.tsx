import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionBar } from '@/components/ActionBar';
import { Comments } from '@/components/Comments';
import { Expandable } from '@/components/Expandable';
import { LitePlayer } from '@/components/LitePlayer';
import { PlayerSlot } from '@/components/player/PlayerSlot';
import { SubscribeButton } from '@/components/SubscribeButton';
import { ToolIcon } from '@/components/ToolIcon';
import { ViewPing } from '@/components/ViewPing';
import { VideoCard } from '@/components/VideoCard';
import { devLoginEnabled } from '@/lib/admin';
import { href, isLang, pick, strings, t, timeAgo } from '@/lib/i18n';
import { renderMarkdown } from '@/lib/markdown';
import { getComments, getEngagement, getFollowerCount, getRelatedVideos, getSubscriptionScopes, getVideoBySlug } from '@/lib/queries';
import { loadEngage } from '@/lib/feed';
import { getSessionUser } from '@/lib/session';
import { toCommentItems } from '@/lib/comments';
import { youtubeEmbed, youtubeThumb } from '@/lib/youtube';
import { abs } from '@/lib/site';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const video = await getVideoBySlug(slug);
  if (!video) return {};
  const title = pick(lang, video.title, video.titleEn);
  const description = pick(lang, video.description, video.descriptionEn).replace(/[#*_`>\[\]]/g, '').slice(0, 160);
  const image = video.thumbnailUrl || (video.youtubeId ? youtubeThumb(video.youtubeId) : undefined);
  return {
    title,
    description,
    openGraph: { title, description, type: 'video.other', images: image ? [image] : undefined },
    twitter: { card: image ? 'summary_large_image' : 'summary' },
    alternates: { languages: { vi: `/video/${slug}`, en: `/en/video/${slug}` } },
  };
}

export default async function VideoPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const video = await getVideoBySlug(slug);
  if (!video) notFound();

  const ui = t(lang);
  const me = await getSessionUser();
  const [engagement, comments, related, scopes, desc, followers] = await Promise.all([
    getEngagement('video', video.id, me?.id),
    getComments('video', video.id, { userId: me?.id }),
    getRelatedVideos(video),
    me ? getSubscriptionScopes(me.id) : Promise.resolve([] as string[]),
    renderMarkdown(pick(lang, video.description, video.descriptionEn)),
    video.toolId ? getFollowerCount(`tool:${video.toolId}`) : Promise.resolve(0),
  ]);
  const engageFor = await loadEngage(related, lang);

  const title = pick(lang, video.title, video.titleEn);
  const tool = video.tool;
  const toolName = tool ? pick(lang, tool.name, tool.nameEn) : null;
  const dev = devLoginEnabled();
  const signIn = strings(lang, 'signInTitle', 'signInBody', 'signInGoogle', 'devLogin', 'close');
  const now = Date.now();

  // structured data so search engines understand this is a video
  const ld = video.youtubeId
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: title,
        description: pick(lang, video.description, video.descriptionEn).replace(/[#*_`>\[\]]/g, '').slice(0, 300) || title,
        thumbnailUrl: video.thumbnailUrl || youtubeThumb(video.youtubeId),
        uploadDate: video.publishedAt.toISOString(),
        embedUrl: youtubeEmbed(video.youtubeId).split('?')[0],
        url: abs(href(lang, `/video/${video.slug}`)),
      }
    : null;

  return (
    <div className="page lg:flex lg:gap-6 lg:px-6 lg:pt-4">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
      <ViewPing type="video" id={video.id} />
      <div className="min-w-0 flex-1">
        {/* the player stays at the top while the page scrolls */}
        <div className={`bg-black max-lg:pt-[env(safe-area-inset-top)] lg:static lg:overflow-hidden lg:rounded-xl ${video.vertical ? '' : 'sticky top-0 z-30'}`}>
          {video.youtubeId ? (
            <PlayerSlot
              video={{ id: video.id, youtubeId: video.youtubeId, title, subtitle: toolName ?? '', path: href(lang, `/video/${video.slug}`), vertical: video.vertical }}
              thumbnailUrl={video.thumbnailUrl}
              playLabel={ui.play}
            />
          ) : (
            <LitePlayer youtubeId={null} thumbnailUrl={video.thumbnailUrl} title={title} toolName={toolName} vertical={video.vertical} s={strings(lang, 'play', 'videoSoon')} />
          )}
        </div>

        <div className="pad grid gap-4 py-4 lg:px-0">
          <div>
            <h1 className="text-[17px] font-semibold leading-snug">{title}</h1>
            <p className="mt-1 text-[13px] text-faint">
              {ui.viewsCount(video.views)} · {timeAgo(video.publishedAt, lang, now)}
              {video.isSample && <span className="ml-2 font-semibold uppercase text-soft">{ui.sample}</span>}
            </p>
          </div>

          {tool && (
            <div className="flex items-center gap-3">
              <Link href={href(lang, `/tool/${tool.slug}`)} className="press flex min-h-12 min-w-0 flex-1 items-center gap-3">
                <ToolIcon name={toolName ?? ''} iconUrl={tool.iconUrl} size={40} round />
                <span className="min-w-0">
                  <span className="block truncate font-semibold leading-tight">{toolName}</span>
                  <span className="block truncate text-xs text-faint">{ui.subscribersCount(followers)}</span>
                </span>
              </Link>
              <SubscribeButton scope={`tool:${tool.id}`} initial={scopes.includes(`tool:${tool.id}`)} signedIn={!!me} dev={dev} s={{ ...signIn, ...strings(lang, 'follow', 'following') }} />
            </div>
          )}

          <ActionBar
            type="video"
            id={video.id}
            title={title}
            signedIn={!!me}
            dev={dev}
            initial={{ likes: engagement.likes, liked: engagement.liked, saved: engagement.saved }}
            s={{ ...signIn, ...strings(lang, 'like', 'liked', 'save', 'saved', 'share', 'copiedLink') }}
          />

          {video.isSample && <p className="rounded-xl border border-line p-3 text-sm text-soft">{ui.sampleNote}</p>}

          {(desc.html || video.isSample) && (
            <Expandable html={desc.html} more={ui.showMore} less={ui.showLess} long={pick(lang, video.description, video.descriptionEn).length > 160} />
          )}

          <Comments
            type="video"
            id={video.id}
            me={me ? { id: me.id, isAdmin: me.isAdmin } : null}
            dev={dev}
            items={toCommentItems(comments.items, lang, now)}
            hasMore={comments.hasMore}
            total={engagement.comments}
            lang={lang}
            s={{ ...signIn, ...strings(lang, 'comments', 'noComments', 'commentPlaceholder', 'send', 'reply', 'edit', 'delete', 'cancel', 'errTooFast', 'errEmpty', 'errTooLong', 'errBanned', 'errGeneric', 'loadMoreComments', 'sortTop', 'sortNew', 'like', 'liked', 'errLinks', 'errRate', 'commentHeld') }}
          />
        </div>
      </div>

      {related.length > 0 && (
        <aside className="pb-6 lg:w-[400px] lg:shrink-0" aria-label={ui.related}>
          {/* phone: full cards like the feed; wide screen: a compact side list */}
          <div className="grid gap-3 lg:hidden">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} lang={lang} engage={engageFor(v)} now={now} />
            ))}
          </div>
          <div className="hidden gap-4 lg:grid">
            <h2 className="text-base font-semibold">{ui.related}</h2>
            {related.map((v) => (
              <VideoCard key={v.id} video={v} lang={lang} compact now={now} />
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
