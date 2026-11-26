import Link from 'next/link';
import { coverStyle } from '@/lib/hue';
import { formatDate, href, pick, t, type Lang } from '@/lib/i18n';
import type { Post } from '@/lib/queries';

export function PostCard({ post, lang, variant = 'list' }: { post: Post; lang: Lang; variant?: 'list' | 'shelf' }) {
  const title = pick(lang, post.title, post.titleEn);
  const description = pick(lang, post.description, post.descriptionEn);
  const ui = t(lang);
  const cover = post.coverUrl ? (
    <img src={post.coverUrl} alt="" loading="lazy" className="size-full object-cover" />
  ) : (
    <div className="grid size-full place-items-center p-3 text-center" style={coverStyle(title)}>
      <span className="line-clamp-3 text-lg font-extrabold leading-tight tracking-tight text-white">{title}</span>
    </div>
  );

  if (variant === 'shelf') {
    return (
      <Link href={href(lang, `/blog/${post.slug}`)} className="press block w-64 shrink-0 overflow-hidden rounded-[20px] bg-card">
        <div className="aspect-video overflow-hidden bg-surface">{cover}</div>
        <div className="px-3 pb-3 pt-2.5">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug">{title}</h3>
          <p className="mt-0.5 text-[13px] text-faint">{formatDate(post.publishedAt, lang)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href(lang, `/blog/${post.slug}`)} className="press flex gap-3 rounded-[20px] bg-card p-3">
      <div className="aspect-video w-32 shrink-0 self-start overflow-hidden rounded-xl bg-surface sm:w-48">{cover}</div>
      <div className="min-w-0">
        <p className="text-xs text-faint">
          {formatDate(post.publishedAt, lang)}
          {post.isSample && <span className="ml-2 font-semibold uppercase text-accent">{ui.sample}</span>}
          {!post.published && <span className="ml-2 font-semibold uppercase text-accent">Nháp</span>}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-medium leading-snug sm:text-base">{title}</h3>
        <p className="mt-1 line-clamp-2 hidden text-sm text-soft sm:block">{description}</p>
      </div>
    </Link>
  );
}
