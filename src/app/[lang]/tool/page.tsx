import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ToolIcon } from '@/components/ToolIcon';
import { href, isLang, pick, t } from '@/lib/i18n';
import { getTools } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: t(lang).toolsTitle, alternates: { languages: { vi: '/tool', en: '/en/tool' } } };
}

export default async function ToolsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const ui = t(lang);
  const tools = await getTools();

  return (
    <div className="pad page py-5 lg:px-6">
      <h1 className="text-2xl font-semibold">{ui.toolsTitle}</h1>
      {tools.length === 0 && <p className="mt-4 text-soft">{ui.emptyTools}</p>}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.id}>
            <Link href={href(lang, `/tool/${tool.slug}`)} className="press flex min-h-24 gap-4 rounded-[20px] bg-card p-4">
              <ToolIcon name={pick(lang, tool.name, tool.nameEn)} iconUrl={tool.iconUrl} size={56} />
              <div className="min-w-0">
                <h2 className="font-semibold leading-snug">{pick(lang, tool.name, tool.nameEn)}</h2>
                <p className="mt-0.5 line-clamp-2 text-sm text-soft">{pick(lang, tool.tagline, tool.taglineEn)}</p>
                <p className="mt-1.5 text-xs text-faint">
                  {tool.platform && <span>{tool.platform} · </span>}
                  {tool.status === 'released' ? ui.statusReleased : ui.statusDev}
                  {tool.isSample && <span className="ml-2 font-semibold uppercase text-accent">{ui.sample}</span>}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
