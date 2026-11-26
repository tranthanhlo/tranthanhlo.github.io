'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon, type IconName } from './Icon';
import { stripDiacritics } from '@/lib/text';

interface Item {
  type: 'video' | 'tool' | 'post';
  title: string;
  sub: string;
  href: string;
  keys: string;
}

const ICON: Record<Item['type'], IconName> = { video: 'play', tool: 'tools', post: 'posts' };
const norm = (s: string) => stripDiacritics(s).toLowerCase();

// Filters on the device. "ghi chep" finds "ghi chép".
export function SearchBox({ lang, placeholder, empty }: { lang: string; placeholder: string; empty: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch(`/api/search?lang=${lang}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, [lang]);

  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return items.filter((it) => {
      const hay = norm(`${it.title} ${it.keys}`);
      return words.every((w) => hay.includes(w));
    });
  }, [q, items]);

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus
        className="min-h-12 w-full rounded-full border border-line bg-surface px-5 text-base"
      />
      <ul className="mt-4">
        {shown.map((it) => (
          <li key={it.href}>
            <Link href={it.href} className="press flex min-h-14 items-center gap-3 border-b border-line py-2">
              <Icon name={ICON[it.type]} size={20} className="shrink-0 text-faint" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{it.title}</span>
                {it.sub && <span className="block truncate text-sm text-faint">{it.sub}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {q.trim() && shown.length === 0 && items.length > 0 && <p className="mt-6 text-soft">{empty}</p>}
    </div>
  );
}
