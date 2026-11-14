// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Used by RSS and the sitemap. Change it if the blog moves to a custom domain.
  site: 'https://tranthanhlo.github.io',
  // Vietnamese at the root, English under /en/
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'vi', locales: { vi: 'vi-VN', en: 'en-US' } },
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      wrap: true,
    },
  },
});
