'use client';

import { useState, useTransition } from 'react';
import { Icon } from './Icon';
import { SignInSheet, type SignInText } from './SignInSheet';
import { toggleLike, toggleSave } from '@/actions/engage';
import type { TargetType } from '@/db/schema';

interface Props {
  type: TargetType;
  id: number;
  title: string;
  signedIn: boolean;
  dev: boolean;
  initial: { likes: number; liked: boolean; saved: boolean };
  s: SignInText & { like: string; liked: string; save: string; saved: string; share: string; copiedLink: string };
}

// Like · Save · Share. Taps change the screen straight away and are undone if the server says no.
export function ActionBar({ type, id, title, signedIn, dev, initial, s }: Props) {
  const [liked, setLiked] = useState(initial.liked);
  const [likes, setLikes] = useState(initial.likes);
  const [saved, setSaved] = useState(initial.saved);
  const [gate, setGate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();

  function like() {
    if (!signedIn) return setGate(true);
    const was = liked;
    setLiked(!was);
    setLikes((n) => n + (was ? -1 : 1));
    start(async () => {
      const r = await toggleLike(type, id);
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
      const r = await toggleSave(type, id);
      if (r.ok) setSaved(r.on);
      else setSaved(was);
    });
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // the person closed the share sheet
    }
  }

  const pill = 'press flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium';
  return (
    <>
      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group">
        <button type="button" onClick={like} aria-pressed={liked} className={pill}>
          <Icon name="like" size={20} filled={liked}  />
          <span>{liked ? s.liked : s.like}</span>
          {likes > 0 && <span className="text-faint">{likes}</span>}
        </button>
        <button type="button" onClick={save} aria-pressed={saved} className={pill}>
          <Icon name="save" size={20} filled={saved}  />
          <span>{saved ? s.saved : s.save}</span>
        </button>
        <button type="button" onClick={share} className={pill}>
          <Icon name={copied ? 'check' : 'share'} size={20} />
          <span>{copied ? s.copiedLink : s.share}</span>
        </button>
      </div>
      <SignInSheet open={gate} onClose={() => setGate(false)} s={s} dev={dev} />
    </>
  );
}
