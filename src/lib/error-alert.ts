import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { emailConfigured, firstAdminEmail, sendOne } from '@/lib/email';

const ALERT_EVERY_MS = 10 * 60_000;

// Emails the admin about a server error, at most once every 10 minutes so a burst of errors does
// not flood the inbox. Does nothing when email is not set up. Never throws.
export async function alertAdmin(method: string, path: string, route: string, message: string, digest: string): Promise<void> {
  try {
    if (!emailConfigured() || !firstAdminEmail()) return;
    const db = await getDb();
    const key = 'last_error_email';
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
    if (row && Date.now() - Number(row.value) < ALERT_EVERY_MS) return;
    const value = String(Date.now());
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
    const env = process.env.VERCEL_ENV ?? 'local';
    await sendOne(
      firstAdminEmail(),
      `[${env}] Lỗi máy chủ: ${method} ${path}`,
      `Trang: ${path}\nRoute: ${route}\nLỗi: ${message}\nMã (digest): ${digest || '-'}\n\nXem chi tiết trong Vercel → Logs. Các lỗi tiếp theo trong 10 phút sẽ không gửi email.`,
    );
  } catch {
    // reporting must never cause another error
  }
}
