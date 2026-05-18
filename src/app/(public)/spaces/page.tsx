import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getLocale } from 'next-intl/server';
import { DigestSectionHeading, DigestShell } from '@/components/private-digest/DigestShell';
import { findSpace, localizedValue, localize, publicSpaces } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Spaces — Mihad',
  description: 'Selected villas, majlis rooms, courtyards, and interiors in a contemporary Saudi mood.',
  alternates: { canonical: absoluteUrl('/spaces') },
};

export default async function SpacesPage() {
  const locale = await getLocale();
  const spaces = publicSpaces();
  const previewSpace = findSpace('editorial-format-preview');
  const visibleSpaces = spaces.length ? spaces : previewSpace ? [previewSpace] : [];

  return (
    <DigestShell>
      <main>
        <section className="border-b border-[#D8DEE8] bg-[#EEF2F6] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <DigestSectionHeading
              eyebrow={localize(locale, 'المختارات', 'The Edit')}
              title={localize(locale, 'فلل، أفنية، ومجالس بنبرة سعودية معاصرة.', 'Villas, courtyards, and majlis rooms in a Saudi modern tone.')}
              body={localize(
                locale,
                'لقطات قليلة الكلام عن الضوء، الخصوصية، المادة، والوقار الهادئ.',
                'Spare visual notes on light, privacy, material, and quiet poise.'
              )}
            />
            <div className="relative hidden aspect-[16/9] overflow-hidden rounded-[8px] border border-[#D8DEE8] bg-white lg:block">
              <Image src="/onboarding/budget.jpg" alt="" fill className="object-cover" sizes="50vw" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {visibleSpaces.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {visibleSpaces.map((space) => (
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{localize(locale, 'قريبًا', 'Soon')}</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#101827]">{localize(locale, 'مختارات جديدة قيد التحضير.', 'New selections are being prepared.')}</h2>
            </div>
          )}
        </section>
      </main>
    </DigestShell>
  );
}
