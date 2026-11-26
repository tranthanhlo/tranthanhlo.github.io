import type { NextConfig } from 'next';

const config: NextConfig = {
  // PGlite (the local dev database) must not be bundled
  serverExternalPackages: ['@electric-sql/pglite'],
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false,
};

export default config;
