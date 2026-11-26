import type { MetadataRoute } from 'next';
import { abs } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/dang-nhap', '/ban', '/huy-theo-doi'] },
    sitemap: abs('/sitemap.xml'),
  };
}
