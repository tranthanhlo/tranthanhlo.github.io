'use client';

import { useEffect, useState } from 'react';

// "Autoplay previews: On / Off", kept on this device only
export function AutoplaySetting({ label, on, off }: { label: string; on: string; off: string }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem('autoplay') !== 'off');
    } catch {}
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem('autoplay', next ? 'on' : 'off');
    } catch {}
  }

  return (
    <div className="flex min-h-12 items-center justify-between border-b border-line text-[15px]">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={toggle}
        className={`press relative h-7 w-12 rounded-full transition-colors ${enabled ? 'bg-ink' : 'bg-surface'}`}
      >
        <span className={`absolute top-0.5 size-6 rounded-full transition-all ${enabled ? 'left-[22px] bg-bg' : 'left-0.5 bg-faint'}`} />
        <span className="sr-only">{enabled ? on : off}</span>
      </button>
    </div>
  );
}
