'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import { coverStyle } from '@/lib/hue';
import { stripDiacritics } from '@/lib/text';

type Kind = 'video' | 'tool' | 'post';

interface Item {
  type: Kind;
  title: string;
  sub: string;
  href: string;
  thumb: string | null;
  cover: string;
  duration: string | null;
  views: number | null;
  keys: string;
}

interface Labels {
  placeholder: string;
  empty: string;
  all: string;
  videos: string;
  tools: string;
  posts: string;
  recent: string;
  clear: string;
  views: string;
}

const norm = (s: string) => stripDiacritics(s).toLowerCase();
const RECENT = 'recent-searches';

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT) ?? '[]') as string[];
  } catch {
    return [];
  }
}

// Search like the phone app: results with pictures, a row of type filters, and your last searches.
// Everything is filtered on the device; "ghi chep" finds "ghi chép".
export function SearchBox({ lang, s }: { lang: string; s: Labels }) {
  const fmt = new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 });
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecent());
    fetch(`/api/search?lang=${lang}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, [lang]);

  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return items.filter((it) => (kind === 'all' || it.type === kind) && words.every((w) => norm(`${it.title} ${it.keys}`).includes(w)));
  }, [q, items, kind]);

  function remember(term = q) {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...readRecent().filter((x) => x !== t)].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem(RECENT, JSON.stringify(next));
    } catch {}
  }

  function clearRecent() {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT);
    } catch {}
  }

  const chips: { key: Kind | 'all'; label: string }[] = [
    { key: 'all', label: s.all },
    { key: 'video', label: s.videos },
    { key: 'tool', label: s.tools },
    { key: 'post', label: s.posts },
  ];

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          remember();
        }}
        className="flex items-center gap-2 rounded-full bg-surface px-4"
      >
        <Icon name="search" size={20} className="shrink-0 text-faint" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={s.placeholder}
          aria-label={s.placeholder}
          autoFocus
          enterKeyHint="search"
          className="min-h-12 w-full bg-transparent text-base outline-none"
        />
      </form>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-1 overflow-x-auto px-4" role="group">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={kind === c.key}
            onClick={() => setKind(c.key)}
            className={`press min-h-11 shrink-0 rounded-full px-4 text-[15px] font-medium ${kind === c.key ? 'bg-chip text-chip-ink' : 'hoverable'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!q.trim() && recent.length > 0 && (
        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-faint">{s.recent}</h2>
            <button type="button" onClick={clearRecent} className="press min-h-11 px-2 text-sm text-faint">
              {s.clear}
            </button>
          </div>
          <ul>
            {recent.map((r) => (
              <li key={r}>
                <button type="button" onClick={() => setQ(r)} className="press hoverable flex min-h-12 w-full items-center gap-3 rounded-lg text-left">
                  <Icon name="search" size={18} className="text-faint" />
                  <span>{r}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="mt-4 grid gap-3">
        {shown.map((it) => (
          <li key={it.href}>
            <Link href={it.href} onClick={() => remember()} className="press flex gap-3">
              {it.type === 'tool' ? (
                it.thumb ? (
                  <img src={it.thumb} alt="" className="size-16 shrink-0 rounded-full bg-surface object-cover" />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-full bg-surface text-2xl font-semibold text-accent">{it.title.charAt(0)}</span>
                )
              ) : (
                <span className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-surface">
                  {it.thumb ? (
                    <img src={it.thumb} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center p-2 text-center text-xs font-extrabold uppercase text-white" style={coverStyle(it.cover)}>
                      {it.cover}
                    </span>
                  )}
                  {it.duration && <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1 text-[11px] font-medium text-white">{it.duration}</span>}
                </span>
              )}
              <span className="min-w-0">
                <span className="line-clamp-2 text-[15px] font-medium leading-snug">{it.title}</span>
                {it.sub && <span className="mt-0.5 line-clamp-1 block text-[13px] text-faint">{it.sub}</span>}
                {it.views != null && <span className="block text-[13px] text-faint">{fmt.format(it.views)} {s.views}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {q.trim() && shown.length === 0 && items.length > 0 && <p className="mt-6 text-soft">{s.empty}</p>}
    </div>
  );
}
