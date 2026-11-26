'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { reorderTools } from '@/actions/admin';
import { ToolIcon } from '@/components/ToolIcon';
import { Badge, btnPrimary } from './ui';

interface Row {
  id: number;
  name: string;
  iconUrl: string | null;
  platform: string | null;
  published: boolean;
  isSample: boolean;
}

// Drag the handle (finger or mouse) to change the order; ↑ ↓ do the same from the keyboard.
// Nothing is saved until "Save order" is pressed.
export function ToolOrderList({ tools }: { tools: Row[] }) {
  const [rows, setRows] = useState(tools);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const refs = useRef(new Map<number, HTMLLIElement>());

  function move(from: number, to: number) {
    if (to < 0 || to >= rows.length || from === to) return;
    setRows((old) => {
      const next = [...old];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
    setDirty(true);
    setSaved(false);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragId == null) return;
    const from = rows.findIndex((r) => r.id === dragId);
    // the row whose middle the finger has passed
    let to = from;
    rows.forEach((r, i) => {
      const el = refs.current.get(r.id);
      if (!el) return;
      const box = el.getBoundingClientRect();
      const mid = box.top + box.height / 2;
      if (i < from && e.clientY < mid) to = Math.min(to, i);
      if (i > from && e.clientY > mid) to = Math.max(to, i);
    });
    if (to !== from) move(from, to);
  }

  function save() {
    start(async () => {
      await reorderTools(rows.map((r) => r.id));
      setDirty(false);
      setSaved(true);
    });
  }

  return (
    <div>
      <ul onPointerMove={onPointerMove} onPointerUp={() => setDragId(null)} onPointerCancel={() => setDragId(null)} className="select-none">
        {rows.map((x, i) => (
          <li
            key={x.id}
            ref={(el) => {
              if (el) refs.current.set(x.id, el);
              else refs.current.delete(x.id);
            }}
            className={`flex min-h-14 items-center gap-2 border-b border-line ${dragId === x.id ? 'rounded-xl bg-surface shadow-lg' : ''}`}
          >
            <button
              type="button"
              aria-label={`Kéo để đổi vị trí ${x.name}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setDragId(x.id);
              }}
              className="grid size-11 shrink-0 cursor-grab touch-none place-items-center text-faint"
            >
              ⠿
            </button>
            <Link href={`/admin/tools/${x.id}`} className="press flex min-w-0 flex-1 items-center gap-3">
              <ToolIcon name={x.name} iconUrl={x.iconUrl} size={36} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{x.name}</span>
                <span className="block truncate text-xs text-faint">
                  #{i + 1} · {x.platform ?? '—'}
                  {x.isSample && ' · mẫu'}
                </span>
              </span>
            </Link>
            <Badge on={x.published} />
            <span className="flex shrink-0">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Đưa ${x.name} lên`} className="press grid size-11 place-items-center disabled:opacity-30">
                ↑
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === rows.length - 1} aria-label={`Đưa ${x.name} xuống`} className="press grid size-11 place-items-center disabled:opacity-30">
                ↓
              </button>
            </span>
          </li>
        ))}
      </ul>
      {(dirty || saved) && (
        <div className="mt-4 flex items-center gap-3">
          {dirty && (
            <button type="button" onClick={save} disabled={pending} className={btnPrimary}>
              Lưu thứ tự
            </button>
          )}
          {saved && !dirty && <p role="status" className="text-sm text-soft">Đã lưu thứ tự.</p>}
        </div>
      )}
    </div>
  );
}
