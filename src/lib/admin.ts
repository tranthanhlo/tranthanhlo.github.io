// Admin = a Google account whose email is listed in the ADMIN_EMAILS environment variable.
// Emails live in Vercel's settings (or .env.local), never in the code.
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

// "Dev login" buttons exist only on a developer's machine, never in production
export const devLoginEnabled = () => process.env.NODE_ENV !== 'production' && process.env.DEV_LOGIN === '1';
