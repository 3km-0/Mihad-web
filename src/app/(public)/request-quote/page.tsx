import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { RequestQuoteForm } from '@/components/prefab/RequestQuoteForm';
import { PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { pickLocalized } from '@/lib/prefab-copy';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Request prefab quotes — Mihad',
  description: 'Submit your city, land status, budget, use case, and scope needs so Mihad can match your prefab RFQ with suitable suppliers.',
  alternates: { canonical: absoluteUrl('/request-quote') },
};

export default async function RequestQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ project_type?: string; model?: string; supplier?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const locale = await getLocale();

  return (
    <PublicPageShell>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <section className="pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7650]">
            {pickLocalized(locale, 'محرك طلبات الأسعار', 'RFQ engine')}
          </p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-normal text-[#24352f]">
            {pickLocalized(locale, 'اطلب عروض أسعار للبناء الجاهز من موردين مناسبين.', 'Request prefab quotes from suitable suppliers.')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#59645e]">
            {pickLocalized(
              locale,
              'مهاد يرتب تفاصيل مشروعك قبل التواصل مع الموردين، عشان تقارن العروض حسب النطاق الفعلي مو بس السعر.',
              'Mihad structures your project before supplier outreach so quotes can be compared by scope, not just headline price.'
            )}
          </p>
          <div className="mt-6 rounded-[8px] border border-[#d8cfba] bg-[#f5f1e7] p-4 text-sm leading-6 text-[#59645e]">
            {pickLocalized(
              locale,
              'مهاد ليس مقاولًا ولا جهة تصاريح. نساعدك تكتشف وتقارن وتطلب عروض من موردي البناء الجاهز بحدود نطاق واضحة.',
              'Mihad is not a contractor or permit issuer. We help buyers discover, compare, and request quotes from prefab suppliers with clear scope boundaries.'
            )}
          </div>
        </section>
            <RequestQuoteForm
              initialProjectType={resolvedSearchParams.project_type}
              initialModel={resolvedSearchParams.model}
              initialSupplier={resolvedSearchParams.supplier}
            />
      </main>
    </PublicPageShell>
  );
}
