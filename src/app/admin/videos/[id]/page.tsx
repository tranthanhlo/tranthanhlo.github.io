import { notFound } from 'next/navigation';
import { VideoForm } from '@/components/admin/forms';
import { PageHead } from '@/components/admin/ui';
import { getTools, getVideoById } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditVideo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const id = Number((await params).id);
  const video = Number.isInteger(id) ? await getVideoById(id) : null;
  if (!video) notFound();
  const { error } = await searchParams;
  return (
    <>
      <PageHead title="Sửa video" />
      <VideoForm video={video} tools={await getTools({ drafts: true })} error={error} />
    </>
  );
}
