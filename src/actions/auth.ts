'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { signIn, signOut } from '@/auth';
import { getDb, schema } from '@/db';
import { devLoginEnabled } from '@/lib/admin';
import { getSessionUser } from '@/lib/session';

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
  await signOut({ redirectTo: '/' });
}
