import Link from 'next/link';
import { desc, eq, inArray } from 'drizzle-orm';
import { setCommentHidden, setUserBanned } from '@/actions/admin';
import { deleteComment } from '@/actions/engage';
import { ConfirmButton } from '@/components/ConfirmButton';
import { btnDanger, PageHead } from '@/components/admin/ui';
import { getDb, schema } from '@/db';

export const dynamic = 'force-dynamic';

// the delete button reuses the member action, which lets an admin remove any comment
async function removeComment(fd: FormData) {
  'use server';
  await deleteComment(Number(fd.get('id')));
  const { redirect } = await import('next/navigation');
  redirect('/admin/comments');
}

export default async function AdminComments() {
  const db = await getDb();
  const { comments, users, videos, posts } = schema;
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      hidden: comments.hidden,
      createdAt: comments.createdAt,
      targetType: comments.targetType,
      targetId: comments.targetId,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      banned: users.banned,
      role: users.role,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .orderBy(desc(comments.createdAt))
    .limit(60);

  const vids = rows.filter((r) => r.targetType === 'video').map((r) => r.targetId);
  const pts = rows.filter((r) => r.targetType === 'post').map((r) => r.targetId);
  const [vRows, pRows] = await Promise.all([
    vids.length ? db.select({ id: videos.id, title: videos.title, slug: videos.slug }).from(videos).where(inArray(videos.id, vids)) : [],
    pts.length ? db.select({ id: posts.id, title: posts.title, slug: posts.slug }).from(posts).where(inArray(posts.id, pts)) : [],
  ]);
  const target = (type: string, id: number) => {
    const r = (type === 'video' ? vRows : pRows).find((x) => x.id === id);
    return r ? { title: r.title, href: `/${type === 'video' ? 'video' : 'blog'}/${r.slug}` } : null;
  };
  const small = 'press min-h-11 px-3 text-sm font-medium text-soft';

  return (
    <>
      <PageHead title="Bình luận" />
      {rows.length === 0 && <p className="text-soft">Chưa có bình luận nào.</p>}
      <ul className="grid gap-4">
        {rows.map((c) => {
          const tg = target(c.targetType, c.targetId);
          return (
            <li key={c.id} className={`rounded-2xl border border-line p-4 ${c.hidden ? 'opacity-60' : ''}`}>
              <p className="text-xs text-faint">
                <span className="font-semibold text-ink">{c.userName}</span> · {c.userEmail} · {c.createdAt.toLocaleString('vi-VN')}
                {c.hidden && ' · ĐÃ ẨN'}
                {c.banned && ' · ĐÃ CHẶN'}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words">{c.body}</p>
              {tg && (
                <p className="mt-1 text-xs text-faint">
                  Ở: <Link href={tg.href} className="underline">{tg.title}</Link>
                </p>
              )}
              <div className="-ml-3 mt-1 flex flex-wrap">
                <form action={setCommentHidden}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="hidden" value={c.hidden ? '0' : '1'} />
                  <button type="submit" className={small}>{c.hidden ? 'Hiện lại' : 'Ẩn'}</button>
                </form>
                <form action={removeComment}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton message="Xóa bình luận này?" className={`${btnDanger} !px-3`}>Xóa</ConfirmButton>
                </form>
                {c.role !== 'admin' && (
                  <form action={setUserBanned}>
                    <input type="hidden" name="userId" value={c.userId} />
                    <input type="hidden" name="banned" value={c.banned ? '0' : '1'} />
                    <button type="submit" className={small}>{c.banned ? 'Bỏ chặn người này' : 'Chặn người này'}</button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
