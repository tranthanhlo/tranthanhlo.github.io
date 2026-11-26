import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/PostCard';
import { href, isLang, t } from '@/lib/i18n';
import { getAllTags, getPosts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: t(lang).postsTitle, alternates: { languages: { vi: '/blog', en: '/en/blog' } } };
}

export default async function BlogPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ tag?: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { tag } = await searchParams;
  const ui = t(lang);
  const [posts, tags] = await Promise.all([getPosts({ tag }), getAllTags()]);

  return (
    <div className="pad page py-5 lg:px-6">
      <h1 className="text-2xl font-semibold">{ui.postsTitle}</h1>

      {tags.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {[{ label: ui.chipAll, to: href(lang, '/blog'), on: !tag }, ...tags.map((x) => ({ label: `#${x}`, to: `${href(lang, '/blog')}?tag=${encodeURIComponent(x)}`, on: x === tag }))].map((c) => (
            <Link
              key={c.to}
              href={c.to}
              aria-current={c.on ? 'true' : undefined}
              className={`press flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium ${c.on ? 'bg-ink text-bg' : 'bg-surface'}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5">
        {posts.length === 0 && <p className="text-soft">{ui.emptyPosts}</p>}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} lang={lang} />
        ))}
      </div>
    </div>
  );
}
