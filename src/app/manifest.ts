import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// Lets people add the site to the iPhone/Android home screen and open it like an app
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.short,
    description: 'Tools, demo videos and writing by Trần Thanh Lộ',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f0f',
    theme_color: '#0f0f0f',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
