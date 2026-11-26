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
