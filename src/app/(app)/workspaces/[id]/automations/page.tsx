import { redirect } from 'next/navigation';

export default async function WorkspaceAutomationsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/workspaces/${encodeURIComponent(id)}`);
}
