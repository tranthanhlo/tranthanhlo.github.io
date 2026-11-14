import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE, getPosts } from './site';
import { paths, t, type Lang } from './i18n';

export async function buildFeed(context: APIContext, lang: Lang) {
  const posts = await getPosts(lang);
  return rss({
    title: SITE.title,
    description: t(lang).siteDescription,
    site: context.site!,
    customData: `<language>${lang}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: post.data.tags,
      link: `${paths(lang).post(post.id)}/`,
    })),
  });
}
