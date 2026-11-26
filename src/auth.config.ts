import type { NextAuthConfig } from 'next-auth';
import { isAdminEmail } from '@/lib/admin';

// The part of the Auth.js setup that also runs in the middleware (no database access here)
export const authConfig = {
  providers: [],
  session: { strategy: 'jwt' },
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
