import { getCollection, type CollectionEntry } from 'astro:content';
import { otherLang, paths, type Alternate, type Lang } from './i18n';

export const SITE = {
  title: 'Trần Thanh Lộ',
  author: 'Trần Thanh Lộ',
  linkedin: 'https://www.linkedin.com/in/tranthanhlo',
};

// Vietnamese posts live in src/content/blog, English translations in src/content/en (same file name = same post)
export type Post = CollectionEntry<'blog'> | CollectionEntry<'blogEn'>;
const collectionOf = (lang: Lang) => (lang === 'vi' ? 'blog' : 'blogEn');

// Published posts, newest first. Drafts are visible only while running `npm run dev`.
export async function getPosts(lang: Lang = 'vi'): Promise<Post[]> {
  const posts: Post[] = await getCollection(collectionOf(lang), ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// Rough reading time at about 200 words a minute
export function readingTime(body = ''): number {
  const words = body.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function tagSlug(tag: string): string {
  return tag
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// getStaticPaths for post pages: neighbours for the pager, plus the translation if one exists
export async function postPaths(lang: Lang) {
  const posts = await getPosts(lang);
  const other = otherLang(lang);
  const translated = new Set((await getPosts(other)).map((p) => p.id));
  // posts are newest first, so the "previous" (older) post is the next one in the list
  return posts.map((post, i) => {
    const alt: Alternate = translated.has(post.id)
      ? { href: paths(other).post(post.id), exact: true }
      : { href: paths(other).blog, exact: false };
    return { params: { slug: post.id }, props: { post, prev: posts[i + 1], next: posts[i - 1], alt } };
  });
}

// getStaticPaths for tag pages
export async function tagPaths(lang: Lang) {
  const posts = await getPosts(lang);
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];
  return tags.map((tag) => ({
    params: { tag: tagSlug(tag) },
    props: { tag, posts: posts.filter((p) => p.data.tags.includes(tag)) },
  }));
}
