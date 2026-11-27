import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import '../globals.css';
import { TopBar } from '@/components/TopBar';
import { TabBar } from '@/components/TabBar';
import { PlayerProvider } from '@/components/player/PlayerProvider';
import { isLang, t } from '@/lib/i18n';
import { IS_STAGING, SITE, SITE_URL } from '@/lib/site';
import { getSessionUser } from '@/lib/session';
import { getNotifications } from '@/lib/queries';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf9f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const ui = t(lang);
  return {
    metadataBase: new URL(SITE_URL),
    robots: IS_STAGING ? { index: false, follow: false } : undefined,
    title: { default: SITE.name, template: `%s · ${SITE.name}` },
    description: ui.siteDescription,
    applicationName: SITE.name,
    icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
    appleWebApp: { capable: true, title: SITE.short, statusBarStyle: 'black-translucent' },
    openGraph: { siteName: SITE.name, type: 'website', locale: lang === 'vi' ? 'vi_VN' : 'en_US' },
    alternates: { types: { 'application/rss+xml': lang === 'vi' ? '/rss.xml' : '/en/rss.xml' } },
  };
}

// Picks the saved theme (or the phone's setting) before the first paint, so there is no flash
const themeScript = `(()=>{try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;var c=t==='dark'?'#0f0f0f':'#fbf9f4';document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=c})}catch(e){}})()`;

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const ui = t(lang);
  const me = await getSessionUser();
  const unread = me ? (await getNotifications(me.id)).unread : 0;
  // set by the middleware; the page's Content-Security-Policy only runs scripts carrying it
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* browsers hide the nonce from the page after load, so React must not compare it */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {IS_STAGING && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed left-1/2 top-1 z-[100] -translate-x-1/2 rounded-full bg-red-600 px-3 py-0.5 text-[11px] font-bold tracking-widest text-white shadow"
          >
            STAGING
          </div>
        )}
        <a className="skip-link" href="#noi-dung">
          {ui.skip}
        </a>
        <PlayerProvider labels={{ minimize: ui.minimize, expand: ui.expand, pause: ui.pause, resume: ui.resume, closePlayer: ui.closePlayer, miniPlayer: ui.miniPlayer }}>
          <TopBar lang={lang} name={SITE.name} signedIn={!!me} badge={unread} labels={{ search: ui.search, bell: unread ? ui.notifUnread(unread) : ui.notifTitle }} />
          <TabBar lang={lang} name={SITE.name} avatar={me?.image} isAdmin={me?.isAdmin} labels={{ home: ui.tabHome, shorts: ui.tabShorts, create: ui.tabCreate, you: ui.tabYou }} />
          <main id="noi-dung" tabIndex={-1} className="app-main outline-none">
            {children}
          </main>
        </PlayerProvider>
      </body>
    </html>
  );
}
