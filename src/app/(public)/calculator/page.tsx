import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { PrefabCalculator } from '@/components/prefab/PrefabCalculator';
import { PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { pickLocalized } from '@/lib/prefab-copy';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Prefab AI Calculator — Mihad',
  description: 'Estimate prefab project cost, installation, site readiness, timeline, and next steps before supplier or land outreach.',
  alternates: { canonical: absoluteUrl('/calculator') },
};

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ model?: string; supplier?: string; category?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;

  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4E89]">
            {pickLocalized(locale, 'حاسبة المباني الجاهزة', 'Prefab AI Calculator')}
          </p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-normal text-[#101827]">
            {pickLocalized(locale, 'احسب مشروعك الجاهز قبل ما تطلب عرض سعر', 'Estimate your prefab project before requesting quotes')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#334155]">
            {pickLocalized(
              locale,
              'ابدأ بتقدير عملي للتكلفة، التركيب، جاهزية الموقع، والمدة. إذا احتجت أرض أو مقارنة موردين، مهاد يفتح المسار المناسب بعد ذلك.',
              'Start with a practical estimate for cost, installation, site readiness, and timeline. If you need land or supplier comparison, Mihad opens the right path after that.'
            )}
          </p>
        </section>
        <div className="mt-10">
          <PrefabCalculator preset={{ model: params.model, supplier: params.supplier, category: params.category }} />
        </div>
      </main>
    </PublicPageShell>
  );
}
