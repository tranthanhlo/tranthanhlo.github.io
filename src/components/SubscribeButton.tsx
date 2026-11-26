'use client';

import { useState, useTransition } from 'react';
import { SignInSheet, type SignInText } from './SignInSheet';
import { toggleFollow } from '@/actions/engage';

interface Props {
  scope: string; // "all" or "tool:<id>"
  initial: boolean;
  signedIn: boolean;
  dev: boolean;
  s: SignInText & { follow: string; following: string };
}

export function SubscribeButton({ scope, initial, signedIn, dev, s }: Props) {
  const [on, setOn] = useState(initial);
  const [gate, setGate] = useState(false);
  const [, start] = useTransition();

  function click() {
    if (!signedIn) return setGate(true);
    const was = on;
    setOn(!was);
    start(async () => {
      const r = await toggleFollow(scope);
      setOn(r.ok ? r.on : was);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={click}
        aria-pressed={on}
        className={`press min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${on ? 'bg-surface text-ink' : 'bg-ink text-bg'}`}
      >
        {on ? s.following : s.follow}
      </button>
      <SignInSheet open={gate} onClose={() => setGate(false)} s={s} dev={dev} />
    </>
  );
}
