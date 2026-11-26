'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: React.ReactNode;
  tall?: boolean;
}

// A panel that slides up from the bottom, like the phone app's comment sheet.
// Escape or a tap outside closes it; focus moves in and goes back to the button that opened it.
export function Sheet({ open, onClose, title, closeLabel, children, tall = false }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center" role="presentation">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex w-full max-w-lg flex-col rounded-t-2xl bg-bg shadow-2xl outline-none lg:rounded-2xl ${tall ? 'h-[80dvh]' : 'max-h-[85dvh]'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between border-b border-line px-4">
          <h2 className="py-3 text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="press hoverable grid size-11 place-items-center rounded-full">
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
