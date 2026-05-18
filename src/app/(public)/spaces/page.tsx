import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getLocale } from 'next-intl/server';
import { DigestSectionHeading, DigestShell } from '@/components/private-digest/DigestShell';
import { localizedValue, localize, publicSpaces } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Spaces — Mihad',
  description: 'A quiet architecture and interiors digest for selected spaces, materials, light, and craft.',
  alternates: { canonical: absoluteUrl('/spaces') },
};

export default async function SpacesPage() {
  const locale = await getLocale();
  const spaces = publicSpaces();

  return (
    <DigestShell>
      <main>
        <section className="border-b border-[#D8DEE8] bg-[#EEF2F6] px-4 py-14 sm:px-6 lg:px-8">
          <DigestSectionHeading
            eyebrow={localize(locale, 'المساحات', 'Spaces')}
            title={localize(locale, 'اختيارات هادئة في العمارة الداخلية.', 'Quiet selections in interior architecture.')}
            body={localize(
              locale,
              'مجموعة محدودة تقرأ الضوء، المادة، النسب، والتفاصيل بدون ضجيج.',
              'A limited set reading light, material, proportion, and detail without noise.'
            )}
          />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {spaces.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {spaces.map((space) => (
                <Link key={space.slug} href={`/spaces/${space.slug}`} className="group overflow-hidden rounded-[8px] border border-[#D8DEE8] bg-white transition hover:border-[#C8D2E0]">
                  <div className="relative aspect-[4/3] bg-[#F8FAFC]">
                    <Image src={space.heroImage} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.02]" sizes="(min-width: 1024px) 33vw, 100vw" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{localizedValue(locale, space.locationHint)}</p>
                    <h2 className="mt-3 text-xl font-semibold text-[#101827]">{localizedValue(locale, space.title)}</h2>
                    <p className="mt-2 text-sm leading-7 text-[#334155]">{localizedValue(locale, space.typology)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl rounded-[8px] border border-dashed border-[#C8D2E0] bg-white p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{localize(locale, 'قيد التحرير', 'In edit')}</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#101827]">{localize(locale, 'لم تُنشر مساحة حقيقية بعد.', 'No real space is published yet.')}</h2>
              <p className="mt-3 leading-8 text-[#334155]">
                {localize(
                  locale,
                  'هذا مقصود. يبدأ مهاد بمراجعة الشكل التحريري قبل إضافة أي مساحة حقيقية.',
                  'This is intentional. Mihad starts by reviewing the editorial format before adding any real space.'
                )}
              </p>
              <Link href="/spaces/editorial-format-preview" className="mt-6 inline-flex min-h-11 items-center rounded-[6px] bg-[#23395D] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4E89]">
                {localize(locale, 'مشاهدة معاينة التنسيق', 'View format preview')}
              </Link>
            </div>
          )}
        </section>
      </main>
    </DigestShell>
  );
}
