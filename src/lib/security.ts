// Browser security rules sent with every response.
// The fixed headers go out through next.config.ts; the Content-Security-Policy is built per request
// in the middleware, because it carries a fresh random "nonce" that only our own scripts know.

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  // no other site may show these pages inside a frame (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // the browser must trust the declared file type and never guess it
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];

export function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function buildCsp(nonce: string, dev = process.env.NODE_ENV === 'development'): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic': scripts loaded by a trusted (nonce) script are trusted too; nothing else runs
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    // code highlighting (Shiki) and a few layouts use style="" attributes
    "style-src 'self' 'unsafe-inline'",
    // thumbnails come from YouTube, Vercel Blob, Google profile pictures and any https image in a post
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self'",
    'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    // signing in sends the browser on to Google
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}
