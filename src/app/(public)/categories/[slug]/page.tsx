import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryCard, GuideCard, ModelCard, PublicPageShell, ReadinessChecklist, SupplierCard } from '@/components/prefab/PrefabMarketing';
import { getCategoryPage, PREFAB_CATEGORIES, PREFAB_GUIDES } from '@/lib/prefab-content';
import { listPublicModels, listPublicSuppliers } from '@/lib/prefab-public-data';
import { absoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryPage(slug);
  if (!category) return { title: 'Prefab category — Mihad' };
  return {
    title: `${category.title} — Mihad`,
    description: category.description,
    alternates: { canonical: absoluteUrl(`/categories/${category.slug}`) },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategoryPage(slug);
  if (!category) notFound();
  const [models, suppliers] = await Promise.all([
    listPublicModels({ category: category.slug }),
    listPublicSuppliers({ category: category.slug }),
  ]);

  return (
    <PublicPageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[8px] border border-[#d8cfba] bg-[#f5f1e7] p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7650]">Category</p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-normal">{category.title}</h1>
          <p className="mt-3 text-right text-2xl font-semibold text-[#1f6b4f]" dir="rtl">{category.titleAr}</p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#59645e]">{category.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/calculator?category=${category.slug}`} className="inline-flex min-h-11 items-center rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white">Estimate this category</Link>
            <Link href="/models" className="inline-flex min-h-11 items-center rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold">Browse models</Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-3xl font-semibold">Use cases</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {category.tags.map((tag) => <div key={tag} className="rounded-[8px] border border-[#d8cfba] bg-white p-4 text-sm font-semibold">{tag.replaceAll('_', ' ')}</div>)}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-3xl font-semibold">Popular models</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {models.length ? models.map((model) => <ModelCard key={model.id} model={model} />) : <p className="text-[#59645e]">No active models for this category yet.</p>}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-3xl font-semibold">Suppliers for this category</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {suppliers.length ? suppliers.map((supplier) => <SupplierCard key={supplier.id} supplier={supplier} />) : <p className="text-[#59645e]">No reviewed suppliers for this category yet.</p>}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[8px] border border-[#d8cfba] bg-white p-6">
            <h2 className="text-2xl font-semibold">Cost factors</h2>
            <div className="mt-4 grid gap-2">
              {category.costFactors.map((factor) => <div key={factor} className="rounded-[8px] bg-[#f5f1e7] p-3 text-sm text-[#59645e]">{factor}</div>)}
            </div>
          </div>
          <div className="rounded-[8px] border border-[#d8cfba] bg-white p-6">
            <h2 className="text-2xl font-semibold">Related guides</h2>
            <div className="mt-4 grid gap-3">
              {PREFAB_GUIDES.slice(0, 3).map((guide) => <Link key={guide.slug} href={`/guides/${guide.slug}`} className="rounded-[8px] bg-[#f5f1e7] p-3 text-sm font-semibold">{guide.title}</Link>)}
            </div>
          </div>
        </section>

        <section className="mt-10"><ReadinessChecklist /></section>

        <section className="mt-10">
          <h2 className="text-3xl font-semibold">Explore other categories</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PREFAB_CATEGORIES.filter((item) => item.slug !== category.slug).slice(0, 4).map((item) => <CategoryCard key={item.slug} category={item} />)}
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
