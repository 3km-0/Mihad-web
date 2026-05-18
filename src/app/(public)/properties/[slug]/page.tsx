import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { DigestShell } from '@/components/private-digest/DigestShell';
import { findProperty, localizedValue, localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = findProperty(slug);
  if (!property) return {};

  return {
    title: `${property.title.en} — Mihad`,
    description: 'Private editorial property page with limited details and confidential interest screening.',
    alternates: { canonical: absoluteUrl(`/properties/${slug}`) },
    robots: property.visibility === 'private_link' ? { index: false, follow: false } : undefined,
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const property = findProperty(slug);
  if (!property) notFound();

  return (
    <DigestShell>
      <main>
        <section className="relative min-h-[72svh] overflow-hidden border-b border-[#ded6c7]">
          <Image src={property.heroImage} alt="" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(30,26,20,0.82),rgba(30,26,20,0.44),rgba(30,26,20,0.08))]" />
          <div className="relative mx-auto flex min-h-[72svh] max-w-7xl items-end px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-3xl text-white">
              {property.status === 'editorial_preview' ? (
                <p className="inline-flex rounded-[999px] border border-white/25 bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f2dfb8]">
                  {localize(locale, 'معاينة تنسيق - ليس عقارًا متاحًا', 'Format preview - not an available property')}
                </p>
              ) : null}
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#f2dfb8]">{localizedValue(locale, property.cityArea)}</p>
              <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight md:text-7xl">{localizedValue(locale, property.title)}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">{localizedValue(locale, property.propertyType)}</p>
              <Link href={`/private-interest?property=${property.slug}`} className="mt-8 inline-flex min-h-12 items-center rounded-[8px] bg-white px-5 text-sm font-semibold text-[#1e1a14]">
                {localize(locale, 'إرسال اهتمام خاص', 'Submit Private Interest')}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <article>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8c6f45]">{localize(locale, 'القصة', 'Story')}</p>
            <p className="mt-4 text-xl leading-10 text-[#3f3629]">{localizedValue(locale, property.story)}</p>
          </article>
          <aside className="rounded-[8px] border border-[#ded6c7] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8c6f45]">{localize(locale, 'تفاصيل محدودة', 'Limited details')}</p>
            <div className="mt-4 grid gap-3">
              {property.featureSummary.map((item) => (
                <div key={item.label.en} className="flex items-center justify-between gap-4 border-b border-[#efe6d7] pb-3 text-sm">
                  <span className="text-[#625746]">{localizedValue(locale, item.label)}</span>
                  <span className="font-semibold text-[#1e1a14]">{localizedValue(locale, item.value)}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="bg-[#efe6d7] py-16">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {property.highlights.map((highlight) => (
              <div key={highlight.en} className="rounded-[8px] border border-[#ded6c7] bg-[#f7f2e8] p-5 text-sm leading-7 text-[#4f4638]">
                {localizedValue(locale, highlight)}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[8px] border border-[#ded6c7] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8c6f45]">{localize(locale, 'طبقة الخصوصية', 'Privacy layer')}</p>
            <div className="mt-4 grid gap-3">
              {property.privacyNotes.map((note) => (
                <p key={note.en} className="rounded-[8px] bg-[#f7f2e8] p-4 text-sm leading-7 text-[#625746]">{localizedValue(locale, note)}</p>
              ))}
            </div>
          </div>
        </section>
      </main>
    </DigestShell>
  );
}
