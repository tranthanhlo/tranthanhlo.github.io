import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { safeNext } from '@/actions/auth';
import { SignInForms } from '@/components/SignInForms';
import { isLang, t } from '@/lib/i18n';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Đăng nhập · Sign in', robots: { index: false } };

export default async function SignInPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ next?: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const next = await safeNext((await searchParams).next);
  if (await getSessionUser()) redirect(next);
  const ui = t(lang);

  return (
    <div className="pad page max-w-lg py-10">
      <h1 className="text-2xl font-semibold">{ui.signInTitle}</h1>
      <p className="mb-6 mt-2 text-soft">{ui.signInBody}</p>
      <SignInForms next={next} lang={lang} />
    </div>
  );
}
