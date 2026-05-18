import { redirect } from 'next/navigation';

export default async function RetiredPropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/spaces/${slug}`);
}
