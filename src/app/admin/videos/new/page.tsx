import { VideoForm } from '@/components/admin/forms';
import { PageHead } from '@/components/admin/ui';
import { getTools } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewVideo({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <PageHead title="Thêm video" />
      <VideoForm tools={await getTools({ drafts: true })} error={error} />
    </>
  );
}
