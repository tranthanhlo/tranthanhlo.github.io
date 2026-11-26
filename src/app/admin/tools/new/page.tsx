import { ToolForm } from '@/components/admin/forms';
import { PageHead } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function NewTool({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <PageHead title="Thêm tool" />
      <ToolForm error={error} />
    </>
  );
}
