import { describe, expect, it } from 'vitest';
import { buildCsp, makeNonce, SECURITY_HEADERS } from '@/lib/security';
import { exifOrientation, stripMetadata } from '@/lib/strip-metadata';
import { clientIp, visitorKey } from '@/lib/views';

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const has = (b: Uint8Array, s: string) => Buffer.from(b).includes(Buffer.from(s, 'latin1'));

describe('security headers', () => {
  it('forbid framing and type guessing', () => {
    const h = Object.fromEntries(SECURITY_HEADERS.map((x) => [x.key, x.value]));
    expect(h['X-Frame-Options']).toBe('DENY');
    expect(h['X-Content-Type-Options']).toBe('nosniff');
  });
  it('builds a policy that only runs scripts with the nonce', () => {
    const csp = buildCsp('abc123', false);
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('https://www.youtube-nocookie.com');
    expect(csp).not.toContain('unsafe-eval');
    expect(buildCsp('x', true)).toContain("'unsafe-eval'");
  });
  it('makes a fresh nonce every time', () => {
    const a = makeNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(makeNonce()).not.toBe(a);
  });
});

describe('visitor key', () => {
  it('is one-way and stable', () => {
    const k = visitorKey('203.0.113.7', 's');
    expect(k).toMatch(/^[a-f0-9]{32}$/);
    expect(k).not.toContain('203');
    expect(visitorKey('203.0.113.7', 's')).toBe(k);
    expect(visitorKey('203.0.113.8', 's')).not.toBe(k);
    expect(visitorKey('203.0.113.7', 'other')).not.toBe(k);
  });
  it('reads the address Vercel passes on', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '1.2.3.4' }))).toBe('1.2.3.4');
    expect(clientIp(new Headers({ 'x-forwarded-for': '5.6.7.8, 10.0.0.1' }))).toBe('5.6.7.8');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});

/* ---------- picture metadata ---------- */

const seg = (marker: number, payload: number[]) => [0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff, ...payload];

// EXIF (big endian) with orientation 6 and a GPS-looking text
function exif(orientation: number): number[] {
  const tiff = [0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, 0, 0, 0, 0, ...ascii('GPS 16.0544N 108.2022E')];
  return [...ascii('Exif'), 0, 0, ...tiff];
}

function jpeg(withExif: boolean): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8,
    ...seg(0xe0, [...ascii('JFIF'), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]),
    ...(withExif ? seg(0xe1, exif(6)) : []),
    ...seg(0xe1, ascii('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>secret</x:xmpmeta>')),
    ...seg(0xe2, ascii('ICC_PROFILE\0profile')),
    ...seg(0xfe, ascii('a comment')),
    ...seg(0xdb, [0, 1, 2, 3]),
    0xff, 0xda, 0, 4, 9, 9, 0x12, 0x34, 0x56, 0xff, 0xd9,
  ]);
}

function png(): Uint8Array {
  const chunk = (type: string, data: number[]) => [0, 0, 0, data.length, ...ascii(type), ...data, 1, 2, 3, 4];
  return new Uint8Array([
    0x89, ...ascii('PNG'), 0x0d, 0x0a, 0x1a, 0x0a,
    ...chunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]),
    ...chunk('tEXt', ascii('Author\0Somebody')),
    ...chunk('eXIf', ascii('MM\0*GPS')),
    ...chunk('IDAT', [1, 2, 3]),
    ...chunk('IEND', []),
  ]);
}

function webp(): Uint8Array {
  const le = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
  const chunk = (fourcc: string, data: number[]) => [...ascii(fourcc), ...le(data.length), ...data, ...(data.length & 1 ? [0] : [])];
  const body = [
    ...ascii('WEBP'),
    ...chunk('VP8X', [0x08 | 0x04, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    ...chunk('VP8 ', [1, 2, 3, 4]),
    ...chunk('EXIF', ascii('MM\0*GPS!!')),
    ...chunk('XMP ', ascii('<x:xmpmeta/>')),
  ];
  return new Uint8Array([...ascii('RIFF'), ...le(body.length), ...body]);
}

describe('picture metadata', () => {
  it('reads the EXIF rotation', () => {
    expect(exifOrientation(new Uint8Array(exif(6)))).toBe(6);
    expect(exifOrientation(new Uint8Array(ascii('nothing here at all')))).toBe(0);
  });

  it('drops EXIF, XMP and comments from a JPEG but keeps rotation, colour profile and picture', () => {
    const out = stripMetadata(jpeg(true), 'image/jpeg');
    expect(has(out, 'GPS')).toBe(false);
    expect(has(out, 'xmpmeta')).toBe(false);
    expect(has(out, 'a comment')).toBe(false);
    expect(has(out, 'ICC_PROFILE')).toBe(true);
    expect(has(out, 'JFIF')).toBe(true);
    // the rotation survives in a minimal EXIF block
    const i = Buffer.from(out).indexOf(Buffer.from('Exif'));
    expect(i).toBeGreaterThan(0);
    expect(exifOrientation(out.subarray(i))).toBe(6);
    // the picture data is untouched and the file still ends properly
    expect([...out.subarray(-11)]).toEqual([0xff, 0xda, 0, 4, 9, 9, 0x12, 0x34, 0x56, 0xff, 0xd9]);
    expect([out[0], out[1]]).toEqual([0xff, 0xd8]);
  });

  it('adds no EXIF block to a JPEG that had no rotation', () => {
    const out = stripMetadata(jpeg(false), 'image/jpeg');
    expect(has(out, 'Exif')).toBe(false);
    expect(has(out, 'xmpmeta')).toBe(false);
  });

  it('drops text and EXIF chunks from a PNG', () => {
    const out = stripMetadata(png(), 'image/png');
    expect(has(out, 'Somebody')).toBe(false);
    expect(has(out, 'eXIf')).toBe(false);
    expect(has(out, 'IHDR') && has(out, 'IDAT') && has(out, 'IEND')).toBe(true);
  });

  it('drops EXIF and XMP from a WebP and fixes its header', () => {
    const out = stripMetadata(webp(), 'image/webp');
    expect(has(out, 'GPS')).toBe(false);
    expect(has(out, 'xmpmeta')).toBe(false);
    expect(has(out, 'VP8 ')).toBe(true);
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    expect(view.getUint32(4, true)).toBe(out.length - 8);
    expect(out[20] & 0x0c).toBe(0); // VP8X flags no longer claim EXIF/XMP
  });

  it('leaves broken or other files alone', () => {
    const junk = new Uint8Array([0xff, 0xd8, 0x00, 0x01]);
    expect(stripMetadata(junk, 'image/jpeg')).toBe(junk);
    const gif = new Uint8Array(ascii('GIF89a....'));
    expect(stripMetadata(gif, 'image/gif')).toBe(gif);
  });
});
