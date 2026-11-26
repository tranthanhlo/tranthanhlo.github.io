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
      <h1 className="sr-only">{ui.searchTitle}</h1>
      <SearchBox
        lang={lang}
        s={{
          placeholder: ui.searchPlaceholder,
          empty: ui.searchEmpty,
          all: ui.chipAll,
          videos: ui.filterVideos,
          tools: ui.toolsTitle,
          posts: ui.postsTitle,
          recent: ui.searchRecent,
          clear: ui.searchClear,
          views: ui.viewsWord,
        }}
      />
    </div>
  );
}
