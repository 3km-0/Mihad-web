import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { getGuidePage } from '@/lib/prefab-content';
import { absoluteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const guide = getGuidePage(country);
  if (!guide) return { title: 'Prefab guide — Mihad' };
  return {
    title: `${guide.title} — Mihad`,
    description: guide.description,
    alternates: { canonical: absoluteUrl(`/guides/${guide.slug}`) },
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const guide = getGuidePage(country);
  if (!guide) notFound();
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/guides" className="text-sm font-semibold text-[#1f6b4f]">Back to guides</Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7650]">{guide.category} · {guide.readMinutes} min read</p>
        <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-normal text-[#24352f]">{guide.title}</h1>
        <p className="mt-3 text-right text-2xl font-semibold text-[#1f6b4f]" dir="rtl">{guide.titleAr}</p>
        <p className="mt-5 text-lg leading-8 text-[#59645e]">{guide.description}</p>

        <article className="mt-10 space-y-8">
          {guide.sections.map((section) => (
            <section key={section.heading} className="rounded-[8px] border border-[#d8cfba] bg-white p-6">
              <h2 className="text-2xl font-semibold text-[#24352f]">{section.heading}</h2>
              <p className="mt-3 leading-8 text-[#59645e]">{section.body}</p>
            </section>
          ))}
        </article>

        <section className="mt-10 rounded-[8px] border border-[#d8cfba] bg-[#f5f1e7] p-6">
          <h2 className="text-2xl font-semibold">Checklist</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {guide.checklist.map((item) => <div key={item} className="rounded-[8px] bg-white p-3 text-sm text-[#59645e]">{item}</div>)}
          </div>
          <Link href="/calculator" className="mt-6 inline-flex min-h-11 items-center rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white">Estimate with this checklist</Link>
        </section>
      </main>
    </PublicPageShell>
  );
}
