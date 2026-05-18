import type { Metadata } from 'next';
import { EmptyDataNotice, ModelCard, PublicPageShell, SectionHeading } from '@/components/prefab/PrefabMarketing';
import { listPublicModels } from '@/lib/prefab-public-data';
import { absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Prefab models — Mihad',
  description: 'Browse Saudi prefab models and estimate project scope with clear planning notes.',
  alternates: { canonical: absoluteUrl('/models') },
};

export default async function ModelsPage() {
  const models = await listPublicModels({});
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Models" title="Popular prefab models" titleAr="نماذج جاهزة شائعة" body="Use model pages to understand size, scope, delivery regions, and supplier fit before estimating the project." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {models.length ? models.map((model) => <ModelCard key={model.id} model={model} />) : <div className="md:col-span-3"><EmptyDataNotice kind="models" /></div>}
        </div>
      </main>
    </PublicPageShell>
  );
}
