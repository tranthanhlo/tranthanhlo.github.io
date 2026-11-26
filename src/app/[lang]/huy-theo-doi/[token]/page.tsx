import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { href, isLang, t, type Lang } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Hủy theo dõi · Unsubscribe', robots: { index: false } };

const TOKEN = /^[a-f0-9]{32}$/;

// Opening the link only shows a button; the follow is removed when that button is pressed.
// (Mail programs sometimes open links by themselves, and that must not unsubscribe anyone.)
export default async function UnsubscribePage({ params, searchParams }: { params: Promise<{ lang: string; token: string }>; searchParams: Promise<{ done?: string }> }) {
  const { lang, token } = await params;
  if (!isLang(lang)) notFound();
  const l: Lang = lang;
  const ui = t(l);
  const db = await getDb();
  const [row] = TOKEN.test(token) ? await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.unsubscribeToken, token)) : [];
  const done = (await searchParams).done === '1';

  async function unsubscribe() {
    'use server';
    if (TOKEN.test(token)) {
      const d = await getDb();
      await d.delete(schema.subscriptions).where(eq(schema.subscriptions.unsubscribeToken, token));
    }
    redirect(`${href(l, `/huy-theo-doi/${token}`)}?done=1`);
  }

  return (
    <div className="pad page max-w-lg py-12">
      <h1 className="text-2xl font-semibold">{ui.unsubTitle}</h1>
      {done || !row ? (
        <p className="mt-3 text-soft">{done ? ui.unsubDone : ui.unsubBad}</p>
      ) : (
        <form action={unsubscribe} className="mt-5">
          <button type="submit" className="press min-h-12 rounded-full bg-ink px-6 font-semibold text-bg">
            {ui.unsubTitle}
          </button>
        </form>
      )}
    </div>
  );
}
