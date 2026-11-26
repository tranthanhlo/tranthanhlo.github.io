import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { authConfig } from './auth.config';
import { devLoginEnabled, isAdminEmail } from '@/lib/admin';

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const db = await getDb();
  const providers: Provider[] = [Google];

  // Local development only: sign in as a made-up admin or member without Google
  if (devLoginEnabled()) {
    providers.push(
      Credentials({
        id: 'dev',
        name: 'Dev login',
        credentials: { who: {} },
        async authorize(creds) {
          const who = creds?.who === 'admin' ? 'admin' : 'member';
          const email = who === 'admin' ? (process.env.ADMIN_EMAILS ?? '').split(',')[0].trim() || 'dev-admin@example.local' : 'dev-member@example.local';
          const name = who === 'admin' ? 'Dev Admin' : 'Dev Member';
          const [row] = await db.select().from(schema.users).where(eq(schema.users.email, email));
          if (row) return { id: row.id, name: row.name, email: row.email, image: row.image };
          const [created] = await db.insert(schema.users).values({ name, email, emailVerified: new Date() }).returning();
          return { id: created.id, name: created.name, email: created.email, image: created.image };
        },
      }),
    );
  }

  return {
    ...authConfig,
    // the adapter wants a concrete Drizzle type; our DB handle is the same shape
    adapter: DrizzleAdapter(db as never, {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    } as never),
    providers,
    events: {
      // keep the stored role in step with ADMIN_EMAILS
      async signIn({ user }) {
        if (!user.id) return;
        await db
          .update(schema.users)
          .set({ role: isAdminEmail(user.email) ? 'admin' : 'member' })
          .where(eq(schema.users.id, user.id));
      },
    },
  };
});
