import { signInDev, signInGoogle } from '@/actions/auth';
import { devLoginEnabled } from '@/lib/admin';
import { t, type Lang } from '@/lib/i18n';

// Sign-in buttons for pages (server-rendered). The in-page sheet has its own copy for pop-ups.
export function SignInForms({ next, lang }: { next: string; lang: Lang }) {
  const ui = t(lang);
  return (
    <div>
      <form action={signInGoogle}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="press min-h-12 w-full rounded-full bg-accent px-5 font-semibold text-on-accent sm:w-auto">
          {ui.signInGoogle}
        </button>
      </form>
      {devLoginEnabled() && (
        <div className="mt-6 border-t border-line pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">{ui.devLogin}</p>
          <div className="mt-2 flex gap-2">
            {(['member', 'admin'] as const).map((who) => (
              <form key={who} action={signInDev}>
                <input type="hidden" name="next" value={next} />
                <input type="hidden" name="who" value={who} />
                <button type="submit" className="press min-h-11 rounded-full border border-line px-5 text-sm font-medium">
                  {who}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
