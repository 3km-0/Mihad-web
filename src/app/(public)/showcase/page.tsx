import type { Metadata } from 'next';
import { PublicPageShell, SectionHeading } from '@/components/prefab/PrefabMarketing';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Prefab showcase — Mihad',
  description: 'Factory tours, supplier spotlights, model launches, project stories, and sponsored prefab education from Mihad.',
  alternates: { canonical: absoluteUrl('/showcase') },
};

export default function ShowcasePage() {
  const types = ['Factory tours', 'Supplier spotlights', 'Model launches', 'Completed project stories', 'Buyer education videos', 'Sponsored guides'];
  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Showcase" title="Mihad prefab showcase" titleAr="معرض ميهاد للبناء الجاهز" body="A media surface for supplier stories, model launches, factory tours, and clearly labeled sponsored content." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((type) => <div key={type} className="rounded-[8px] border border-[#d8cfba] bg-white p-6"><h2 className="text-xl font-semibold">{type}</h2><p className="mt-2 text-sm text-[#59645e]">Coming soon as Mihad onboards reviewed supplier content.</p></div>)}
        </div>
      </main>
    </PublicPageShell>
  );
}
