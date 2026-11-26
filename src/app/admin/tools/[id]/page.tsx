import { notFound } from 'next/navigation';
import { ToolForm } from '@/components/admin/forms';
import { PageHead } from '@/components/admin/ui';
import { getToolById } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditTool({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const id = Number((await params).id);
  const tool = Number.isInteger(id) ? await getToolById(id) : null;
  if (!tool) notFound();
  const { error } = await searchParams;
  return (
    <>
      <PageHead title="Sửa tool" />
      <ToolForm tool={tool} error={error} />
    </>
  );
}
