import type { NextConfig } from 'next';

const config: NextConfig = {
  // PGlite (the local dev database) must not be bundled
  serverExternalPackages: ['@electric-sql/pglite'],
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false,
  // the share pictures read their fonts from disk
  outputFileTracingIncludes: { '/[lang]/**': ['./assets/fonts/**'] },
};

export default config;
