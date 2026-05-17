import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ModelCard, PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { formatPriceRange, getPublicModel, listPublicModels, verificationLabel } from '@/lib/prefab-public-data';
import { absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const model = await getPublicModel(slug);
  if (!model) return { title: 'Prefab model — Mihad' };
  return {
    title: `${model.name} — Mihad`,
    description: model.materialSummary || 'Prefab model details, scope, delivery regions, and quote request.',
    alternates: { canonical: absoluteUrl(`/models/${model.slug}`) },
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = await getPublicModel(slug);
  if (!model) notFound();
  const similar = (await listPublicModels({})).filter((item) => item.id !== model.id).slice(0, 3);

  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-[#d8cfba]">
            <Image src="/onboarding/workspace.jpg" alt="" fill className="object-cover" priority sizes="(min-width: 1024px) 55vw, 100vw" />
          </div>
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7650]">{model.modelType?.replaceAll('_', ' ') || 'Prefab model'}</p>
            <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-normal text-[#24352f]">{model.name}</h1>
            <p className="mt-4 text-lg leading-8 text-[#59645e]">{model.materialSummary || 'Request a quote to confirm supplier scope and delivery assumptions.'}</p>
            <div className="mt-6 grid gap-3 rounded-[8px] border border-[#d8cfba] bg-white p-5 text-sm text-[#59645e]">
              <span>Size: {model.sizeSqm ? `${model.sizeSqm} sqm` : 'Depends on configuration'}</span>
              <span>Rooms: {model.bedrooms ?? '-'} bedrooms · {model.bathrooms ?? '-'} bathrooms</span>
              <span>Price note: {formatPriceRange(model.priceRange)}</span>
              <span>Delivery regions: {model.deliveryRegions.join(', ') || 'Confirm with supplier'}</span>
              <span>Supplier: {model.supplier?.name || 'Mihad supplier network'} {model.supplier ? `· ${verificationLabel(model.supplier.verificationState)}` : ''}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/request-quote?model=${model.id}`} className="inline-flex min-h-11 items-center rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white">Request quote for this model</Link>
              {model.supplier ? <Link href={`/suppliers/${model.supplier.slug}`} className="inline-flex min-h-11 items-center rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold">View supplier</Link> : null}
            </div>
          </section>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <ScopePanel title="Included scope" items={model.includedScope} icon="include" />
          <ScopePanel title="Not included by default" items={model.excludedScope} icon="exclude" />
        </div>

        <section className="mt-10 rounded-[8px] border border-[#d8cfba] bg-[#f5f1e7] p-6">
          <h2 className="text-2xl font-semibold">Site requirements to confirm</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['Land access', 'Foundation', 'Utilities', 'Crane / transport access', 'Municipality or permit considerations'].map((item) => (
              <div key={item} className="rounded-[8px] bg-white p-3 text-sm text-[#59645e]">{item}</div>
            ))}
          </div>
        </section>

        {similar.length ? (
          <section className="mt-12">
            <h2 className="text-3xl font-semibold">Similar models</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {similar.map((item) => <ModelCard key={item.id} model={item} />)}
            </div>
          </section>
        ) : null}
      </main>
    </PublicPageShell>
  );
}

function ScopePanel({ title, items, icon }: { title: string; items: string[]; icon: 'include' | 'exclude' }) {
  const Icon = icon === 'include' ? CheckCircle2 : XCircle;
  return (
    <section className="rounded-[8px] border border-[#d8cfba] bg-white p-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">
        {(items.length ? items : ['Confirm directly in supplier quote']).map((item) => (
          <div key={item} className="flex gap-2 text-sm text-[#59645e]">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${icon === 'include' ? 'text-[#1f6b4f]' : 'text-[#b88a3b]'}`} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
