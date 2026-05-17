import type { Metadata } from 'next';
import { PublicPageShell, SectionHeading } from '@/components/prefab/PrefabMarketing';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About Mihad prefab — Mihad',
  description: 'How Mihad helps Saudi prefab buyers compare suppliers, understand scope, and submit structured RFQs.',
  alternates: { canonical: absoluteUrl('/about') },
};

export default function AboutPage() {
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Trust" title="What Mihad is, and what it is not" titleAr="ما هو ميهاد وما حدوده" />
        <div className="mt-10 grid gap-5">
          {[
            ['What Mihad is', 'A Saudi-first prefab buying guide and RFQ engine that helps buyers discover suppliers, compare scope, and request quotes.'],
            ['What Mihad is not', 'Mihad is not a contractor, not a government permit issuer, and not a guarantee of supplier performance, pricing, or delivery.'],
            ['How supplier review works', 'Profiles can show identity, factory capacity, categories, service regions, warranty information, and response expectations submitted for review.'],
            ['How RFQ matching works', 'Mihad structures buyer requests by city, land, budget, use case, timeline, and scope needs before supplier routing.'],
            ['Sponsored content', 'Showcase and sponsored content should be clearly labeled so buyer education remains trustworthy.'],
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
