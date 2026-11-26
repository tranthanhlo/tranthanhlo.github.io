import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChipRow } from '@/components/ChipRow';
import { PostCard } from '@/components/PostCard';
import { Shelf } from '@/components/Shelf';
import { Thumb } from '@/components/Thumb';
import { VideoCard } from '@/components/VideoCard';
import { loadEngage } from '@/lib/feed';
import { href, isLang, pick, t } from '@/lib/i18n';
import { getPosts, getTools, getVideos } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function Home({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ tool?: string; kind?: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { tool: toolSlug, kind } = await searchParams;
  const ui = t(lang);

  const tools = await getTools();
  const activeTool = tools.find((x) => x.slug === toolSlug);
  const showPosts = kind === 'posts';

  const chips = [
    { label: ui.chipAll, href: href(lang), active: !activeTool && !showPosts },
    ...tools.map((x) => ({ label: pick(lang, x.name, x.nameEn), href: `${href(lang)}?tool=${x.slug}`, active: x.id === activeTool?.id })),
    { label: ui.chipPosts, href: `${href(lang)}?kind=posts`, active: showPosts },
    { label: ui.allTools, href: href(lang, '/tool'), active: false },
  ];

  const [videos, posts, shorts] = await Promise.all([
    showPosts ? [] : getVideos({ toolId: activeTool?.id, vertical: false }),
    showPosts ? getPosts() : getPosts({ limit: 8 }),
    showPosts || activeTool ? [] : getVideos({ vertical: true, limit: 10 }),
  ]);
  const engageFor = await loadEngage(videos, lang);
  const now = Date.now();

  const feedClass = 'grid gap-3 sm:grid-cols-2 sm:gap-4 sm:px-4 lg:grid-cols-3 lg:px-0 xl:grid-cols-4';
  const head = videos.slice(0, 4);
  const tail = videos.slice(4);
  const postShelf = !activeTool && !showPosts && posts.length > 0;

  return (
    <div className="page lg:px-6">
      <ChipRow chips={chips} />

      {showPosts ? (
        <div className="pad grid gap-3 py-3 lg:px-0">
          {posts.length === 0 && <p className="text-soft">{ui.emptyPosts}</p>}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} lang={lang} />
          ))}
        </div>
      ) : (
        <>
          {videos.length === 0 && <p className="pad py-8 text-soft lg:px-0">{ui.emptyVideos}</p>}
          <div className={`${feedClass} pt-2`}>
            {head.map((v) => (
              <VideoCard key={v.id} video={v} lang={lang} engage={engageFor(v)} now={now} />
            ))}
          </div>

          {postShelf && (
            <Shelf title={ui.shelfPosts}>
              {posts.map((p) => (
                <PostCard key={p.id} post={p} lang={lang} variant="shelf" />
              ))}
            </Shelf>
          )}

          {tail.length > 0 && (
            <div className={feedClass}>
              {tail.map((v) => (
                <VideoCard key={v.id} video={v} lang={lang} engage={engageFor(v)} now={now} />
              ))}
            </div>
          )}

          {shorts.length > 0 && (
            <Shelf title={ui.shelfShorts}>
              {shorts.map((v) => {
                const title = pick(lang, v.title, v.titleEn);
                return (
                  <Link key={v.id} href={href(lang, `/video/${v.slug}`)} className="press block w-36 shrink-0">
                    <Thumb
                      youtubeId={v.youtubeId}
                      thumbnailUrl={v.thumbnailUrl}
                      title={title}
                      toolName={v.tool ? pick(lang, v.tool.name, v.tool.nameEn) : null}
                      vertical
                      lang={lang}
                      className="rounded-2xl"
                    />
                    <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{title}</h3>
                  </Link>
                );
              })}
            </Shelf>
          )}
        </>
      )}
    </div>
  );
}
