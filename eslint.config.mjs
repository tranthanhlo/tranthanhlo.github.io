import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // thumbnails come from YouTube / Blob; plain <img> is intentional
  { rules: { '@next/next/no-img-element': 'off' } },
  { ignores: ['.next/**', 'node_modules/**', 'drizzle/**', 'next-env.d.ts'] },
];

export default config;
