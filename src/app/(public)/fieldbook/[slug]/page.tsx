import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { Calculator } from 'lucide-react';
import { PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { FIELDBOOK_ARTICLES, getFieldbookArticle } from '@/lib/prefab-content';
import { pickLocalized } from '@/lib/prefab-copy';
import { absoluteUrl } from '@/lib/seo';

export function generateStaticParams() {
  return FIELDBOOK_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getFieldbookArticle(slug);
  if (!article) return { title: 'Prefab Fieldbook — Mihad' };
  return {
    title: `${article.title} — Mihad Fieldbook`,
    description: article.dek,
    alternates: { canonical: absoluteUrl(`/fieldbook/${article.slug}`) },
  };
}

export default async function FieldbookArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getFieldbookArticle(slug);
  if (!article) notFound();
  const locale = await getLocale();
  const calculatorHref = `/calculator?category=${article.categorySlug}`;

  return (
    <PublicPageShell>
      <main>
        <section className="relative min-h-[520px] overflow-hidden">
          <Image src={article.image} alt="" fill className="object-cover" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
          <div className="relative mx-auto flex min-h-[520px] max-w-5xl flex-col justify-end px-4 py-12 text-white sm:px-6 lg:px-8">
            <Link href="/fieldbook" className="mb-6 text-sm font-semibold text-white/85">{pickLocalized(locale, 'دليل مهاد', 'Prefab Fieldbook')}</Link>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A6E3B8]">{article.type.replaceAll('_', ' ')}</p>
            <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-normal">{pickLocalized(locale, article.titleAr, article.title)}</h1>
            <p className="mt-3 text-right text-2xl font-semibold text-[#A6E3B8]" dir="rtl">{article.titleAr}</p>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/85">{pickLocalized(locale, article.dekAr, article.dek)}</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <article className="space-y-6">
            {article.sections.map((section) => (
              <section key={section.heading} className="rounded-[8px] border border-[#D8DEE8] bg-white p-6">
                <h2 className="text-2xl font-semibold text-[#101827]">{pickLocalized(locale, section.headingAr, section.heading)}</h2>
                <p className="mt-3 leading-8 text-[#334155]">{pickLocalized(locale, section.bodyAr, section.body)}</p>
              </section>
            ))}
          </article>

          <aside className="space-y-4">
            <div className="rounded-[8px] border border-[#D8DEE8] bg-white p-5">
              <h2 className="text-xl font-semibold text-[#101827]">{pickLocalized(locale, 'ملخص التخطيط', 'Planning snapshot')}</h2>
              <div className="mt-4 grid gap-3 text-sm text-[#334155]">
                <span>{pickLocalized(locale, 'النموذج', 'Model')}: {article.modelHint}</span>
                <span>{pickLocalized(locale, 'ملاءمة المورد', 'Supplier fit')}: {article.supplierHint}</span>
                <span>{pickLocalized(locale, 'المساحة', 'Size')}: {article.sizeRange}</span>
                <span>{pickLocalized(locale, 'النطاق', 'Range')}: {article.costRange}</span>
                <span>{pickLocalized(locale, 'المدة', 'Timeline')}: {article.timeline}</span>
              </div>
              <Link href={calculatorHref} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#23395D] px-4 text-sm font-semibold text-white">
                <Calculator className="h-4 w-4" />
                {pickLocalized(locale, 'احسب هذه الفكرة', 'Estimate this concept')}
              </Link>
            </div>
            <div className="rounded-[8px] border border-[#D8DEE8] bg-[#F8FAFC] p-5">
              <h2 className="text-xl font-semibold text-[#101827]">{pickLocalized(locale, 'جاهزية الموقع', 'Site readiness')}</h2>
              <div className="mt-4 grid gap-2">
                {article.readinessChecklist.map((item) => (
                  <div key={item} className="rounded-[6px] bg-white px-3 py-2 text-sm text-[#334155]">{item}</div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </PublicPageShell>
  );
}
