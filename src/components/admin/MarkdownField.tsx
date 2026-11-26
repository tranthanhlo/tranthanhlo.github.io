'use client';

import { useRef, useState } from 'react';
import { previewMarkdown } from '@/actions/admin';
import { inputClass } from './ui';

// A Markdown box with a preview tab and an "insert image" button
export function MarkdownField({ name, label, defaultValue = '', rows = 10 }: { name: string; label: string; defaultValue?: string | null; rows?: number }) {
  const [value, setValue] = useState(defaultValue ?? '');
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [html, setHtml] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  async function show() {
    setMode('preview');
    setHtml(await previewMarkdown(value));
  }

  async function insertImage(file: File) {
    setBusy(true);
    try {
      const body = new FormData();
      body.set('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        const at = ref.current?.selectionStart ?? value.length;
        setValue(value.slice(0, at) + `![](${data.url})` + value.slice(at));
      }
    } catch {}
    setBusy(false);
  }

  const tab = (on: boolean) => `press min-h-11 px-4 text-sm font-semibold border-b-2 ${on ? 'border-accent' : 'border-transparent text-faint'}`;

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="flex items-center border-b border-line" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'write'} className={tab(mode === 'write')} onClick={() => setMode('write')}>
          Soạn
        </button>
        <button type="button" role="tab" aria-selected={mode === 'preview'} className={tab(mode === 'preview')} onClick={show}>
          Xem trước
        </button>
        <label className="press ml-auto inline-flex min-h-11 cursor-pointer items-center px-3 text-sm text-soft">
          {busy ? 'Đang tải…' : 'Chèn ảnh'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && insertImage(e.target.files[0])} />
        </label>
      </div>
      {/* the textarea stays in the page while previewing so its text is still sent with the form */}
      <textarea
        ref={ref}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        aria-label={label}
        className={`${inputClass} mt-2 py-3 font-mono text-sm leading-relaxed ${mode === 'preview' ? 'hidden' : ''}`}
      />
      {mode === 'preview' && <div className="prose compact mt-2 rounded-xl border border-line p-4" dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}
