import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getLocale } from 'next-intl/server';
import { DigestSectionHeading, DigestShell } from '@/components/private-digest/DigestShell';
import { localizedValue, localize, publicProperties } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Private Digest — Mihad',
  description: 'A curated private digest for exceptional Saudi homes, with no public prices or direct owner contact.',
  alternates: { canonical: absoluteUrl('/properties') },
};

export default async function PropertiesPage() {
  const locale = await getLocale();
  const properties = publicProperties();

  return (
    <DigestShell>
      <main>
        <section className="border-b border-[#ded6c7] bg-[#f7f2e8] px-4 py-16 sm:px-6 lg:px-8">
          <DigestSectionHeading
            eyebrow={localize(locale, 'المجموعة الخاصة', 'Private Digest')}
            title={localize(locale, 'مساحة منتقاة، وليست بوابة مزدحمة', 'A curated room, not a crowded portal')}
            body={localize(
              locale,
              'تظهر هنا المنازل التي وافق أصحابها على عرض هادئ. لا أسعار عامة، لا عناوين دقيقة، ولا تواصل مباشر مع المالك.',
              'Homes appear here only after owner-approved quiet presentation. No public prices, no exact addresses, and no direct owner contact.'
            )}
          />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {properties.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {properties.map((property) => (
                <Link key={property.slug} href={`/properties/${property.slug}`} className="group overflow-hidden rounded-[8px] border border-[#ded6c7] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(30,26,20,0.11)]">
                  <div className="relative aspect-[4/3]">
                    <Image src={property.heroImage} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 33vw, 100vw" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6f45]">{localizedValue(locale, property.cityArea)}</p>
                    <h2 className="mt-3 font-serif text-2xl font-semibold">{localizedValue(locale, property.title)}</h2>
                    <p className="mt-2 text-sm leading-7 text-[#625746]">{localizedValue(locale, property.propertyType)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl rounded-[8px] border border-dashed border-[#c9bda8] bg-white p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6f45]">{localize(locale, 'قبل النشر', 'Before publication')}</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-[#1e1a14]">{localize(locale, 'لم ننشر أي منزل حقيقي بعد.', 'No real homes are published yet.')}</h2>
              <p className="mt-3 leading-8 text-[#625746]">
                {localize(
                  locale,
                  'هذا مقصود. مهاد يبدأ فقط عندما يوافق مالك منزل استثنائي على عرض خاص يحمي السعر والعنوان والهوية.',
                  'This is intentional. Mihad starts only when an exceptional homeowner approves a private presentation that protects price, address, and identity.'
                )}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/submit-property" className="inline-flex min-h-11 items-center rounded-[8px] bg-[#1e1a14] px-4 text-sm font-semibold text-white">
                  {localize(locale, 'تقديم منزل للمراجعة', 'Submit a Property for Review')}
                </Link>
                <Link href="/properties/editorial-format-preview" className="inline-flex min-h-11 items-center rounded-[8px] border border-[#c9bda8] px-4 text-sm font-semibold text-[#1e1a14]">
                  {localize(locale, 'مشاهدة تنسيق تجريبي', 'View Format Preview')}
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </DigestShell>
  );
}
