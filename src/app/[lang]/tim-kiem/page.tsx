import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SearchBox } from '@/components/SearchBox';
import { isLang, t } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Tìm kiếm · Search', robots: { index: false } };

export default async function SearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const ui = t(lang);
  return (
    <div className="pad page max-w-2xl py-5">
      <h1 className="mb-4 text-2xl font-semibold">{ui.searchTitle}</h1>
      <SearchBox lang={lang} placeholder={ui.searchPlaceholder} empty={ui.searchEmpty} />
    </div>
  );
}
