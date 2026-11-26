import { notFound } from 'next/navigation';
import { PostForm } from '@/components/admin/forms';
import { PageHead } from '@/components/admin/ui';
import { getPostById } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const id = Number((await params).id);
  const post = Number.isInteger(id) ? await getPostById(id) : null;
  if (!post) notFound();
  const { error } = await searchParams;
  return (
    <>
      <PageHead title="Sửa bài viết" />
      <PostForm post={post} error={error} />
    </>
  );
}
