import { NextResponse } from 'next/server';
import { href, pick, type Lang } from '@/lib/i18n';
import { getPosts, getTools, getVideos } from '@/lib/queries';
import { youtubeThumb } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

// A small list of everything public, so the search page can filter on the phone itself
export async function GET(req: Request) {
  const lang: Lang = new URL(req.url).searchParams.get('lang') === 'en' ? 'en' : 'vi';
  const [videos, tools, posts] = await Promise.all([getVideos(), getTools(), getPosts()]);
  const items = [
    ...videos.map((v) => ({
      type: 'video' as const,
      title: pick(lang, v.title, v.titleEn),
      sub: v.tool ? pick(lang, v.tool.name, v.tool.nameEn) : '',
      href: href(lang, `/video/${v.slug}`),
      thumb: v.thumbnailUrl || (v.youtubeId ? youtubeThumb(v.youtubeId) : null),
      cover: v.tool ? pick(lang, v.tool.name, v.tool.nameEn) : pick(lang, v.title, v.titleEn),
      duration: v.duration,
      views: v.views,
      vertical: v.vertical,
      keys: [v.title, v.titleEn, v.tool?.name].filter(Boolean).join(' '),
    })),
    ...tools.map((x) => ({
      type: 'tool' as const,
      title: pick(lang, x.name, x.nameEn),
      sub: pick(lang, x.tagline, x.taglineEn),
      href: href(lang, `/tool/${x.slug}`),
      thumb: x.iconUrl,
      cover: pick(lang, x.name, x.nameEn),
      duration: null,
      views: null,
      vertical: false,
      keys: [x.name, x.nameEn, x.tagline, x.platform].filter(Boolean).join(' '),
    })),
    ...posts.map((p) => ({
      type: 'post' as const,
      title: pick(lang, p.title, p.titleEn),
      sub: pick(lang, p.description, p.descriptionEn),
      href: href(lang, `/blog/${p.slug}`),
      thumb: p.coverUrl,
      cover: pick(lang, p.title, p.titleEn),
      duration: null,
      views: p.views,
      vertical: false,
      keys: [p.title, p.titleEn, p.description, ...p.tags].filter(Boolean).join(' '),
    })),
  ];
  return NextResponse.json(items, { headers: { 'cache-control': 'public, max-age=60' } });
}
