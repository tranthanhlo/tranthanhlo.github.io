'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { signIn, signOut } from '@/auth';
import { getDb, schema } from '@/db';
import { devLoginEnabled } from '@/lib/admin';
import { getSessionUser } from '@/lib/session';
import { sendOne } from '@/lib/email';
import { SITE, SITE_URL } from '@/lib/site';

// only ever send people back to a path on this site
export async function safeNext(next: unknown): Promise<string> {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/';
}

export async function signInGoogle(formData: FormData) {
  await signIn('google', { redirectTo: await safeNext(formData.get('next')) });
}

// Local machine only. Does nothing in production.
export async function signInDev(formData: FormData) {
  if (!devLoginEnabled()) return;
  const who = formData.get('who') === 'admin' ? 'admin' : 'member';
  await signIn('dev', { who, redirectTo: await safeNext(formData.get('next')) });
}

export async function signOutAction(formData: FormData) {
  await signOut({ redirectTo: await safeNext(formData.get('next')) });
}

// Deletes the signed-in person and everything tied to them (comments, likes, saves, follows)
export async function deleteAccount() {
  const user = await getSessionUser();
  if (!user) redirect('/');
  const db = await getDb();
  await db.delete(schema.users).where(eq(schema.users.id, user.id));
  // tell the owner of the address, so a deletion they did not make does not go unnoticed
  if (user.email) {
    await sendOne(
      user.email,
      `Tài khoản của bạn trên ${SITE.name} đã bị xóa · Your account was deleted`,
      `Tài khoản đăng nhập bằng ${user.email} cùng bình luận, lượt thích, mục đã lưu và mục theo dõi vừa được xóa vĩnh viễn trên ${SITE_URL}.\nNếu không phải bạn làm, hãy kiểm tra bảo mật tài khoản Google của bạn.\n\nThe account signed in as ${user.email}, with its comments, likes, saved items and follows, was just permanently deleted on ${SITE_URL}.\nIf this was not you, check the security of your Google account.`,
    );
  }
  await signOut({ redirectTo: '/' });
}
