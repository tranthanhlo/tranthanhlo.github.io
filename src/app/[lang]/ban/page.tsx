import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteAccount, signOutAction } from '@/actions/auth';
import { AutoplaySetting } from '@/components/AutoplaySetting';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PostCard } from '@/components/PostCard';
import { SignInForms } from '@/components/SignInForms';
import { SubscribeButton } from '@/components/SubscribeButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ToolIcon } from '@/components/ToolIcon';
import { VideoCard } from '@/components/VideoCard';
import { devLoginEnabled } from '@/lib/admin';
import { href, isLang, otherLang, pick, strings, t } from '@/lib/i18n';
import { getSavedItems, getSubscriptionScopes, getTools } from '@/lib/queries';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bạn · You', robots: { index: false } };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function YouPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const ui = t(lang);
  const me = await getSessionUser();

  const link = 'press flex min-h-12 items-center justify-between border-b border-line text-[15px]';
  const other = otherLang(lang);
  // light/dark and language live here, like in the phone app's settings
  const settings = (
    <Section title={ui.settings}>
      <div className="flex min-h-12 items-center justify-between border-b border-line text-[15px]">
        <span>{ui.appearance}</span>
        <ThemeToggle label={ui.theme} />
      </div>
      <AutoplaySetting label={ui.autoplay} on={ui.on} off={ui.off} />
      <Link href={href(other, '/ban')} hrefLang={other} className={link}>
        <span>{ui.language}</span>
        <span className="text-soft">{ui.otherLangName}</span>
      </Link>
    </Section>
  );

  if (!me) {
    return (
      <div className="pad page max-w-lg py-8">
        <h1 className="text-2xl font-semibold">{ui.youTitle}</h1>
        <p className="mb-6 mt-2 text-soft">{ui.signInBody}</p>
        <SignInForms next={href(lang, '/ban')} lang={lang} />
        {settings}
        <nav className="mt-6">
          <Link href={href(lang, '/ve-toi')} className={link}>{ui.aboutTitle}</Link>
          <Link href={href(lang, '/quyen-rieng-tu')} className={link}>{ui.privacyTitle}</Link>
        </nav>
      </div>
    );
  }

  const [saved, liked, scopes, tools] = await Promise.all([getSavedItems(me.id, 'saves'), getSavedItems(me.id, 'likes'), getSubscriptionScopes(me.id), getTools()]);
  const followedTools = tools.filter((x) => scopes.includes(`tool:${x.id}`));
  const signIn = strings(lang, 'signInTitle', 'signInBody', 'signInGoogle', 'devLogin', 'close', 'follow', 'following');
  const empty = <p className="text-sm text-faint">{ui.youNothing}</p>;

  const list = (items: { videos: typeof saved.videos; posts: typeof saved.posts }) =>
    items.videos.length + items.posts.length === 0 ? (
      empty
    ) : (
      <div className="grid gap-5">
        {items.videos.map((v) => <VideoCard key={`v${v.id}`} video={v} lang={lang} compact />)}
        {items.posts.map((p) => <PostCard key={`p${p.id}`} post={p} lang={lang} />)}
      </div>
    );

  return (
    <div className="pad page max-w-2xl py-6">
      <div className="flex items-center gap-4">
        {me.image ? (
          <img src={me.image} alt="" width={64} height={64} referrerPolicy="no-referrer" className="size-16 rounded-full bg-surface" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-surface text-2xl font-semibold text-accent">{(me.name ?? '?').charAt(0).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{me.name}</h1>
          <p className="truncate text-sm text-faint">{me.email}</p>
        </div>
      </div>

      <Section title={ui.youFollowing}>
        <ul className="grid gap-1">
          <li className="flex items-center justify-between gap-3">
            <span className="font-medium">{ui.allChannel}</span>
            <SubscribeButton scope="all" initial={scopes.includes('all')} signedIn dev={devLoginEnabled()} s={signIn} />
          </li>
          {followedTools.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3">
              <Link href={href(lang, `/tool/${x.slug}`)} className="press flex min-h-11 min-w-0 items-center gap-3">
                <ToolIcon name={pick(lang, x.name, x.nameEn)} iconUrl={x.iconUrl} size={32} />
                <span className="truncate font-medium">{pick(lang, x.name, x.nameEn)}</span>
              </Link>
              <SubscribeButton scope={`tool:${x.id}`} initial signedIn dev={devLoginEnabled()} s={signIn} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={ui.youSaved}>{list(saved)}</Section>
      <Section title={ui.youLiked}>{list(liked)}</Section>

      {settings}
      <nav className="mt-6">
        {me.isAdmin && <Link href="/admin" className={link}>Admin</Link>}
        <Link href={href(lang, '/ve-toi')} className={link}>{ui.aboutTitle}</Link>
        <Link href={href(lang, '/quyen-rieng-tu')} className={link}>{ui.privacyTitle}</Link>
      </nav>

      <div className="mt-8 flex flex-wrap gap-3">
        <form action={signOutAction}>
          <input type="hidden" name="next" value={href(lang)} />
          <button type="submit" className="press min-h-11 rounded-full bg-surface px-5 text-sm font-semibold">{ui.signOut}</button>
        </form>
        <form action={deleteAccount}>
          <ConfirmButton message={ui.deleteAccountConfirm} className="press min-h-11 rounded-full px-5 text-sm font-medium text-red-600 dark:text-red-400">
            {ui.deleteAccount}
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
