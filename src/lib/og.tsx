import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { hueOf } from './hue';
import { SITE } from './site';

export const OG_SIZE = { width: 1200, height: 630 };

// Be Vietnam Pro (SIL Open Font License, see assets/fonts/OFL-LICENSE.txt), so Vietnamese accents draw correctly
const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all(
    (
      [
        ['be-vietnam-pro-latin-400-normal.woff', 400],
        ['be-vietnam-pro-vietnamese-400-normal.woff', 400],
        ['be-vietnam-pro-latin-700-normal.woff', 700],
        ['be-vietnam-pro-vietnamese-700-normal.woff', 700],
      ] as const
    ).map(async ([file, weight]) => ({ name: 'BVP', data: await readFile(path.join(FONT_DIR, file)), weight, style: 'normal' as const })),
  );
  return fonts;
}

function hsl(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${[f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// The picture shown when a link is shared (Zalo, Facebook, Messenger…): the item's own colour, its name, the site name.
export async function ogImage({ eyebrow, title, subtitle, seed }: { eyebrow: string; title: string; subtitle?: string; seed: string }) {
  const h = hueOf(seed);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          color: '#ffffff',
          fontFamily: 'BVP',
          backgroundImage: `linear-gradient(135deg, ${hsl(h, 58, 30)}, ${hsl((h + 50) % 360, 62, 16)})`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#d8b46a', color: '#17120a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 700 }}>
            L
          </div>
          <div style={{ marginLeft: 20, fontSize: 34, fontWeight: 700 }}>{SITE.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.85 }}>{eyebrow}</div>
          <div style={{ marginTop: 12, fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>{clip(title, 80)}</div>
          {subtitle && <div style={{ marginTop: 20, fontSize: 32, opacity: 0.88, lineHeight: 1.35 }}>{clip(subtitle, 140)}</div>}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
