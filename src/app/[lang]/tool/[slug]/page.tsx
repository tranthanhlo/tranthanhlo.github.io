import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { SubscribeButton } from '@/components/SubscribeButton';
import { ToolIcon } from '@/components/ToolIcon';
import { VideoCard } from '@/components/VideoCard';
import { devLoginEnabled } from '@/lib/admin';
import { loadEngage } from '@/lib/feed';
import { href, isLang, pick, strings, t } from '@/lib/i18n';
import { renderMarkdown } from '@/lib/markdown';
import { getSubscriptionScopes, getToolBySlug, getVideos } from '@/lib/queries';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const tool = await getToolBySlug(slug);
  if (!tool) return {};
  return {
    title: pick(lang, tool.name, tool.nameEn),
    description: pick(lang, tool.tagline, tool.taglineEn),
    alternates: { languages: { vi: `/tool/${slug}`, en: `/en/tool/${slug}` } },
  };
}

export default async function ToolPage({ params, searchParams }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();
  const { tab } = await searchParams;
  const about = tab === 'about';

  const ui = t(lang);
  const me = await getSessionUser();
  const [videos, scopes, body] = await Promise.all([
    getVideos({ toolId: tool.id }),
    me ? getSubscriptionScopes(me.id) : Promise.resolve([] as string[]),
    renderMarkdown(pick(lang, tool.description, tool.descriptionEn)),
  ]);
  const engageFor = await loadEngage(videos, lang);
  const name = pick(lang, tool.name, tool.nameEn);
  const base = href(lang, `/tool/${tool.slug}`);
  const btn = 'press inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold';

  return (
    <div className="page lg:px-6">
      <header className="pad py-5 lg:px-0">
        <div className="flex items-center gap-4">
          <ToolIcon name={name} iconUrl={tool.iconUrl} size={72} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight">{name}</h1>
            <p className="mt-0.5 text-sm text-faint">
              {tool.platform && <span>{tool.platform} · </span>}
              {tool.status === 'released' ? ui.statusReleased : ui.statusDev}
              {tool.isSample && <span className="ml-2 font-semibold uppercase text-accent">{ui.sample}</span>}
            </p>
          </div>
        </div>
        <p className="mt-3 text-soft">{pick(lang, tool.tagline, tool.taglineEn)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tool.downloadUrl && (
            <a href={tool.downloadUrl} target="_blank" rel="noopener noreferrer" className={`${btn} bg-accent text-on-accent`}>
              <Icon name="download" size={18} />
              {ui.download}
            </a>
          )}
          {tool.githubUrl && (
            <a href={tool.githubUrl} target="_blank" rel="noopener noreferrer" className={`${btn} bg-surface`}>
              <Icon name="link" size={18} />
              {ui.github}
            </a>
          )}
          {tool.docsUrl && (
            <a href={tool.docsUrl} target="_blank" rel="noopener noreferrer" className={`${btn} bg-surface`}>
              <Icon name="posts" size={18} />
              {ui.docs}
            </a>
          )}
          <SubscribeButton
            scope={`tool:${tool.id}`}
            initial={scopes.includes(`tool:${tool.id}`)}
            signedIn={!!me}
            dev={devLoginEnabled()}
            s={strings(lang, 'signInTitle', 'signInBody', 'signInGoogle', 'devLogin', 'close', 'follow', 'following')}
          />
        </div>
      </header>

      <div className="pad flex gap-6 border-b border-line lg:px-0" role="tablist">
        {[
          { label: ui.toolVideos, to: base, on: !about },
          { label: ui.toolAbout, to: `${base}?tab=about`, on: about },
        ].map((x) => (
          <Link
            key={x.to}
            href={x.to}
            role="tab"
            aria-selected={x.on}
            className={`press flex min-h-11 items-center border-b-2 text-sm font-semibold ${x.on ? 'border-accent text-ink' : 'border-transparent text-faint'}`}
          >
            {x.label}
          </Link>
        ))}
      </div>

      {about ? (
        <div className="pad prose py-6 lg:px-0" dangerouslySetInnerHTML={{ __html: body.html }} />
      ) : (
        <div className="grid gap-3 pt-3 sm:grid-cols-2 sm:gap-4 sm:px-4 lg:grid-cols-3 lg:px-0">
          {videos.length === 0 && <p className="pad text-soft">{ui.emptyVideos}</p>}
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} lang={lang} engage={engageFor(v)} />
          ))}
        </div>
      )}
    </div>
  );
}
