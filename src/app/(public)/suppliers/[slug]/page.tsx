import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Factory, ShieldCheck } from 'lucide-react';
import { ModelCard, PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { getPublicSupplier, listPublicModels, verificationLabel } from '@/lib/prefab-public-data';
import { absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await getPublicSupplier(slug);
  if (!supplier) return { title: 'Prefab supplier — Mihad' };
  return {
    title: `${supplier.name} — Mihad`,
    description: `Supplier profile for ${supplier.name}: regions, categories, warranty, response SLA, and quote request.`,
    alternates: { canonical: absoluteUrl(`/suppliers/${supplier.slug}`) },
  };
}

export default async function SupplierProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supplier = await getPublicSupplier(slug);
  if (!supplier) notFound();
  const models = (await listPublicModels({})).filter((model) => model.supplier?.id === supplier.id);

  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[8px] border border-[#d8cfba] bg-white p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-[6px] bg-[#eef6ef] px-2.5 py-1 text-sm font-semibold text-[#1f6b4f]">
                <BadgeCheck className="h-4 w-4" />
                {verificationLabel(supplier.verificationState)}
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-normal">{supplier.name}</h1>
              <p className="mt-3 text-lg text-[#59645e]">{supplier.city} · Serves {supplier.regionsServed.join(', ') || 'Saudi Arabia'}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {supplier.categories.map((category) => (
                  <span key={category} className="rounded-[6px] border border-[#e1dac9] px-2 py-1 text-xs text-[#59645e]">{category.replaceAll('_', ' ')}</span>
                ))}
              </div>
            </div>
            <div className="rounded-[8px] border border-[#d8cfba] bg-[#f5f1e7] p-5">
              <Factory className="h-8 w-8 text-[#b88a3b]" />
              <div className="mt-4 grid gap-2 text-sm text-[#59645e]">
                <span>{supplier.modelCount} published models</span>
                <span>{supplier.responseSlaMinutes ? `${Math.round(supplier.responseSlaMinutes / 60)}h response SLA` : 'Response SLA pending'}</span>
                <span>{Object.keys(supplier.warranty).length ? 'Warranty information provided' : 'Warranty information pending'}</span>
              </div>
              <Link href={`/request-quote?supplier=${supplier.id}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white">Request quote from this supplier</Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {['Commercial identity reviewed', 'Portfolio and categories reviewed', 'Scope and SLA information visible'].map((item) => (
            <div key={item} className="rounded-[8px] border border-[#d8cfba] bg-white p-5">
              <ShieldCheck className="h-7 w-7 text-[#1f6b4f]" />
              <p className="mt-3 font-semibold">{item}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[8px] border border-[#d8cfba] bg-[#f5f1e7] p-6">
          <h2 className="text-2xl font-semibold">About the manufacturer</h2>
          <p className="mt-3 leading-7 text-[#59645e]">{supplier.notes || 'Supplier profile is being reviewed by Mihad.'}</p>
          <p className="mt-4 text-sm leading-6 text-[#59645e]">
            Verification does not mean Mihad guarantees project approval, pricing, or delivery. It means the supplier has submitted key company, portfolio, and service information for review.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-3xl font-semibold">Models from this supplier</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {models.length ? models.map((model) => <ModelCard key={model.id} model={model} />) : <p className="text-[#59645e]">No active models are published for this supplier yet.</p>}
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
