import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { Calculator, FileText } from 'lucide-react';
import { PublicPageShell, SectionHeading } from '@/components/prefab/PrefabMarketing';
import { FIELDBOOK_ARTICLES } from '@/lib/prefab-content';
import { pickLocalized } from '@/lib/prefab-copy';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Prefab Fieldbook — Mihad',
  description: 'Prefab ideas, use cases, supplier stories, model breakdowns, and planning ranges for Saudi modular projects.',
  alternates: { canonical: absoluteUrl('/fieldbook') },
};

export default async function FieldbookPage() {
  const locale = await getLocale();

  return (
    <PublicPageShell>
      <main>
        <section className="border-b border-[#D8DEE8] bg-[#F8FAFC]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:px-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-[999px] border border-[#D8DEE8] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">
                <FileText className="h-4 w-4" />
                {pickLocalized(locale, 'دليل مهاد', 'Prefab Fieldbook')}
              </p>
              <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-normal text-[#101827]">
                {pickLocalized(locale, 'أفكار مباني جاهزة تتحول إلى أرقام واضحة', 'Prefab ideas that turn into practical numbers')}
              </h1>
              <p className="mt-4 text-lg leading-8 text-[#334155]">
                {pickLocalized(
                  locale,
                  'كل مقالة تجمع الصورة، الاستخدام، نطاق التكلفة، جاهزية الموقع، والنموذج المناسب. اقرأ الفكرة ثم احسبها مباشرة.',
                  'Each article combines imagery, use case, planning range, site readiness, and model fit. Read the idea, then estimate it.'
                )}
              </p>
            </div>
            <Link href="/calculator" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-[#23395D] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4E89] lg:justify-self-end">
              <Calculator className="h-4 w-4" />
              {pickLocalized(locale, 'احسب مشروعك الجاهز', 'Estimate your prefab project')}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={pickLocalized(locale, 'المقالات', 'Articles')}
            title={pickLocalized(locale, 'استخدم الدليل كمكتبة أفكار عملية', 'Use the Fieldbook as a practical idea library')}
            titleAr="استخدم الدليل كمكتبة أفكار عملية"
            body={pickLocalized(locale, 'ليست صورًا فقط: كل فكرة فيها افتراضات ونواقص وخطوة حساب واضحة.', 'Not just images: every idea includes assumptions, gaps, and a calculator handoff.')}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FIELDBOOK_ARTICLES.map((article) => (
              <Link key={article.slug} href={`/fieldbook/${article.slug}`} className="group overflow-hidden rounded-[8px] border border-[#D8DEE8] bg-white shadow-[0_12px_35px_rgba(16,24,39,0.06)] transition hover:-translate-y-0.5 hover:border-[#1D4E89]">
                <div className="relative aspect-[4/3]">
                  <Image src={article.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 33vw, 100vw" />
                  <span className="absolute left-3 top-3 rounded-[6px] bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#1D4E89]">{article.type.replaceAll('_', ' ')}</span>
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-[#101827]">{pickLocalized(locale, article.titleAr, article.title)}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#334155]">{pickLocalized(locale, article.dekAr, article.dek)}</p>
                  <div className="mt-4 grid gap-2 text-sm text-[#334155]">
                    <span>{article.sizeRange}</span>
                    <span>{article.costRange}</span>
                    <span>{article.timeline}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
