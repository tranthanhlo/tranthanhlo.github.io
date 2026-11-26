import Link from 'next/link';
import { CardActions, type CardActionText } from './CardActions';
import { FeedMedia } from './FeedMedia';
import { Thumb } from './Thumb';
import { ToolIcon } from './ToolIcon';
import { href, pick, t, timeAgo, type Lang } from '@/lib/i18n';
import type { CardStat, VideoWithTool } from '@/lib/queries';

export interface Engage {
  stat: CardStat;
  signedIn: boolean;
  dev: boolean;
  s: CardActionText;
}

// A feed card in the style of the phone app: picture on top, then title, then a row with
// the tool's round picture, its name and how long ago, and the like / comment / save / share buttons.
export function VideoCard({ video, lang, compact = false, engage, now = Date.now() }: { video: VideoWithTool; lang: Lang; compact?: boolean; engage?: Engage; now?: number }) {
  const title = pick(lang, video.title, video.titleEn);
  const toolName = video.tool ? pick(lang, video.tool.name, video.tool.nameEn) : null;
  const ui = t(lang);
  const path = href(lang, `/video/${video.slug}`);

  if (compact) {
    // side-by-side row for "related videos"
    return (
      <Link href={path} className="press flex gap-3">
        <div className="relative w-40 shrink-0 overflow-hidden rounded-xl">
          <Thumb youtubeId={video.youtubeId} thumbnailUrl={video.thumbnailUrl} title={title} toolName={toolName} lang={lang} small />
          {video.duration && <Duration text={video.duration} />}
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{title}</h3>
          <p className="mt-1 text-xs text-faint">
            {toolName ? `${toolName} · ` : ''}
            {ui.viewsCount(video.views)} · {timeAgo(video.publishedAt, lang, now)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <article className="overflow-hidden rounded-[20px] bg-card">
      <FeedMedia href={path} youtubeId={video.youtubeId} title={title} labels={{ mute: ui.mute, unmute: ui.unmute }}>
        <Thumb youtubeId={video.youtubeId} thumbnailUrl={video.thumbnailUrl} title={title} toolName={toolName} lang={lang} />
        {video.duration && <Duration text={video.duration} />}
        {video.isSample && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">{ui.sample}</span>
        )}
      </FeedMedia>
      <div className="px-4 pb-2 pt-3">
        <h3 className="line-clamp-2 text-[17px] font-medium leading-snug">
          <Link href={path}>{title}</Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3">
          {video.tool ? (
            <Link href={href(lang, `/tool/${video.tool.slug}`)} className="press shrink-0" aria-label={toolName ?? ''}>
              <ToolIcon name={toolName ?? ''} iconUrl={video.tool.iconUrl} size={40} round />
            </Link>
          ) : (
            <ToolIcon name={title} size={40} round />
          )}
          <div className="min-w-[5.5rem] flex-1 text-[13px] leading-snug text-faint">
            <p className="truncate font-medium text-soft">{toolName ?? ' '}</p>
            <p className="truncate">
              {ui.viewsCount(video.views)} · {timeAgo(video.publishedAt, lang, now)}
            </p>
          </div>
          {engage && (
            <CardActions
              id={video.id}
              title={title}
              path={path}
              signedIn={engage.signedIn}
              dev={engage.dev}
              initial={{ liked: engage.stat.liked, saved: engage.stat.saved }}
              s={engage.s}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function Duration({ text }: { text: string }) {
  return <span className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">{text}</span>;
}
