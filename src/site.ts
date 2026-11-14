import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE = {
  title: 'Trần Thanh Lộ',
  description: 'Blog cá nhân của Trần Thanh Lộ: ghi chép, suy nghĩ và những điều nhỏ ở Đà Nẵng.',
  author: 'Trần Thanh Lộ',
  linkedin: 'https://www.linkedin.com/in/tranthanhlo',
};

export type Post = CollectionEntry<'blog'>;

// Published posts, newest first. Drafts are visible only while running `npm run dev`.
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// Rough reading time for Vietnamese text, at about 200 words a minute
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
