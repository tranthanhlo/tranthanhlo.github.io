import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionBar } from '@/components/ActionBar';
import { Comments } from '@/components/Comments';
import { PostExtras } from '@/components/PostExtras';
import { devLoginEnabled } from '@/lib/admin';
import { formatDate, href, isLang, pick, strings, t, timeAgo } from '@/lib/i18n';
import { renderMarkdown } from '@/lib/markdown';
import { getComments, getEngagement, getNeighbours, getPostBySlug } from '@/lib/queries';
import { getSessionUser } from '@/lib/session';
import { readingTime } from '@/lib/text';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const title = pick(lang, post.title, post.titleEn);
  const description = pick(lang, post.description, post.descriptionEn);
  return {
    title,
    description,
    openGraph: { title, description, type: 'article', publishedTime: post.publishedAt.toISOString(), images: post.coverUrl ? [post.coverUrl] : undefined },
    alternates: { languages: { vi: `/blog/${slug}`, en: `/en/blog/${slug}` } },
  };
}

export default async function PostPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const ui = t(lang);
  const me = await getSessionUser();
  const body = pick(lang, post.body, post.bodyEn);
  const [{ html, headings }, { prev, next }, engagement, comments] = await Promise.all([
    renderMarkdown(body),
    getNeighbours(post),
    getEngagement('post', post.id, me?.id),
    getComments('post', post.id),
  ]);
  const title = pick(lang, post.title, post.titleEn);
  const dev = devLoginEnabled();
  const signIn = strings(lang, 'signInTitle', 'signInBody', 'signInGoogle', 'devLogin', 'close');
  const now = Date.now();

  return (
    <article className="pad mx-auto max-w-2xl py-6">
      <PostExtras copy={ui.copy} copied={ui.copied} />
      <header>
        <p className="text-xs uppercase tracking-[0.16em] text-faint">
          {formatDate(post.publishedAt, lang)} · {ui.minRead(readingTime(body))}
          {post.updatedAt && <span> · {ui.updated} {formatDate(post.updatedAt, lang)}</span>}
          {post.isSample && <span className="ml-2 font-semibold text-accent">{ui.sample}</span>}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-lg leading-snug text-soft">{pick(lang, post.description, post.descriptionEn)}</p>
      </header>

      {post.coverUrl && <img src={post.coverUrl} alt="" className="mt-6 w-full rounded-xl" />}

      {headings.length >= 3 && (
        <details className="mt-6 border-y border-line">
          <summary className="flex min-h-11 cursor-pointer items-center text-xs uppercase tracking-[0.16em] text-faint">{ui.toc}</summary>
          <ol className="mb-3 list-decimal pl-5 text-[15px]">
            {headings.map((h) => (
              <li key={h.slug} className={h.depth === 3 ? 'ml-4 list-[circle]' : ''}>
                <a href={`#${h.slug}`} className="inline-flex min-h-8 items-center text-soft">
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className="prose mt-8" dangerouslySetInnerHTML={{ __html: html }} />

      {post.tags.length > 0 && (
        <p className="mt-10 flex flex-wrap gap-x-4 text-sm">
          {post.tags.map((tag) => (
            <Link key={tag} href={`${href(lang, '/blog')}?tag=${encodeURIComponent(tag)}`} className="inline-flex min-h-11 items-center text-accent">
              #{tag}
            </Link>
          ))}
        </p>
      )}

      <div className="mt-4 grid gap-4">
        <ActionBar
          type="post"
          id={post.id}
          title={title}
          signedIn={!!me}
          dev={dev}
          initial={{ likes: engagement.likes, liked: engagement.liked, saved: engagement.saved }}
          s={{ ...signIn, ...strings(lang, 'like', 'liked', 'save', 'saved', 'share', 'copiedLink') }}
        />
        <Comments
          type="post"
          id={post.id}
          me={me ? { id: me.id, isAdmin: me.isAdmin } : null}
          dev={dev}
          items={comments.map((c) => ({
            id: c.id,
            parentId: c.parentId,
            body: c.body,
            when: timeAgo(c.createdAt, lang, now),
            edited: c.edited,
            userId: c.userId,
            userName: c.userName,
            userImage: c.userImage,
            isAdmin: c.isAdmin,
          }))}
          s={{ ...signIn, ...strings(lang, 'comments', 'noComments', 'commentPlaceholder', 'send', 'reply', 'edit', 'delete', 'cancel', 'errTooFast', 'errEmpty', 'errTooLong', 'errBanned', 'errGeneric') }}
        />
      </div>

      {(prev || next) && (
        <nav aria-label={ui.postsTitle} className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
          {prev && (
            <Link href={href(lang, `/blog/${prev.slug}`)} className="press block">
              <span className="text-xs uppercase tracking-[0.16em] text-faint">{ui.prev}</span>
              <span className="mt-1 block text-base font-semibold leading-snug">{pick(lang, prev.title, prev.titleEn)}</span>
            </Link>
          )}
          {next && (
            <Link href={href(lang, `/blog/${next.slug}`)} className="press block sm:col-start-2 sm:text-right">
              <span className="text-xs uppercase tracking-[0.16em] text-faint">{ui.next}</span>
              <span className="mt-1 block text-base font-semibold leading-snug">{pick(lang, next.title, next.titleEn)}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
