import { notFound } from 'next/navigation';
import { escapeHtml } from '@/lib/email';
import { href, isLang, pick, t } from '@/lib/i18n';
import { getPosts, getVideos } from '@/lib/queries';
import { abs, SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

// One feed with the newest videos and posts together
export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [videos, posts] = await Promise.all([getVideos({ limit: 30 }), getPosts({ limit: 30 })]);

  const items = [
    ...videos.map((v) => ({
      title: pick(lang, v.title, v.titleEn),
      link: abs(href(lang, `/video/${v.slug}`)),
      date: v.publishedAt,
      text: pick(lang, v.description, v.descriptionEn),
    })),
    ...posts.map((p) => ({
      title: pick(lang, p.title, p.titleEn),
      link: abs(href(lang, `/blog/${p.slug}`)),
      date: p.publishedAt,
      text: pick(lang, p.description, p.descriptionEn),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 40);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${escapeHtml(SITE.name)}</title>
<link>${abs(href(lang))}</link>
<description>${escapeHtml(t(lang).siteDescription)}</description>
<language>${lang}</language>
${items
  .map(
    (i) => `<item><title>${escapeHtml(i.title)}</title><link>${i.link}</link><guid>${i.link}</guid><pubDate>${i.date.toUTCString()}</pubDate><description>${escapeHtml(i.text.slice(0, 300))}</description></item>`,
  )
  .join('\n')}
</channel></rss>`;

  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
}
