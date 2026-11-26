import type { MetadataRoute } from 'next';
import { href, LANGS } from '@/lib/i18n';
import { getPosts, getTools, getVideos } from '@/lib/queries';
import { abs } from '@/lib/site';

export const dynamic = 'force-dynamic';

// Every public page, in both languages, each pointing at its twin in the other language
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [videos, tools, posts] = await Promise.all([getVideos(), getTools(), getPosts()]);

  const page = (path: string, lastModified?: Date): MetadataRoute.Sitemap[number] => ({
    url: abs(href('vi', path)),
    lastModified,
    alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, abs(href(l, path))])) },
  });

  return [
    page('/'),
    page('/tool'),
    page('/blog'),
    page('/ve-toi'),
    page('/quyen-rieng-tu'),
    ...tools.map((x) => page(`/tool/${x.slug}`, x.createdAt)),
    ...videos.map((x) => page(`/video/${x.slug}`, x.publishedAt)),
    ...posts.map((x) => page(`/blog/${x.slug}`, x.updatedAt ?? x.publishedAt)),
  ];
}
