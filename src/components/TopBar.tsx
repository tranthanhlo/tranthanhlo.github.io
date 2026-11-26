'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { href, type Lang } from '@/lib/i18n';

interface Props {
  lang: Lang;
  name: string;
  labels: { search: string; following: string };
}

// Like the phone app: logo on the left, bell and search on the right. It hides while you scroll down
// and comes back when you scroll up, and the filter row under it follows (through --bar-top).
export function TopBar({ lang, name, labels }: Props) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const y = window.scrollY;
        if (y > lastY.current + 8 && y > 80) setHidden(true);
        else if (y < lastY.current - 8 || y < 40) setHidden(false);
        lastY.current = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--bar-top', hidden ? 'env(safe-area-inset-top)' : 'calc(56px + env(safe-area-inset-top))');
  }, [hidden]);

  // the video page gives the top of the screen to the player on phones
  const onVideo = /^(\/en)?\/video\//.test(pathname);
  const onShorts = /^(\/en)?\/shorts/.test(pathname);
  const round = 'press hoverable grid size-11 place-items-center rounded-full';

  return (
    <header
      className={`vt-bar sticky top-0 z-30 bg-bar backdrop-blur-xl transition-transform duration-200 lg:ml-[232px] ${hidden ? '-translate-y-full' : ''} ${onVideo ? 'max-lg:hidden' : ''} ${onShorts ? 'hidden' : ''}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="pad page flex h-14 items-center justify-between gap-2">
        <Link href={href(lang)} className="press flex min-h-11 items-center gap-2 lg:hidden" aria-label={name}>
          <Logo size={30} />
          <span className="text-xl font-semibold tracking-tight">{name}</span>
        </Link>
        <div className="ml-auto flex items-center">
          <Link href={href(lang, '/ban')} aria-label={labels.following} className={round}>
            <Icon name="bell" size={25} />
          </Link>
          <Link href={href(lang, '/tim-kiem')} aria-label={labels.search} className={round}>
            <Icon name="search" size={25} />
          </Link>
        </div>
      </div>
    </header>
  );
}
