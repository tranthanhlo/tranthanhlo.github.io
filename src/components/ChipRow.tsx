import Link from 'next/link';

export interface Chip {
  label: string;
  href: string;
  active: boolean;
}

// The sideways row of filters under the top bar: plain words, with a soft pill only on the chosen one.
// It sticks under the top bar and follows it up when the bar hides (--bar-top).
export function ChipRow({ chips }: { chips: Chip[] }) {
  return (
    <div className="sticky z-20 bg-bar backdrop-blur-xl transition-[top] duration-200" style={{ top: 'var(--bar-top)' }}>
      <div className="no-scrollbar pad flex gap-1 overflow-x-auto py-1.5 lg:px-0" role="list">
        {chips.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            role="listitem"
            aria-current={c.active ? 'true' : undefined}
            className={`press flex min-h-11 shrink-0 items-center rounded-full px-4 text-base font-medium ${c.active ? 'bg-chip text-chip-ink' : 'text-ink hoverable'}`}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
