import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { stripMetadata } from '@/lib/strip-metadata';
import { logAdmin } from '@/lib/audit';

const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
const MAX = 5 * 1024 * 1024;

// the real file type, from its first bytes (the browser's label can be faked)
function sniff(b: Uint8Array): string | null {
  const s = (from: number, str: string) => str.split('').every((c, i) => b[from + i] === c.charCodeAt(0));
  if (b[0] === 0x89 && s(1, 'PNG')) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (s(0, 'GIF8')) return 'image/gif';
  if (s(0, 'RIFF') && s(8, 'WEBP')) return 'image/webp';
  if (s(4, 'ftyp') && (s(8, 'avif') || s(8, 'avis'))) return 'image/avif';
  return null;
}

// Admin only. Images go to Vercel Blob; on a developer's machine without a token they go to public/uploads.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no-file' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'too-big' }, { status: 413 });
  const raw = new Uint8Array(await file.arrayBuffer());
  const type = sniff(raw);
  if (!type || !TYPES[type]) return NextResponse.json({ error: 'bad-type' }, { status: 415 });
  // drop GPS position, camera and other hidden details before the picture becomes public
  const bytes = stripMetadata(raw, type);

  const name = `${crypto.randomUUID()}.${TYPES[type]}`;
  await logAdmin(user.email, 'image.upload', name);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${name}`, Buffer.from(bytes), { access: 'public', contentType: type });
    return NextResponse.json({ url: blob.url });
  }
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'storage-not-configured' }, { status: 500 });
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return NextResponse.json({ url: `/uploads/${name}` });
}
