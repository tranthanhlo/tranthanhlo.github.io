'use client';

import { usePathname } from 'next/navigation';
import { Sheet } from './Sheet';
import { signInDev, signInGoogle } from '@/actions/auth';

export interface SignInText {
  signInTitle: string;
  signInBody: string;
  signInGoogle: string;
  devLogin: string;
  close: string;
}

// "Sign in to continue" shown when someone who is signed out taps Like, Save, Follow or Comment
export function SignInSheet({ open, onClose, s, dev }: { open: boolean; onClose: () => void; s: SignInText; dev: boolean }) {
  const next = usePathname();
  return (
    <Sheet open={open} onClose={onClose} title={s.signInTitle} closeLabel={s.close}>
      <div className="p-5">
        <p className="text-soft">{s.signInBody}</p>
        <form action={signInGoogle} className="mt-5">
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="press min-h-12 w-full rounded-full bg-accent px-5 font-semibold text-on-accent">
            {s.signInGoogle}
          </button>
        </form>
        {dev && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">{s.devLogin}</p>
            <div className="mt-2 flex gap-2">
              {(['member', 'admin'] as const).map((who) => (
                <form key={who} action={signInDev} className="flex-1">
                  <input type="hidden" name="next" value={next} />
                  <input type="hidden" name="who" value={who} />
                  <button type="submit" className="press min-h-11 w-full rounded-full border border-line px-4 text-sm font-medium">
                    {who}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
