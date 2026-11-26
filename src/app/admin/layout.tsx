import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import '../globals.css';
import { Logo } from '@/components/Logo';
import { getSessionUser } from '@/lib/session';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin' }, robots: { index: false, follow: false } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const themeScript = `(()=>{try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}})()`;

const nav = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/videos', label: 'Video' },
  { href: '/admin/tools', label: 'Tool' },
  { href: '/admin/posts', label: 'Bài viết' },
  { href: '/admin/comments', label: 'Bình luận' },
  { href: '/admin/notify', label: 'Thông báo' },
];

// The middleware already turns visitors away; this checks again on the server.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/dang-nhap?next=/admin');
  if (!user.isAdmin) redirect('/');

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="pad mx-auto flex h-14 max-w-5xl items-center justify-between gap-3">
            <Link href="/admin" className="press flex min-h-11 items-center gap-2.5 font-semibold">
              <Logo size={28} /> Admin
            </Link>
            <Link href="/" className="press inline-flex min-h-11 items-center text-sm text-soft">
              ← Xem trang
            </Link>
          </div>
          <nav aria-label="Admin" className="no-scrollbar pad mx-auto flex max-w-5xl gap-1 overflow-x-auto">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="press flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium text-soft hover:bg-surface">
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="pad mx-auto max-w-5xl py-6" style={{ paddingBottom: 'calc(48px + env(safe-area-inset-bottom))' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
