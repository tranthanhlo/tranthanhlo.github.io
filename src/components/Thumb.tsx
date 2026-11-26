import { coverStyle } from '@/lib/hue';
import { youtubeThumb } from '@/lib/youtube';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';

interface Props {
  youtubeId?: string | null;
  thumbnailUrl?: string | null;
  title: string;
  toolName?: string | null;
  vertical?: boolean;
  lang: Lang;
  sizes?: string;
  className?: string;
}

// The video's picture. With no real picture yet (sample videos), draws a plain card with the tool name.
export function Thumb({ youtubeId, thumbnailUrl, title, toolName, vertical = false, lang, className = '' }: Props) {
  const src = thumbnailUrl || (youtubeId ? youtubeThumb(youtubeId) : null);
  const box = vertical ? 'aspect-[9/16]' : 'aspect-video';
  if (src) {
    return (
      <div className={`${box} overflow-hidden bg-surface ${className}`}>
        <img src={src} alt="" loading="lazy" className="size-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${box} relative grid place-items-center overflow-hidden p-4 text-center ${className}`} style={coverStyle(toolName ?? title)} role="img" aria-label={title}>
      <div>
        <p className="text-2xl font-extrabold uppercase leading-tight tracking-tight text-white">{toolName ?? title}</p>
        <p className="mt-2 inline-block rounded bg-black/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">{t(lang).videoSoon}</p>
      </div>
    </div>
  );
}
