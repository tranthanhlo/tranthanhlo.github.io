'use client';

import { useState } from 'react';
import { Icon } from './Icon';
import { coverStyle } from '@/lib/hue';
import { youtubeEmbed, youtubeThumb } from '@/lib/youtube';

interface Props {
  youtubeId: string | null;
  thumbnailUrl?: string | null;
  title: string;
  toolName?: string | null;
  vertical?: boolean;
  s: { play: string; videoSoon: string };
}

// Shows the picture and a play button. The YouTube player is only loaded after a tap,
// so the page stays light and YouTube sets no cookies until the viewer asks for the video.
export function LitePlayer({ youtubeId, thumbnailUrl, title, toolName, vertical = false, s }: Props) {
  const [playing, setPlaying] = useState(false);
  // a short (vertical) video is narrower than the screen, so the page does not scroll away from the info below it
  const box = vertical ? 'mx-auto' : 'aspect-video';
  const boxStyle = vertical ? { width: 'min(100%, calc(68dvh * 9 / 16))', aspectRatio: '9 / 16' } : undefined;

  if (!youtubeId) {
    return (
      <div className={`${box} grid place-items-center p-6 text-center`} style={{ ...boxStyle, ...coverStyle(toolName ?? title) }} role="img" aria-label={title}>
        <div>
          <p className="text-3xl font-extrabold uppercase leading-tight tracking-tight text-white">{toolName ?? title}</p>
          <p className="mt-3 inline-block rounded bg-black/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">{s.videoSoon}</p>
        </div>
      </div>
    );
  }

  if (playing) {
    return (
      <div className={`${box} bg-black`} style={boxStyle}>
        <iframe
          src={youtubeEmbed(youtubeId)}
          title={title}
          className="size-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setPlaying(true)} aria-label={`${s.play}: ${title}`} className={`${box} relative block overflow-hidden bg-black ${vertical ? '' : 'w-full'}`} style={boxStyle}>
      <img src={thumbnailUrl || youtubeThumb(youtubeId)} alt="" className="size-full object-cover" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-black/65 text-white backdrop-blur">
          <Icon name="play" size={30} filled />
        </span>
      </span>
    </button>
  );
}
