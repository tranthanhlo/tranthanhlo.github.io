export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:4321').replace(/\/$/, '');

// True on Vercel preview deployments (the `staging` branch): a test copy, never for search engines
export const IS_STAGING = process.env.VERCEL_ENV === 'preview';

export const SITE = {
  name: 'Trần Thanh Lộ',
  short: 'Lộ',
  linkedin: 'https://www.linkedin.com/in/tranthanhlo',
};

export const abs = (path: string) => `${SITE_URL}${path}`;
