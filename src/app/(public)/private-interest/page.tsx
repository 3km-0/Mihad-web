import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { PrivateInterestForm } from '@/components/private-digest/PrivateDigestForms';
import { DigestShell } from '@/components/private-digest/DigestShell';
import { findProperty, localize, localizedValue } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Submit Private Interest — Mihad',
  description: 'Confidential buyer interest form for serious inquiries screened by Mihad before any owner approach.',
  alternates: { canonical: absoluteUrl('/private-interest') },
};

export default async function PrivateInterestPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const [locale, resolvedSearchParams] = await Promise.all([getLocale(), searchParams]);
  const property = resolvedSearchParams.property ? findProperty(resolvedSearchParams.property) : null;

  return (
    <DigestShell>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6f45]">{localize(locale, 'اهتمام خاص', 'Private interest')}</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-[#1e1a14]">
            {property
              ? localize(locale, 'أرسل اهتمامًا خاصًا بهذه الصفحة.', 'Submit confidential interest in this page.')
              : localize(locale, 'أرسل اهتمامك بالمنازل النادرة بهدوء.', 'Share interest in rare homes quietly.')}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#625746]">
            {localize(
              locale,
              'مهاد يفحص الهوية والنية والقدرة والوقت قبل أن يقترب من أي مالك. هذا الاهتمام غير ملزم ولا يعني أن المنزل معروض للبيع.',
              'Mihad screens identity, intent, ability, and timing before approaching any owner. This interest is non-binding and does not mean a home is actively for sale.'
            )}
          </p>
          {property ? (
            <div className="mt-6 rounded-[8px] border border-[#ded6c7] bg-white p-4 text-sm leading-7 text-[#625746]">
              {localize(locale, 'الصفحة المرتبطة:', 'Related page:')} <span className="font-semibold text-[#1e1a14]">{localizedValue(locale, property.title)}</span>
            </div>
          ) : null}
        </section>
        <PrivateInterestForm locale={locale} propertySlug={property?.slug || ''} />
      </main>
    </DigestShell>
  );
}
