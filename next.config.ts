import type { NextConfig } from 'next';
import { SECURITY_HEADERS } from './src/lib/security';

const config: NextConfig = {
  // PGlite (the local dev database) must not be bundled
  serverExternalPackages: ['@electric-sql/pglite'],
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false,
  // the share pictures read their fonts from disk
  outputFileTracingIncludes: { '/[lang]/**': ['./assets/fonts/**'] },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default config;
