// Removes hidden metadata from uploaded pictures: camera details, date, and above all the GPS
// position a phone writes into its photos. The picture itself is not touched (no re-encoding).
// JPEG keeps only the rotation flag (so phone photos stay the right way up), PNG and WebP drop
// their metadata blocks. Other types come back unchanged.

export function stripMetadata(bytes: Uint8Array, type: string): Uint8Array {
  try {
    if (type === 'image/jpeg') return stripJpeg(bytes);
    if (type === 'image/png') return stripPng(bytes);
    if (type === 'image/webp') return stripWebp(bytes);
  } catch {
    // a file we cannot walk through safely is kept as it was
  }
  return bytes;
}

/* ---------- JPEG ---------- */

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

// The orientation tag (0x0112) of an EXIF block, or 0 when there is none
export function exifOrientation(payload: Uint8Array): number {
  // payload = "Exif\0\0" + TIFF
  if (payload.length < 14 || String.fromCharCode(...payload.subarray(0, 4)) !== 'Exif') return 0;
  const tiff = payload.subarray(6);
  const le = tiff[0] === 0x49; // "II" little endian, "MM" big endian
  const u16 = (o: number) => (le ? tiff[o] | (tiff[o + 1] << 8) : (tiff[o] << 8) | tiff[o + 1]);
  const u32 = (o: number) => (le ? (tiff[o] | (tiff[o + 1] << 8) | (tiff[o + 2] << 16)) + tiff[o + 3] * 2 ** 24 : tiff[o] * 2 ** 24 + ((tiff[o + 1] << 16) | (tiff[o + 2] << 8) | tiff[o + 3]));
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return 0;
  const n = u16(ifd);
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > tiff.length) return 0;
    if (u16(e) === 0x0112) {
      const v = u16(e + 8);
      return v >= 1 && v <= 8 ? v : 0;
    }
  }
  return 0;
}

// A tiny APP1 block holding nothing but the orientation
function orientationApp1(orientation: number): Uint8Array {
  const tiff = [0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, 0, 0, 0, 0];
  const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]; // "Exif\0\0"
  const len = payload.length + 2;
  return new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...payload]);
}

function stripJpeg(b: Uint8Array): Uint8Array {
  if (b[0] !== 0xff || b[1] !== 0xd8) return b;
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  let orientation = 0;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) throw new Error('bad marker');
    const marker = b[i + 1];
    if (marker === 0xff) {
      i++; // fill byte
      continue;
    }
    if (marker === 0xda || marker === 0xd9) {
      // start of the picture data: everything from here on is kept as is
      if (orientation > 1) parts.splice(1, 0, orientationApp1(orientation));
      parts.push(b.subarray(i));
      return concat(parts);
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2 || i + 2 + len > b.length) throw new Error('bad length');
    const seg = b.subarray(i, i + 2 + len);
    const payload = seg.subarray(4);
    if (marker === 0xe1) {
      // APP1: EXIF or XMP. Keep only the rotation.
      orientation ||= exifOrientation(payload);
    } else if (marker !== 0xed && marker !== 0xfe) {
      // drop APP13 (Photoshop/IPTC) and COM (comments); keep everything else, e.g. the colour profile
      parts.push(seg);
    }
    i += 2 + len;
  }
  throw new Error('no picture data');
}

/* ---------- PNG ---------- */

const PNG_DROP = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt']);

function stripPng(b: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [b.subarray(0, 8)];
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 8;
  while (i + 12 <= b.length) {
    const len = view.getUint32(i);
    const type = String.fromCharCode(...b.subarray(i + 4, i + 8));
    const end = i + 12 + len;
    if (end > b.length) throw new Error('bad chunk');
    if (!PNG_DROP.has(type)) parts.push(b.subarray(i, end));
    i = end;
    if (type === 'IEND') break;
  }
  return concat(parts);
}

/* ---------- WebP ---------- */

function stripWebp(b: Uint8Array): Uint8Array {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const parts: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= b.length) {
    const fourcc = String.fromCharCode(...b.subarray(i, i + 4));
    const size = view.getUint32(i + 4, true);
    const end = i + 8 + size + (size & 1);
    if (i + 8 + size > b.length) throw new Error('bad chunk');
    if (fourcc === 'VP8X') {
      const chunk = b.slice(i, Math.min(end, b.length));
      chunk[8] &= ~(0x08 | 0x04); // clear the "has EXIF" and "has XMP" flags
      parts.push(chunk);
    } else if (fourcc !== 'EXIF' && fourcc !== 'XMP ') {
      parts.push(b.subarray(i, Math.min(end, b.length)));
    }
    i = end;
  }
  const body = concat(parts);
  const head = b.slice(0, 12);
  new DataView(head.buffer).setUint32(4, body.length + 4, true);
  return concat([head, body]);
}
