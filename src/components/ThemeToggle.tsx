'use client';

import { useEffect, useState } from 'react';
import { Icon } from './Icon';

const COLORS = { light: '#fbf9f4', dark: '#0f0f0f' };

export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function toggle() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
    // keep the phone's address bar colour in step
    for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) m.content = COLORS[next];
    setDark(!dark);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={dark}
      className="press hoverable grid size-11 place-items-center rounded-full text-soft"
    >
      <Icon name={dark ? 'moon' : 'sun'} size={22} />
    </button>
  );
}
