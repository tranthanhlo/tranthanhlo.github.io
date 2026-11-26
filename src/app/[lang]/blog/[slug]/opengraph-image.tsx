import { isLang, pick, t } from '@/lib/i18n';
import { OG_SIZE, ogImage } from '@/lib/og';
import { getPostBySlug } from '@/lib/queries';

export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Bài viết';

export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: l, slug } = await params;
  const lang = isLang(l) ? l : 'vi';
  const post = await getPostBySlug(slug);
  const title = post ? pick(lang, post.title, post.titleEn) : t(lang).postsTitle;
  return ogImage({ eyebrow: t(lang).postsTitle, title, subtitle: post ? pick(lang, post.description, post.descriptionEn) : undefined, seed: title });
}
