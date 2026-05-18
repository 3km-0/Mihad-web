import type { Metadata } from 'next';
import Link from 'next/link';
import { Factory } from 'lucide-react';
import { PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'For prefab manufacturers — Mihad',
  description: 'Join Mihad to publish modular units, appear in Fieldbook concepts, and receive calculator-backed project briefs.',
  alternates: { canonical: absoluteUrl('/for-manufacturers') },
};

export default function ForManufacturersPage() {
  const benefits = ['Verified supplier profile', 'Model listings', 'Lease and sale terms', 'Calculator-backed briefs', 'Fieldbook articles', 'Maintenance SLA visibility'];
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-[8px] border border-[#d8cfba] bg-white p-8 md:p-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <Factory className="h-10 w-10 text-[#1f6b4f]" />
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight tracking-normal">Put modular supply inside useful project planning</h1>
            <p className="mt-3 text-right text-2xl font-semibold text-[#1f6b4f]" dir="rtl">اعرض وحداتك داخل حاسبة ودليل مهاد</p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#59645e]">Share unit types, sizes, lease and sale pricing, installation/removal terms, delivery timeline, drawings, maintenance SLA, and served regions.</p>
            <Link href="/request-quote?audience=supplier&project_type=supplier_application" className="mt-6 inline-flex min-h-11 items-center rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white">Apply as supplier</Link>
          </div>
          <div className="grid gap-3">
            {benefits.map((benefit) => <div key={benefit} className="rounded-[8px] bg-[#f5f1e7] p-4 text-sm font-semibold text-[#24352f]">{benefit}</div>)}
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
