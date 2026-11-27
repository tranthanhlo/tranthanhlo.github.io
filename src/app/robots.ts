import type { MetadataRoute } from 'next';
import { abs, IS_STAGING } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (IS_STAGING) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/dang-nhap', '/ban', '/huy-theo-doi'] },
    sitemap: abs('/sitemap.xml'),
  };
}
