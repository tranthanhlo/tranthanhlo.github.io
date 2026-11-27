import type { Instrumentation } from 'next';

export function register() {}

// A server error is always logged; on the Node.js runtime the admin also gets an email when
// email is set up (src/lib/error-alert.ts).
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const e = err as Error & { digest?: string };
  console.error('[request error]', request.method, request.path, context.routePath, e?.digest ?? '', e?.message);
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { alertAdmin } = await import('./lib/error-alert');
    await alertAdmin(request.method, request.path, context.routePath, e?.message ?? String(err), e?.digest ?? '');
  }
};
