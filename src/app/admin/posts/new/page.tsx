import { PostForm } from '@/components/admin/forms';
import { PageHead } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function NewPost({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <PageHead title="Viết bài" />
      <PostForm error={error} />
    </>
  );
}
