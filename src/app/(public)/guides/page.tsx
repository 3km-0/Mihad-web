import type { Metadata } from 'next';
import { GuideCard, PREFAB_GUIDES, PublicPageShell, SectionHeading } from '@/components/prefab/PrefabMarketing';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Prefab buying guides — Mihad',
  description: 'Saudi prefab buying guides for cost, land readiness, supplier trust, foundations, utilities, and quote comparison.',
  alternates: { canonical: absoluteUrl('/guides') },
};

export default function GuidesIndexPage() {
  const groups = ['Cost and comparison', 'Land readiness', 'Supplier trust'];
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Guides" title="Learn before you buy" titleAr="افهم الخيارات قبل أن تشتري" body="Plain-language guides for Saudi buyers comparing prefab suppliers, scope, and project readiness." />
        <div className="mt-10 grid gap-8">
          {groups.map((group) => (
            <section key={group}>
              <h2 className="text-2xl font-semibold">{group}</h2>
              <div className="mt-4 grid gap-5 md:grid-cols-3">
                {PREFAB_GUIDES.filter((guide) => guide.category === group).map((guide) => <GuideCard key={guide.slug} guide={guide} />)}
              </div>
            </section>
          ))}
        </div>
      </main>
    </PublicPageShell>
  );
}
