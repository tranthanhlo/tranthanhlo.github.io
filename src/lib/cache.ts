import { revalidateTag, unstable_cache } from 'next/cache';

// Public content (videos, tools, posts) is kept for up to 60 seconds between database reads.
// Anything the admin changes clears it at once (contentChanged), so edits show immediately.
const TAG = 'content';

// The cache stores JSON, which turns dates into text; turn fields ending in "At" back into dates.
export function reviveDates<T>(value: T): T {
  // a real date (the data did not pass through the cache) must be left alone
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(reviveDates) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = /At$/.test(k) && typeof v === 'string' ? new Date(v) : reviveDates(v);
    }
    return out as T;
  }
  return value;
}

export function cached<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string): (...args: A) => Promise<R> {
  return async (...args: A) => {
    // outside Next.js (scripts, tests) there is no cache: read straight from the database
    if (!process.env.NEXT_RUNTIME) return fn(...args);
    const run = unstable_cache(() => fn(...args), [key, JSON.stringify(args)], { tags: [TAG], revalidate: 60 });
    return reviveDates(await run());
  };
}

export function contentChanged(): void {
  try {
    revalidateTag(TAG);
  } catch {
    // not inside a Next.js request (scripts, tests)
  }
}
