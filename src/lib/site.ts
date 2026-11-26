export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:4321').replace(/\/$/, '');

export const SITE = {
  name: 'Trần Thanh Lộ',
  short: 'Lộ',
  linkedin: 'https://www.linkedin.com/in/tranthanhlo',
};

export const abs = (path: string) => `${SITE_URL}${path}`;
