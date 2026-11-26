import Link from 'next/link';

export const inputClass = 'min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base';
export const btnPrimary = 'press inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent';
export const btnGhost = 'press inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-5 text-sm font-semibold';
export const btnDanger = 'press inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-red-600 dark:text-red-400';

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-5 accent-[var(--accent)]" />
      <span className="text-[15px]">{label}</span>
    </label>
  );
}

export function PageHead({ title, action }: { title: string; action?: { href: string; label: string } }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {action && (
        <Link href={action.href} className={btnPrimary}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Notice({ kind = 'ok', children }: { kind?: 'ok' | 'error'; children: React.ReactNode }) {
  return (
    <p role={kind === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-xl px-4 py-3 text-sm ${kind === 'error' ? 'bg-red-500/10 text-red-700 dark:text-red-300' : 'bg-accent/15'}`}>
      {children}
    </p>
  );
}

export function Badge({ on, yes = 'Đã đăng', no = 'Nháp' }: { on: boolean; yes?: string; no?: string }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${on ? 'bg-accent/15 text-accent' : 'bg-surface text-faint'}`}>{on ? yes : no}</span>
  );
}
