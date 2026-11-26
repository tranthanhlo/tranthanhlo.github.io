'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Icon } from './Icon';
import { SignInSheet, type SignInText } from './SignInSheet';
import { ToolIcon } from './ToolIcon';
import { toggleLike, toggleSave } from '@/actions/engage';
import { coverStyle } from '@/lib/hue';

export interface ShortItem {
  id: number;
  title: string;
  path: string;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  toolName: string | null;
  toolPath: string | null;
  toolIcon: string | null;
  likes: number;
  liked: boolean;
  saved: boolean;
}

export type ShortsText = SignInText & { like: string; liked: string; save: string; saved: string; share: string; copiedLink: string; openComments: string; mute: string; unmute: string; videoSoon: string; play: string };

interface Props {
  items: ShortItem[];
  signedIn: boolean;
  dev: boolean;
  s: ShortsText;
}

const YT = 'https://www.youtube-nocookie.com';
const post = (frame: HTMLIFrameElement | null, func: string) => frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), YT);

// Full-screen vertical videos you flick through. The one in view plays (muted until you turn sound on).
export function ShortsFeed({ items, signedIn, dev, s }: Props) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting && e.intersectionRatio >= 0.6) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { threshold: [0.6] },
    );
    for (const el of refs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [items.length]);

  return (
    <div className="no-scrollbar fixed inset-0 z-30 snap-y snap-mandatory overflow-y-scroll bg-black text-white lg:left-[232px]">
      {items.map((it, i) => (
        <Short key={it.id} item={it} index={i} active={active === i} refEl={(el) => (refs.current[i] = el)} signedIn={signedIn} dev={dev} s={s} />
      ))}
    </div>
  );
}

function Short({ item, index, active, refEl, signedIn, dev, s }: { item: ShortItem; index: number; active: boolean; refEl: (el: HTMLElement | null) => void; signedIn: boolean; dev: boolean; s: ShortsText }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(item.liked);
  const [likes, setLikes] = useState(item.likes);
  const [saved, setSaved] = useState(item.saved);
  const [gate, setGate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();

  // a video leaves the screen: it goes back to muted and un-paused for next time
  useEffect(() => {
    if (!active) {
      setMuted(true);
      setPaused(false);
    }
  }, [active]);

  function togglePlay() {
    post(frame.current, paused ? 'playVideo' : 'pauseVideo');
    setPaused(!paused);
  }
  function toggleSound() {
    post(frame.current, muted ? 'unMute' : 'mute');
    setMuted(!muted);
  }
  function like() {
    if (!signedIn) return setGate(true);
    const was = liked;
    setLiked(!was);
    setLikes((n) => n + (was ? -1 : 1));
    start(async () => {
      const r = await toggleLike('video', item.id);
      if (r.ok) {
        setLiked(r.on);
        setLikes(r.total);
      } else {
        setLiked(was);
        setLikes((n) => n + (was ? 1 : -1));
      }
    });
  }
  function save() {
    if (!signedIn) return setGate(true);
    const was = saved;
    setSaved(!was);
    start(async () => {
      const r = await toggleSave('video', item.id);
      setSaved(r.ok ? r.on : was);
    });
  }
  async function share() {
    const url = new URL(item.path, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }

  const src = item.youtubeId
    ? `${YT}/embed/${item.youtubeId}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${item.youtubeId}&rel=0&modestbranding=1&enablejsapi=1&disablekb=1&fs=0&iv_load_policy=3`
    : '';
  const rail = 'press grid size-12 place-items-center rounded-full bg-white/15 backdrop-blur';

  return (
    <section ref={refEl} data-i={index} className="relative flex h-dvh snap-start snap-always items-center justify-center overflow-hidden" aria-label={item.title}>
      {/* the picture area: as wide as the screen, but never wider than a 9:16 frame is tall */}
      <div className="relative h-full w-full lg:w-[min(100%,calc(100dvh*9/16))]">
        {item.youtubeId ? (
          <>
            <img src={item.thumbnailUrl || `https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`} alt="" className="absolute inset-0 size-full object-cover" />
            {active && <iframe ref={frame} src={src} title={item.title} allow="autoplay; encrypted-media" className="pointer-events-none absolute inset-0 size-full border-0" />}
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center p-8 text-center" style={coverStyle(item.toolName ?? item.title)}>
            <div>
              <p className="text-4xl font-extrabold uppercase leading-tight tracking-tight">{item.toolName ?? item.title}</p>
              <p className="mt-3 inline-block rounded bg-black/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider">{s.videoSoon}</p>
            </div>
          </div>
        )}

        {item.youtubeId && (
          <button type="button" onClick={togglePlay} aria-label={`${s.play}: ${item.title}`} className="absolute inset-0 grid place-items-center">
            {paused && (
              <span className="grid size-20 place-items-center rounded-full bg-black/50">
                <Icon name="play" size={40} filled />
              </span>
            )}
          </button>
        )}

        {/* shade behind the writing so it can be read on any picture */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-4" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
          <div className="min-w-0 flex-1">
            {item.toolPath && (
              <Link href={item.toolPath} className="press flex min-h-11 items-center gap-2.5">
                <ToolIcon name={item.toolName ?? ''} iconUrl={item.toolIcon} size={36} round />
                <span className="truncate font-semibold">{item.toolName}</span>
              </Link>
            )}
            <Link href={item.path} className="mt-1 line-clamp-2 block text-[15px] leading-snug">
              {item.title}
            </Link>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-4">
            {item.youtubeId && (
              <button type="button" onClick={toggleSound} aria-label={muted ? s.unmute : s.mute} className={rail}>
                <Icon name={muted ? 'volumeOff' : 'volumeOn'} size={24} />
              </button>
            )}
            <div className="text-center">
              <button type="button" onClick={like} aria-pressed={liked} aria-label={liked ? s.liked : s.like} className={rail}>
                <Icon name="like" size={26} filled={liked} />
              </button>
              <span className="mt-1 block text-xs font-medium">{likes > 0 ? likes : s.like}</span>
            </div>
            <Link href={item.path} aria-label={s.openComments} className={rail}>
              <Icon name="chat" size={26} />
            </Link>
            <button type="button" onClick={save} aria-pressed={saved} aria-label={saved ? s.saved : s.save} className={rail}>
              <Icon name="save" size={26} filled={saved} />
            </button>
            <button type="button" onClick={share} aria-label={copied ? s.copiedLink : s.share} className={rail}>
              <Icon name={copied ? 'check' : 'share'} size={26} />
            </button>
          </div>
        </div>
      </div>
      <SignInSheet open={gate} onClose={() => setGate(false)} s={s} dev={dev} />
    </section>
  );
}
