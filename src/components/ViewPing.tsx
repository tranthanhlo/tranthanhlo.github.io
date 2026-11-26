'use client';

import { useEffect } from 'react';
import { addView } from '@/actions/engage';

// Tells the server "someone opened this", at most once an hour per item from this browser
export function ViewPing({ type, id }: { type: 'video' | 'post'; id: number }) {
  useEffect(() => {
    const key = `seen:${type}:${id}`;
    try {
      const last = Number(sessionStorage.getItem(key) ?? 0);
      if (Date.now() - last < 3_600_000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {}
    addView(type, id).catch(() => {});
  }, [type, id]);
  return null;
}
