import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { getDb, schema } from '@/db';
import { isAdminEmail } from '@/lib/admin';

export class AuthError extends Error {}

export async function getSessionUser() {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) return null;
  return { id: u.id, name: u.name ?? null, email: u.email ?? null, image: u.image ?? null, isAdmin: isAdminEmail(u.email) };
}

// For member actions: must be signed in and not banned. Re-checks the database every time.
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthError('not-signed-in');
  const db = await getDb();
  const [row] = await db.select({ id: schema.users.id, banned: schema.users.banned }).from(schema.users).where(eq(schema.users.id, user.id));
  if (!row) throw new AuthError('no-such-user');
  if (row.banned) throw new AuthError('banned');
  return user;
}

// For every admin write. Never trusts the page the request came from.
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) throw new AuthError('not-admin');
  return user;
}
