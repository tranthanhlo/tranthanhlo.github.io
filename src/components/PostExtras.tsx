'use client';

import { useEffect, useRef } from 'react';

// Two small additions for long posts: a "Copy" button on each code block and a thin reading-progress line.
export function PostExtras({ copy, copied }: { copy: string; copied: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: number[] = [];
    for (const pre of document.querySelectorAll<HTMLPreElement>('.prose pre')) {
      if (pre.parentElement?.classList.contains('code-block')) continue;
      const box = document.createElement('div');
      box.className = 'code-block';
      pre.replaceWith(box);
      box.append(pre);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy press';
      btn.textContent = copy;
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText);
          btn.textContent = copied;
          timers.push(window.setTimeout(() => (btn.textContent = copy), 2000));
        } catch {}
      });
      box.append(btn);
    }
    return () => timers.forEach(clearTimeout);
  }, [copy, copied]);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', update);
    update();
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent"
      style={{ transform: 'scaleX(0)' }}
    />
  );
}
