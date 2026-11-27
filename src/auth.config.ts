import type { NextAuthConfig } from 'next-auth';
import { isAdminEmail } from '@/lib/admin';

// The part of the Auth.js setup that also runs in the middleware (no database access here)
export const authConfig = {
  providers: [],
  // a stolen or forgotten sign-in stops working after a week (Auth.js default: 30 days)
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/dang-nhap' },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string | undefined) ?? token.sub ?? '';
        session.user.isAdmin = isAdminEmail(session.user.email);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
