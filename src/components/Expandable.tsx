'use client';

import { useState } from 'react';

// A description that shows three lines until "Show more" is pressed. The HTML was cleaned on the server.
export function Expandable({ html, more, less, long }: { html: string; more: string; less: string; long: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className={`prose compact ${open || !long ? '' : 'clamped'}`} dangerouslySetInnerHTML={{ __html: html }} />
      {long && (
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="press mt-1 min-h-11 text-sm font-semibold">
          {open ? less : more}
        </button>
      )}
    </div>
  );
}
