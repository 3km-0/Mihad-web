import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Commercial site activation — Mihad',
  description: 'Submit tenant demand for showrooms, equipment yards, project offices, logistics yards, retail pods, and modular commercial sites.',
  alternates: { canonical: absoluteUrl('/for-businesses') },
};

export default function ForBusinessesPage() {
  const uses = ['Vehicle showrooms', 'Equipment rental yards', 'Project offices', 'Logistics yards', 'Retail pods', 'Cafes', 'Clinics', 'Site facilities'];
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-[8px] border border-[#d8cfba] bg-[#24352f] p-8 text-white md:p-10">
          <Building2 className="h-10 w-10 text-[#d3b36b]" />
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight tracking-normal">Commercial sites activated with modular units</h1>
          <p className="mt-3 text-right text-2xl font-semibold text-[#d3b36b]" dir="rtl">مواقع تجارية قابلة للتفعيل بوحدات جاهزة</p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#d7e2dc]">Submit the business need first: activity, city, land area, monthly budget, lease term, and timing. Mihad then screens land and modular fit.</p>
          <Link href="/request-quote?audience=tenant&project_type=commercial_site" className="mt-6 inline-flex min-h-11 items-center rounded-[8px] bg-white px-4 text-sm font-semibold text-[#24352f]">Start commercial site request</Link>
        </section>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {uses.map((use) => <div key={use} className="rounded-[8px] border border-[#d8cfba] bg-white p-5 font-semibold">{use}</div>)}
        </div>
      </main>
    </PublicPageShell>
  );
}
