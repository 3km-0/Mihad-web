import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { RequestQuoteForm } from '@/components/prefab/RequestQuoteForm';
import { PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { pickLocalized } from '@/lib/prefab-copy';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Save prefab project brief — Mihad',
  description: 'Save a prefab calculator brief when you are ready to compare suppliers, request site help, or open a workspace.',
  alternates: { canonical: absoluteUrl('/request-quote') },
};

export default async function RequestQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string; project_type?: string; model?: string; supplier?: string; city?: string; size_sqm?: string; land_status?: string; use_case?: string; budget_max?: string; notes?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const locale = await getLocale();

  return (
    <PublicPageShell>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <section className="pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7650]">
            {pickLocalized(locale, 'موجز مشروع', 'Project brief')}
          </p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-normal text-[#24352f]">
            {pickLocalized(locale, 'احفظ نتيجة الحاسبة عندما تكون جاهزًا للخطوة التالية.', 'Save the calculator result when you are ready for the next step.')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#59645e]">
            {pickLocalized(
              locale,
              'هذه الصفحة تحول التقدير الأولي إلى موجز مشروع محفوظ. بعدها يمكن مقارنة الموردين أو طلب مساعدة في الموقع عند الحاجة.',
              'This page turns an early estimate into a saved project brief. After that, you can compare suppliers or ask for site help when needed.'
            )}
          </p>
          <div className="mt-6 rounded-[8px] border border-[#d8cfba] bg-[#f5f1e7] p-4 text-sm leading-6 text-[#59645e]">
            {pickLocalized(
              locale,
              'لن يتم التواصل مع أي مورد أو مالك أرض قبل موافقتك. التقديرات تبقى نطاقات تخطيطية حتى تصل عروض فعلية.',
              'No supplier or landowner is contacted before your approval. Estimates remain planning ranges until real quotes arrive.'
            )}
          </div>
        </section>
            <RequestQuoteForm
              initialAudience={resolvedSearchParams.audience}
              initialProjectType={resolvedSearchParams.project_type}
              initialModel={resolvedSearchParams.model}
              initialSupplier={resolvedSearchParams.supplier}
              initialCity={resolvedSearchParams.city}
              initialSize={resolvedSearchParams.size_sqm}
              initialLandStatus={resolvedSearchParams.land_status}
              initialUseCase={resolvedSearchParams.use_case}
              initialBudgetMax={resolvedSearchParams.budget_max}
              initialNotes={resolvedSearchParams.notes}
            />
      </main>
    </PublicPageShell>
  );
}
