'use client';

import { useState } from 'react';
import { lookupYoutube } from '@/actions/admin';
import { inputClass } from './ui';

// Paste a YouTube link, press the button, and the title and picture are filled in for you
export function YoutubeField({ defaultValue = '' }: { defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? '');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<{ thumb: string; msg: string } | null>(null);

  async function look() {
    setBusy(true);
    const r = await lookupYoutube(value);
    setBusy(false);
    if (!r.ok) return setInfo({ thumb: '', msg: 'Không đọc được link YouTube này.' });
    setValue(r.id);
    const title = document.getElementById('title') as HTMLInputElement | null;
    if (title && !title.value && r.title) title.value = r.title;
    setInfo({ thumb: r.thumbnail, msg: r.title ? `Đã lấy: ${r.title}` : 'Đã nhận video. Chưa lấy được tiêu đề, hãy nhập tay.' });
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">Link YouTube</span>
      <div className="flex gap-2">
        <input name="youtube" value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://youtu.be/…" aria-label="Link YouTube" className={inputClass} />
        <button type="button" onClick={look} disabled={busy || !value.trim()} className="press min-h-11 shrink-0 rounded-full bg-surface px-5 text-sm font-semibold disabled:opacity-40">
          {busy ? '…' : 'Lấy thông tin'}
        </button>
      </div>
      <p className="mt-1 text-xs text-faint">Để trống nếu chưa có video (trang sẽ hiện “Video sắp có”).</p>
      {info && (
        <div className="mt-2 flex items-center gap-3">
          {info.thumb && <img src={info.thumb} alt="" className="h-14 rounded-lg" />}
          <p role="status" className="text-sm text-soft">{info.msg}</p>
        </div>
      )}
    </div>
  );
}
