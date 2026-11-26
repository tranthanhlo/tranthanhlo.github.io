'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import { usePlayer, type PlayerVideo } from './PlayerProvider';
import { youtubeThumb } from '@/lib/youtube';

// The picture area of a video page. Before you press play it shows the still picture; after that the
// site-wide player (PlayerProvider) sits on top of this box, so the video keeps playing when you leave.
export function PlayerSlot({ video, thumbnailUrl, playLabel }: { video: PlayerVideo; thumbnailUrl: string | null; playLabel: string }) {
  const player = usePlayer();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!player) return;
    player.setSlot(box.current, video.id);
    return () => player.setSlot(null, video.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  const playing = player?.current?.id === video.id;
  const style = video.vertical ? { width: 'min(100%, calc(68dvh * 9 / 16))', aspectRatio: '9 / 16' } : undefined;

  return (
    <div ref={box} className={`${video.vertical ? 'mx-auto' : 'aspect-video'} relative overflow-hidden bg-black`} style={style}>
      {!playing && (
        <button type="button" onClick={() => player?.play(video)} aria-label={`${playLabel}: ${video.title}`} className="absolute inset-0 block size-full">
          <img src={thumbnailUrl || youtubeThumb(video.youtubeId)} alt="" className="size-full object-cover" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-16 place-items-center rounded-full bg-black/65 text-white backdrop-blur">
              <Icon name="play" size={30} filled />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
