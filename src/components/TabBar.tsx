'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './Icon';
import { Logo } from './Logo';
import { href, type Lang } from '@/lib/i18n';

interface Props {
  lang: Lang;
  name: string;
  labels: { home: string; shorts: string; create: string; you: string };
  // the signed-in person's picture, shown on the last tab like the phone app
  avatar?: string | null;
  // the "+" button in the middle is for the site owner only
  isAdmin?: boolean;
}

// Phone: a floating pill at the bottom with icons only: Home, Shorts, "+", You (the active one sits in a lighter pill).
// Wide screens: a labelled sidebar on the left.
export function TabBar({ lang, name, labels, avatar, isAdmin = false }: Props) {
  const raw = usePathname();
  const path = raw.replace(/^\/en(?=\/|$)/, '') || '/';
  const onShorts = path.startsWith('/shorts');

  const items: { key: string; to: string; label: string; icon: IconName; active: boolean; isYou?: boolean }[] = [
    { key: 'home', to: href(lang), label: labels.home, icon: 'home', active: !onShorts && !['/ban', '/dang-nhap', '/ve-toi'].includes(path) },
    { key: 'shorts', to: href(lang, '/shorts'), label: labels.shorts, icon: 'shorts', active: onShorts },
    ...(isAdmin ? [{ key: 'create', to: '/admin/videos/new', label: labels.create, icon: 'plusCircle' as IconName, active: false }] : []),
    { key: 'you', to: href(lang, '/ban'), label: labels.you, icon: 'user', active: ['/ban', '/dang-nhap', '/ve-toi'].includes(path), isYou: true },
  ];

  return (
    <nav
      aria-label="Menu"
      className={`vt-tabs fixed inset-x-3 z-40 flex items-center gap-1 rounded-full border p-1.5 shadow-lg backdrop-blur-xl lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-[232px] lg:flex-col lg:items-stretch lg:gap-0.5 lg:rounded-none lg:border-0 lg:border-r lg:bg-bg lg:p-3 lg:pt-3 lg:shadow-none ${
        onShorts ? 'border-white/10 bg-black/60 text-white' : 'border-line bg-bar'
      }`}
      style={{ bottom: 'calc(8px + env(safe-area-inset-bottom))' }}
    >
      <Link href={href(lang)} className="press mb-3 hidden min-h-12 items-center gap-3 px-3 lg:flex" aria-label={name}>
        <Logo size={32} />
        <span className="text-lg font-semibold tracking-tight">{name}</span>
      </Link>
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.to}
          aria-label={it.label}
          aria-current={it.active ? 'page' : undefined}
          className={`press flex h-12 flex-1 items-center justify-center rounded-full lg:h-11 lg:flex-none lg:justify-start lg:gap-4 lg:px-3 lg:text-[15px] lg:font-medium ${
            it.active ? (onShorts ? 'bg-white/20' : 'bg-surface text-ink') : onShorts ? '' : 'text-soft hoverable'
          }`}
        >
          {it.isYou && avatar ? (
            <img src={avatar} alt="" width={28} height={28} referrerPolicy="no-referrer" className={`size-7 rounded-full object-cover ${it.active ? 'ring-2 ring-ink' : ''}`} />
          ) : (
            <Icon name={it.icon} size={it.key === 'create' ? 30 : 26} filled={it.active && it.icon === 'home'} />
          )}
          <span className="sr-only lg:not-sr-only">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
