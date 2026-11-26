import { NextResponse } from 'next/server';
import { href, pick, type Lang } from '@/lib/i18n';
import { getPosts, getTools, getVideos } from '@/lib/queries';

export const dynamic = 'force-dynamic';

// A small list of everything public, so the search page can filter on the phone itself
export async function GET(req: Request) {
  const lang: Lang = new URL(req.url).searchParams.get('lang') === 'en' ? 'en' : 'vi';
  const [videos, tools, posts] = await Promise.all([getVideos(), getTools(), getPosts()]);
  const items = [
    ...videos.map((v) => ({
      type: 'video',
      title: pick(lang, v.title, v.titleEn),
      sub: v.tool ? pick(lang, v.tool.name, v.tool.nameEn) : '',
      href: href(lang, `/video/${v.slug}`),
      keys: [v.title, v.titleEn, v.tool?.name].filter(Boolean).join(' '),
    })),
    ...tools.map((x) => ({
      type: 'tool',
      title: pick(lang, x.name, x.nameEn),
      sub: pick(lang, x.tagline, x.taglineEn),
      href: href(lang, `/tool/${x.slug}`),
      keys: [x.name, x.nameEn, x.tagline, x.platform].filter(Boolean).join(' '),
    })),
    ...posts.map((p) => ({
      type: 'post',
      title: pick(lang, p.title, p.titleEn),
      sub: pick(lang, p.description, p.descriptionEn),
      href: href(lang, `/blog/${p.slug}`),
      keys: [p.title, p.titleEn, p.description, ...p.tags].filter(Boolean).join(' '),
    })),
  ];
  return NextResponse.json(items, { headers: { 'cache-control': 'public, max-age=60' } });
}
