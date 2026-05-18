import type { Metadata } from 'next';
import { PublicPageShell, SectionHeading } from '@/components/prefab/PrefabMarketing';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About Mihad — Mihad',
  description: 'How Mihad helps people understand prefab projects through articles, calculators, supplier profiles, and optional site support.',
  alternates: { canonical: absoluteUrl('/about') },
};

export default function AboutPage() {
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Trust" title="What Mihad is, and what it is not" titleAr="ما هو مهاد وما حدوده" />
        <div className="mt-10 grid gap-5">
          {[
            ['What Mihad is', 'A Saudi-first prefab Fieldbook and calculator that helps people understand modular projects before supplier or site outreach.'],
            ['What Mihad is not', 'Mihad is not a contractor, not a government permit issuer, and not a guarantee of approval, pricing, delivery, or tenant performance.'],
            ['How site help works', 'If a calculator brief needs land, supplier matching, or saved workspace support, Mihad opens that path after the user asks for it.'],
            ['How supplier review works', 'Profiles can show identity, unit types, factory capacity, lease/sale terms, service regions, warranty information, and response expectations submitted for review.'],
            ['Sponsored content', 'Fieldbook and sponsored content should be clearly labeled so education and commercial routing remain trustworthy.'],
          ].map(([title, body]) => (
            <section key={title} className="rounded-[8px] border border-[#d8cfba] bg-white p-6">
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="mt-3 leading-8 text-[#59645e]">{body}</p>
            </section>
          ))}
        </div>
      </main>
    </PublicPageShell>
  );
}
