import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { isAdminEmail } from '@/lib/admin';

const { auth } = NextAuth(authConfig);

// 1. /admin is for admins only.  2. Vietnamese lives at the root: /blog is served by app/[lang] as /vi/blog.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const user = req.auth?.user;
    if (!user) {
      const url = new URL('/dang-nhap', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdminEmail(user.email)) return NextResponse.redirect(new URL('/', req.url));
    const res = NextResponse.next();
    res.headers.set('x-robots-tag', 'noindex');
    return res;
  }

  if (pathname === '/en' || pathname.startsWith('/en/')) return NextResponse.next();

  // share pictures are linked with their /vi/ address; serve them as they are
  if (pathname.startsWith('/vi/') && /\/opengraph-image/.test(pathname)) return NextResponse.next();

  if (pathname === '/vi' || pathname.startsWith('/vi/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || '/';
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/vi${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
});

export const config = {
  // everything except API routes, Next internals, uploads and the file-convention routes
  matcher: ['/((?!api|_next|uploads|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|icon|apple-icon|favicon\\.svg).*)'],
};
