import { isLang, t } from '@/lib/i18n';
import { OG_SIZE, ogImage } from '@/lib/og';

export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Trần Thanh Lộ';

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : 'vi';
  return ogImage({ eyebrow: 'BIM / CAD', title: 'Trần Thanh Lộ', subtitle: t(lang).siteDescription, seed: 'Trần Thanh Lộ' });
}
