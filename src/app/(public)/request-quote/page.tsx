import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { RequestQuoteForm } from '@/components/prefab/RequestQuoteForm';
import { PublicPageShell } from '@/components/prefab/PrefabMarketing';
import { pickLocalized } from '@/lib/prefab-copy';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Start an activation request — Mihad',
  description: 'Submit tenant demand, land supply, or modular supplier details so Mihad can assess site activation fit before outreach.',
  alternates: { canonical: absoluteUrl('/request-quote') },
};

export default async function RequestQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string; project_type?: string; model?: string; supplier?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const locale = await getLocale();

  return (
    <PublicPageShell>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <section className="pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7650]">
            {pickLocalized(locale, 'طلب تفعيل', 'Activation request')}
          </p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-normal text-[#24352f]">
            {pickLocalized(locale, 'ابدأ بطلب واضح: مستأجر، أرض، أو مورد مباني جاهزة.', 'Start with the right path: tenant demand, land supply, or modular supplier.')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#59645e]">
            {pickLocalized(
              locale,
              'مهاد يجمع الطلب الحقيقي، يفحص ملاءمة الأرض والوحدة الجاهزة، ويقدّر المسار الأنسب: ترتيب صفقة، إدارة، أو تشغيل انتقائي بشروط واضحة.',
              'Mihad captures real demand, checks land and modular fit, and routes the opportunity toward brokerage, management, or selective operator underwriting.'
            )}
          </p>
          <div className="mt-6 rounded-[8px] border border-[#d8cfba] bg-[#f5f1e7] p-4 text-sm leading-6 text-[#59645e]">
            {pickLocalized(
              locale,
              'التشغيل لا يبدأ إلا بوجود طلب مؤكد، حقوق قانونية واضحة، ومسار احتياطي كاف. الطلبات العامة تبقى في مسار الوساطة والإدارة.',
              'Operator risk is only considered with confirmed demand, explicit legal rights, and adequate reserves. Most requests stay in the broker/manager lane.'
            )}
          </div>
        </section>
            <RequestQuoteForm
              initialAudience={resolvedSearchParams.audience}
              initialProjectType={resolvedSearchParams.project_type}
              initialModel={resolvedSearchParams.model}
              initialSupplier={resolvedSearchParams.supplier}
            />
      </main>
    </PublicPageShell>
  );
}
