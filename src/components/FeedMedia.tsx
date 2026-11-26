'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

interface Props {
  href: string;
  youtubeId?: string | null;
  title: string;
  labels: { mute: string; unmute: string };
  children: React.ReactNode; // the still picture and badges, drawn by the server
}

const EVENT = 'feed-preview';

export function autoplayAllowed(): boolean {
  try {
    if (localStorage.getItem('autoplay') === 'off') return false;
  } catch {}
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  return !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Like the phone app: when a card is mostly on screen for a moment, its video starts playing muted.
// Only one card plays at a time. Anything the person does not want (Data Saver, reduced motion, the
// setting in "You") switches this off, and the card stays a still picture.
export function FeedMedia({ href, youtubeId, title, labels, children }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!youtubeId || !box.current) return;
    let timer: number | undefined;
    const me = Symbol();
    const stop = () => {
      clearTimeout(timer);
      setPlaying(false);
      setMuted(true);
    };
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== me) stop();
    };
    window.addEventListener(EVENT, onOther);
    const io = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry.intersectionRatio >= 0.65 && document.visibilityState === 'visible') {
          timer = window.setTimeout(() => {
            if (!autoplayAllowed()) return;
            window.dispatchEvent(new CustomEvent(EVENT, { detail: me }));
            setPlaying(true);
          }, 900);
        } else stop();
      },
      { threshold: [0, 0.65, 1] },
    );
    io.observe(box.current);
    return () => {
      io.disconnect();
      window.removeEventListener(EVENT, onOther);
      clearTimeout(timer);
    };
  }, [youtubeId]);

  function toggleSound() {
    const next = !muted;
    setMuted(next);
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: next ? 'mute' : 'unMute', args: [] }), 'https://www.youtube-nocookie.com');
  }

  const src = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${youtubeId}&rel=0&modestbranding=1&enablejsapi=1&disablekb=1&fs=0&iv_load_policy=3`
    : '';

  return (
    <div ref={box} className="relative">
      <Link href={href} className="press relative block">
        {children}
        {playing && <iframe ref={frame} src={src} title={title} tabIndex={-1} aria-hidden="true" allow="autoplay; encrypted-media" className="pointer-events-none absolute inset-0 size-full border-0" />}
      </Link>
      {playing && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? labels.unmute : labels.mute}
          className="press absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
        >
          <Icon name={muted ? 'volumeOff' : 'volumeOn'} size={22} />
        </button>
      )}
    </div>
  );
}
