import type { Metadata } from 'next';
import { EmptyDataNotice, PublicPageShell, SectionHeading, SupplierCard } from '@/components/prefab/PrefabMarketing';
import { listPublicSuppliers } from '@/lib/prefab-public-data';
import { absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Prefab suppliers — Mihad',
  description: 'Explore reviewed prefab manufacturers serving Saudi buyers and submit structured quote requests.',
  alternates: { canonical: absoluteUrl('/suppliers') },
};

export default async function SuppliersPage() {
  const suppliers = await listPublicSuppliers({});
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Suppliers" title="Reviewed prefab manufacturers in Saudi Arabia" titleAr="مصنّعون وموردون للبناء الجاهز في السعودية" body="Supplier profiles show regions served, categories, warranty information, response SLA, and verification state." />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {suppliers.length ? suppliers.map((supplier) => <SupplierCard key={supplier.id} supplier={supplier} />) : <div className="lg:col-span-3"><EmptyDataNotice kind="suppliers" /></div>}
        </div>
      </main>
    </PublicPageShell>
  );
}
