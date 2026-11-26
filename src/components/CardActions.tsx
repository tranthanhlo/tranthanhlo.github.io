'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Icon } from './Icon';
import { SignInSheet, type SignInText } from './SignInSheet';
import { toggleLike, toggleSave } from '@/actions/engage';

export type CardActionText = SignInText & { like: string; liked: string; save: string; saved: string; share: string; copiedLink: string; openComments: string };

interface Props {
  id: number;
  title: string;
  path: string; // the video page, e.g. /video/abc
  signedIn: boolean;
  dev: boolean;
  initial: { liked: boolean; saved: boolean };
  s: CardActionText;
}

// The four small buttons at the right of a feed card: like, comments, save, share
export function CardActions({ id, title, path, signedIn, dev, initial, s }: Props) {
  const [liked, setLiked] = useState(initial.liked);
  const [saved, setSaved] = useState(initial.saved);
  const [gate, setGate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();

  function like() {
    if (!signedIn) return setGate(true);
    const was = liked;
    setLiked(!was);
    start(async () => {
      const r = await toggleLike('video', id);
      setLiked(r.ok ? r.on : was);
    });
  }

  function save() {
    if (!signedIn) return setGate(true);
    const was = saved;
    setSaved(!was);
    start(async () => {
      const r = await toggleSave('video', id);
      setSaved(r.ok ? r.on : was);
    });
  }

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // the share sheet was closed
    }
  }

  const btn = 'press hoverable grid h-11 w-10 shrink-0 place-items-center rounded-full';
  return (
    <>
      <div className="-mr-2 ml-auto flex shrink-0 items-center">
        <button type="button" onClick={like} aria-pressed={liked} aria-label={liked ? s.liked : s.like} className={btn}>
          <Icon name="like" size={24} filled={liked}  />
        </button>
        <Link href={path} aria-label={s.openComments} className={btn}>
          <Icon name="chat" size={24} />
        </Link>
        <button type="button" onClick={save} aria-pressed={saved} aria-label={saved ? s.saved : s.save} className={btn}>
          <Icon name="save" size={24} filled={saved}  />
        </button>
        <button type="button" onClick={share} aria-label={copied ? s.copiedLink : s.share} className={btn}>
          <Icon name={copied ? 'check' : 'more'} size={24} />
        </button>
      </div>
      <SignInSheet open={gate} onClose={() => setGate(false)} s={s} dev={dev} />
    </>
  );
}
