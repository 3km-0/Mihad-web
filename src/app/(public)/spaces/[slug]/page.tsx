import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { SpaceOfferForm } from '@/components/private-digest/PrivateDigestForms';
import { DigestShell } from '@/components/private-digest/DigestShell';
import { findSpace, localizedValue, localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const space = findSpace(slug);
  if (!space) return {};

  return {
    title: `${space.title.en} — Mihad`,
    description: 'A quiet editorial page for architecture, interiors, light, materials, and craft.',
    alternates: { canonical: absoluteUrl(`/spaces/${slug}`) },
    robots: space.visibility === 'private_link' ? { index: false, follow: false } : undefined,
  };
}

export default async function SpacePage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const space = findSpace(slug);
  if (!space) notFound();

  return (
    <DigestShell>
      <main>
        <section className="border-b border-[#D8DEE8] bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div className="relative min-h-[420px] overflow-hidden rounded-[8px] border border-[#D8DEE8] bg-[#F8FAFC]">
              <Image src={space.heroImage} alt="" fill priority className="object-cover" sizes="(min-width: 1024px) 58vw, 100vw" />
            </div>
            <div className="flex flex-col justify-end py-2">
              {space.status === 'editorial_preview' ? (
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">
                  {localize(locale, 'معاينة تنسيق', 'Format preview')}
                </p>
              ) : null}
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#667085]">{localizedValue(locale, space.locationHint)}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#101827] md:text-5xl">{localizedValue(locale, space.title)}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#334155]">{localizedValue(locale, space.typology)}</p>
              <SpaceOfferForm locale={locale} spaceSlug={space.slug} />
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <article>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{localize(locale, 'قراءة', 'Reading')}</p>
            <p className="mt-4 text-lg leading-9 text-[#334155]">{localizedValue(locale, space.story)}</p>
          </article>
          <aside className="rounded-[8px] border border-[#D8DEE8] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{localize(locale, 'ملاحظات التصميم', 'Design notes')}</p>
            <div className="mt-4 grid gap-3">
              {space.designNotes.map((item) => (
                <div key={item.label.en} className="flex items-center justify-between gap-4 border-b border-[#EEF2F6] pb-3 text-sm">
                  <span className="text-[#667085]">{localizedValue(locale, item.label)}</span>
                  <span className="font-semibold text-[#101827]">{localizedValue(locale, item.value)}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="border-y border-[#D8DEE8] bg-[#F8FAFC] py-14">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {space.highlights.map((highlight) => (
              <div key={highlight.en} className="rounded-[8px] border border-[#D8DEE8] bg-white p-5 text-sm leading-7 text-[#334155]">
                {localizedValue(locale, highlight)}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-[8px] border border-[#D8DEE8] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{localize(locale, 'هوامش تحريرية', 'Editorial notes')}</p>
            <div className="mt-4 grid gap-3">
              {space.editorialNotes.map((note) => (
                <p key={note.en} className="rounded-[8px] bg-[#F8FAFC] p-4 text-sm leading-7 text-[#334155]">{localizedValue(locale, note)}</p>
              ))}
            </div>
          </div>
        </section>
      </main>
    </DigestShell>
  );
}
