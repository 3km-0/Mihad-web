import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Modular spaces for business projects — Mihad',
  description: 'Submit business RFQs for modular offices, staff housing, clinics, classrooms, retail kiosks, cafes, and site facilities.',
  alternates: { canonical: absoluteUrl('/for-businesses') },
};

export default function ForBusinessesPage() {
  const uses = ['Site offices', 'Staff housing', 'Clinics', 'Classrooms', 'Hospitality cabins', 'Retail kiosks', 'Cafes', 'Site facilities'];
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-[8px] border border-[#d8cfba] bg-[#24352f] p-8 text-white md:p-10">
          <Building2 className="h-10 w-10 text-[#d3b36b]" />
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight tracking-normal">Modular spaces for business projects</h1>
          <p className="mt-3 text-right text-2xl font-semibold text-[#d3b36b]" dir="rtl">وحدات جاهزة للمشاريع التجارية</p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#d7e2dc]">Request quotes for repeat procurement, urgent site needs, and practical commercial units.</p>
          <Link href="/request-quote?project_type=modular_office" className="mt-6 inline-flex min-h-11 items-center rounded-[8px] bg-white px-4 text-sm font-semibold text-[#24352f]">Submit business RFQ</Link>
        </section>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {uses.map((use) => <div key={use} className="rounded-[8px] border border-[#d8cfba] bg-white p-5 font-semibold">{use}</div>)}
        </div>
      </main>
    </PublicPageShell>
  );
}
