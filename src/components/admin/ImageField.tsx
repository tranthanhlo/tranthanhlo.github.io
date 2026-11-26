'use client';

import { useState } from 'react';
import { inputClass } from './ui';

// A link to an image, plus a button that uploads a file and fills the link in
export function ImageField({ name, label, defaultValue = '' }: { name: string; label: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.set('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) setValue(data.url);
      else setError(data.error === 'too-big' ? 'Ảnh quá lớn (tối đa 5MB).' : data.error === 'bad-type' ? 'Chỉ nhận ảnh PNG, JPG, WebP, GIF, AVIF.' : 'Không tải lên được.');
    } catch {
      setError('Không tải lên được.');
    }
    setBusy(false);
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {value ? <img src={value} alt="" className="size-14 shrink-0 rounded-lg bg-surface object-cover" /> : <span className="size-14 shrink-0 rounded-lg bg-surface" />}
        <div className="min-w-0 flex-1">
          <input name={name} value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://…" aria-label={label} className={inputClass} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <label className="press inline-flex min-h-11 cursor-pointer items-center rounded-full bg-surface px-5 text-sm font-semibold">
          {busy ? 'Đang tải…' : 'Tải ảnh lên'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="sr-only"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
        {value && (
          <button type="button" onClick={() => setValue('')} className="press min-h-11 px-3 text-sm text-soft">
            Bỏ ảnh
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
