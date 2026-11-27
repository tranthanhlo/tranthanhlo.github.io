import { Resend } from 'resend';

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
}

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

// One plain message (account notices, error alerts). Does nothing when email is not set up.
export async function sendOne(to: string, subject: string, text: string): Promise<boolean> {
  if (!emailConfigured() || !to) return false;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject,
      text,
      html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:16px;white-space:pre-wrap">${escapeHtml(text)}</div>`,
    });
    if (error) console.error('email failed', error.message);
    return !error;
  } catch (e) {
    console.error('email failed', e);
    return false;
  }
}

export const firstAdminEmail = () => (process.env.ADMIN_EMAILS ?? '').split(',')[0].trim();

// Sends in batches of 100. With no RESEND_API_KEY it sends nothing and says so (a "dry run").
export async function sendMails(mails: Mail[]): Promise<{ sent: number; dryRun: boolean; error?: string }> {
  if (!emailConfigured()) return { sent: 0, dryRun: true };
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (let i = 0; i < mails.length; i += 100) {
    const batch = mails.slice(i, i + 100).map((m) => ({
      from: process.env.EMAIL_FROM!,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text,
      // lets mail apps show their own "Unsubscribe" button
      headers: { 'List-Unsubscribe': `<${m.unsubscribeUrl}>` },
    }));
    const { error } = await resend.batch.send(batch);
    if (error) return { sent, dryRun: false, error: error.message };
    sent += batch.length;
  }
  return { sent, dryRun: false };
}
