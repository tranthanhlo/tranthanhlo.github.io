import { isLang, pick, t } from '@/lib/i18n';
import { OG_SIZE, ogImage } from '@/lib/og';
import { getToolBySlug } from '@/lib/queries';

export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Tool';

export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: l, slug } = await params;
  const lang = isLang(l) ? l : 'vi';
  const tool = await getToolBySlug(slug);
  const name = tool ? pick(lang, tool.name, tool.nameEn) : t(lang).toolsTitle;
  return ogImage({ eyebrow: tool?.platform ?? t(lang).toolsTitle, title: name, subtitle: tool ? pick(lang, tool.tagline, tool.taglineEn) : undefined, seed: name });
}
