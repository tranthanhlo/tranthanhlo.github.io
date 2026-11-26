'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';

export interface PlayerVideo {
  id: number;
  youtubeId: string;
  title: string;
  subtitle: string; // the tool's name
  path: string; // the video page
  vertical: boolean;
}

interface Labels {
  minimize: string;
  expand: string;
  pause: string;
  resume: string;
  closePlayer: string;
  miniPlayer: string;
}

interface PlayerApi {
  current: PlayerVideo | null;
  // a video page tells the player where its picture area is; null when it leaves
  setSlot: (el: HTMLElement | null, videoId: number) => void;
  play: (video: PlayerVideo) => void;
  minimize: () => void;
}

const Ctx = createContext<PlayerApi | null>(null);
export const usePlayer = () => useContext(Ctx);

const YT = 'https://www.youtube-nocookie.com';
const embed = (id: string) => `${YT}/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1&enablejsapi=1`;

// One YouTube player for the whole site, like the phone app. On a video page it sits exactly over the
// page's picture area; when you leave the page (or tap "minimize" / swipe it down) it shrinks to a bar
// above the tab bar and keeps playing. Tap the bar to go back; × stops it.
export function PlayerProvider({ children, labels }: { children: React.ReactNode; labels: Labels }) {
  const router = useRouter();
  const [current, setCurrent] = useState<PlayerVideo | null>(null);
  const [slot, setSlotState] = useState<{ el: HTMLElement; videoId: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  // full size only when the page showing this video is open
  const full = !!current && slot?.videoId === current.id;
  const mini = !!current && !full;

  const setSlot = useCallback((el: HTMLElement | null, videoId: number) => {
    setSlotState((old) => (el ? { el, videoId } : old?.videoId === videoId ? null : old));
  }, []);

  const play = useCallback((video: PlayerVideo) => {
    setCurrent(video);
    setPaused(false);
  }, []);

  const minimize = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  }, [router]);

  // keep the full-size player glued to the page's picture area while scrolling or resizing
  useEffect(() => {
    if (!full || !slot || !host.current) return;
    let raf = 0;
    const place = () => {
      const r = slot.el.getBoundingClientRect();
      const h = host.current!;
      h.style.top = `${r.top}px`;
      h.style.left = `${r.left}px`;
      h.style.width = `${r.width}px`;
      h.style.height = `${r.height}px`;
      raf = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(raf);
  }, [full, slot]);

  // clear the inline position when it becomes the mini bar
  useEffect(() => {
    if (mini && host.current) {
      for (const k of ['top', 'left', 'width', 'height'] as const) host.current.style[k] = '';
    }
  }, [mini]);

  function send(func: string) {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), YT);
  }
  function togglePause() {
    send(paused ? 'playVideo' : 'pauseVideo');
    setPaused(!paused);
  }
  function close() {
    setCurrent(null);
    setPaused(false);
  }

  // swipe the full-size player down to shrink it
  const startY = useRef<number | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    startY.current = e.clientY;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (startY.current != null && e.clientY - startY.current > 80) minimize();
    startY.current = null;
  }

  return (
    <Ctx.Provider value={{ current, setSlot, play, minimize }}>
      {children}
      {current && (
        <div
          ref={host}
          role={mini ? 'region' : undefined}
          aria-label={mini ? labels.miniPlayer : undefined}
          className={
            full
              ? 'fixed z-[29] overflow-hidden bg-black lg:rounded-xl'
              : 'fixed inset-x-3 z-[35] flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-bar p-1.5 pr-1 shadow-lg backdrop-blur-xl lg:inset-x-auto lg:right-4 lg:w-96'
          }
          style={mini ? { bottom: 'calc(var(--bar-h) + env(safe-area-inset-bottom) + 6px)' } : undefined}
        >
          <div className={full ? 'relative size-full' : 'relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-black'}>
            <iframe
              ref={frame}
              key={current.youtubeId}
              src={embed(current.youtubeId)}
              title={current.title}
              className={`size-full border-0 ${mini ? 'pointer-events-none' : ''}`}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            {full && (
              <>
                {/* a strip at the top you can drag down, plus a button that does the same */}
                <div className="absolute inset-x-0 top-0 h-10 touch-none" onPointerDown={onPointerDown} onPointerUp={onPointerUp} aria-hidden="true" />
                <button type="button" onClick={minimize} aria-label={labels.minimize} className="press absolute left-1 top-1 grid size-11 place-items-center rounded-full bg-black/40 text-white">
                  <Icon name="chevronDown" size={24} />
                </button>
              </>
            )}
          </div>

          {mini && (
            <>
              <button type="button" onClick={() => router.push(current.path)} aria-label={`${labels.expand}: ${current.title}`} className="press min-w-0 flex-1 text-left">
                <span className="line-clamp-1 text-sm font-medium">{current.title}</span>
                <span className="line-clamp-1 text-xs text-faint">{current.subtitle}</span>
              </button>
              <button type="button" onClick={togglePause} aria-label={paused ? labels.resume : labels.pause} className="press hoverable grid size-11 shrink-0 place-items-center rounded-full">
                <Icon name={paused ? 'play' : 'pause'} size={24} filled={paused} />
              </button>
              <button type="button" onClick={close} aria-label={labels.closePlayer} className="press hoverable grid size-11 shrink-0 place-items-center rounded-full">
                <Icon name="close" size={22} />
              </button>
            </>
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}
