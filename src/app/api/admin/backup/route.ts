import { NextResponse } from 'next/server';
import { exportAll } from '@/lib/backup';
import { getSessionUser } from '@/lib/session';
import { logAdmin } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Admin only: download every table as one JSON file
export async function GET() {
  const user = await getSessionUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const dump = await exportAll();
  await logAdmin(user.email, 'backup.download');
  const day = dump.createdAt.slice(0, 10);
  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="tranthanhlo-backup-${day}.json"`,
      'cache-control': 'no-store',
    },
  });
}
