import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FileText,
  Home,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { PREFAB_CATEGORIES, PREFAB_GUIDES, PREFAB_WHATSAPP_URL, type PrefabCategory } from '@/lib/prefab-content';
import {
  formatPriceRange,
  type PublicModel,
  type PublicSupplier,
  verificationLabel,
} from '@/lib/prefab-public-data';
import { cn } from '@/lib/utils';

export function PrefabNav() {
  const links = [
    ['Explore Prefab', '/categories/prefab-homes'],
    ['Suppliers', '/suppliers'],
    ['Models', '/models'],
    ['Guides', '/guides'],
    ['For Businesses', '/for-businesses'],
    ['For Manufacturers', '/for-manufacturers'],
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-[#d9d2c2] bg-[#fbfaf6]/92 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="font-serif text-3xl font-semibold tracking-normal text-[#24352f]">
          Mihad
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-[#59645e] lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-[#1f6b4f]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="inline-flex min-h-10 items-center rounded-[8px] px-2 text-xs font-semibold text-[#59645e] transition hover:bg-[#f5f1e7] hover:text-[#24352f] sm:px-3 sm:text-sm"
          >
            Sign in
          </Link>
          <Link
            href="/request-quote"
            className="inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#18543f]"
          >
            Get matched
          </Link>
          <Link
            href={PREFAB_WHATSAPP_URL}
            className="hidden min-h-10 items-center gap-2 rounded-[8px] border border-[#cfc5ad] px-3 text-sm font-semibold text-[#24352f] transition hover:border-[#1f6b4f] sm:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PrefabFooter() {
  return (
    <footer className="border-t border-[#ddd5c2] bg-[#f5f1e7]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-[#59645e] sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Link href="/home" className="font-serif text-3xl font-semibold text-[#24352f]">
            Mihad
          </Link>
          <p className="mt-3 max-w-xl leading-6">
            Mihad helps Saudi buyers understand prefab options, compare supplier scope, and request quotes based on land, budget, use case, and timeline.
          </p>
          <p className="mt-3 text-right text-[#6a746f]" dir="rtl">
            ميهاد يساعد المشترين في السعودية على فهم حلول البناء الجاهز وطلب عروض مناسبة للموقع والميزانية والاستخدام.
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#24352f]">Explore</p>
          <div className="mt-3 grid gap-2">
            <Link href="/models">Models</Link>
            <Link href="/suppliers">Suppliers</Link>
            <Link href="/guides">Guides</Link>
            <Link href="/request-quote">Request quote</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[#24352f]">Trust</p>
          <div className="mt-3 grid gap-2">
            <Link href="/about">About Mihad</Link>
            <Link href="/for-manufacturers">For manufacturers</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicPageShell({ children, nav = true }: { children: React.ReactNode; nav?: boolean }) {
  return (
    <div className="min-h-screen bg-[#fbfaf6] text-[#24352f]">
      {nav ? <PrefabNav /> : null}
      {children}
      <PrefabFooter />
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#d8cfba] bg-[#fbfaf6] text-[11px] font-semibold text-[#59645e] shadow-[0_-10px_30px_rgba(36,53,47,0.08)] sm:hidden">
        <Link href="/categories/prefab-homes" className="grid min-h-14 place-items-center">Explore</Link>
        <Link href="/suppliers" className="grid min-h-14 place-items-center">Suppliers</Link>
        <Link href="/request-quote" className="grid min-h-14 place-items-center text-[#1f6b4f]">Request</Link>
        <Link href="/auth/login" className="grid min-h-14 place-items-center">Sign in</Link>
      </div>
    </div>
  );
}

export function HeroRfqCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-[8px] border border-[#d8cfba] bg-white p-4 shadow-[0_18px_60px_rgba(36,53,47,0.12)]">
      <p className="text-sm font-semibold text-[#1f6b4f]">What are you looking to build?</p>
      <p className="mt-1 text-right text-sm text-[#6a746f]" dir="rtl">ما نوع المشروع الذي تريد بناءه؟</p>
      <div className={cn('mt-4 grid gap-3', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
        {['Home / Villa', 'Chalet / Cabin', 'Majlis', 'Modular office'].map((item) => (
          <Link
            key={item}
            href={`/request-quote?project_type=${encodeURIComponent(item.toLowerCase().replaceAll(' / ', '_').replaceAll(' ', '_'))}`}
            className="rounded-[8px] border border-[#e1dac9] bg-[#fbfaf6] px-3 py-3 text-sm font-medium transition hover:border-[#1f6b4f] hover:bg-[#f1f7f2]"
          >
            {item}
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[8px] border border-[#e1dac9] bg-[#fbfaf6] px-3 py-3 text-sm text-[#59645e]">City / delivery location</div>
        <div className="rounded-[8px] border border-[#e1dac9] bg-[#fbfaf6] px-3 py-3 text-sm text-[#59645e]">Budget range</div>
      </div>
      <Link
        href="/request-quote"
        className="mt-4 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#18543f]"
      >
        Get supplier recommendations
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function CategoryCard({ category }: { category: PrefabCategory }) {
  return (
    <Link href={`/categories/${category.slug}`} className="group overflow-hidden rounded-[8px] border border-[#ddd5c2] bg-white transition hover:-translate-y-0.5 hover:border-[#1f6b4f] hover:shadow-[0_18px_50px_rgba(36,53,47,0.11)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image src={category.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 25vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-[6px] bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#24352f]">{category.shortTitle}</span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{category.shortTitle}</h3>
        <p className="mt-1 text-right text-sm text-[#6a746f]" dir="rtl">{category.titleAr}</p>
        <p className="mt-2 text-sm leading-6 text-[#59645e]">{category.description}</p>
      </div>
    </Link>
  );
}

export function SupplierCard({ supplier }: { supplier: PublicSupplier }) {
  return (
    <article className="rounded-[8px] border border-[#ddd5c2] bg-white p-5 shadow-[0_12px_35px_rgba(36,53,47,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#eef6ef] px-2 py-1 text-xs font-semibold text-[#1f6b4f]">
            <BadgeCheck className="h-3.5 w-3.5" />
            {verificationLabel(supplier.verificationState)}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-[#24352f]">{supplier.name}</h3>
          <p className="mt-1 text-sm text-[#59645e]">{supplier.city} · {supplier.regionsServed.slice(0, 3).join(', ') || 'Saudi delivery'}</p>
        </div>
        <Factory className="h-8 w-8 text-[#b88a3b]" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {supplier.categories.slice(0, 4).map((category) => (
          <span key={category} className="rounded-[6px] border border-[#e1dac9] px-2 py-1 text-xs text-[#59645e]">{category.replaceAll('_', ' ')}</span>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[#59645e] sm:grid-cols-3">
        <span>{supplier.modelCount} models</span>
        <span>{supplier.responseSlaMinutes ? `${Math.round(supplier.responseSlaMinutes / 60)}h SLA` : 'SLA pending'}</span>
        <span>{Object.keys(supplier.warranty).length ? 'Warranty info' : 'Warranty pending'}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/suppliers/${supplier.slug}`} className="inline-flex min-h-10 items-center rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold transition hover:border-[#1f6b4f]">View profile</Link>
        <Link href={`/request-quote?supplier=${supplier.id}`} className="inline-flex min-h-10 items-center rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#18543f]">Request quote</Link>
      </div>
    </article>
  );
}

export function ModelCard({ model }: { model: PublicModel }) {
  return (
    <article className="overflow-hidden rounded-[8px] border border-[#ddd5c2] bg-white shadow-[0_12px_35px_rgba(36,53,47,0.06)]">
      <div className="relative aspect-[4/3]">
        <Image src="/onboarding/workspace.jpg" alt="" fill className="object-cover" sizes="(min-width: 1024px) 25vw, 50vw" />
        <span className="absolute left-3 top-3 rounded-[6px] bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#1f6b4f]">
          {model.supplier ? verificationLabel(model.supplier.verificationState) : 'Supplier profile'}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7650]">{model.modelType?.replaceAll('_', ' ') || 'Prefab model'}</p>
        <h3 className="mt-2 text-xl font-semibold text-[#24352f]">{model.name}</h3>
        <p className="mt-2 text-sm text-[#59645e]">{model.materialSummary || 'Scope and pricing depend on supplier review.'}</p>
        <div className="mt-4 grid gap-2 text-sm text-[#59645e]">
          <span>{model.sizeSqm ? `${model.sizeSqm} sqm` : 'Size depends on configuration'} · {model.bedrooms ?? '-'} bedrooms</span>
          <span>{formatPriceRange(model.priceRange)}</span>
          <span>Supplier: {model.supplier?.name || 'Mihad supplier network'}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/request-quote?model=${model.id}`} className="inline-flex min-h-10 items-center rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#18543f]">Request quote</Link>
          <Link href={`/models/${model.slug}`} className="inline-flex min-h-10 items-center rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold transition hover:border-[#1f6b4f]">View details</Link>
        </div>
      </div>
    </article>
  );
}

export function GuideCard({ guide }: { guide: (typeof PREFAB_GUIDES)[number] }) {
  return (
    <Link href={`/guides/${guide.slug}`} className="block rounded-[8px] border border-[#ddd5c2] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#1f6b4f] hover:shadow-[0_18px_50px_rgba(36,53,47,0.1)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7650]">{guide.category} · {guide.readMinutes} min</p>
      <h3 className="mt-3 text-xl font-semibold text-[#24352f]">{guide.title}</h3>
      <p className="mt-2 text-right text-sm text-[#6a746f]" dir="rtl">{guide.titleAr}</p>
      <p className="mt-3 text-sm leading-6 text-[#59645e]">{guide.description}</p>
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, titleAr, body }: { eyebrow?: string; title: string; titleAr?: string; body?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7650]">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#24352f] md:text-4xl">{title}</h2>
      {titleAr ? <p className="mt-2 text-xl font-semibold text-[#1f6b4f]" dir="rtl">{titleAr}</p> : null}
      {body ? <p className="mt-3 text-base leading-7 text-[#59645e]">{body}</p> : null}
    </div>
  );
}

export function TrustGrid() {
  const items = [
    ['Who can I trust?', 'Verified supplier profiles, project photos, documentation checklist.', ShieldCheck],
    ['What does price include?', 'Compare transport, foundations, utilities, installation, and customization.', ClipboardCheck],
    ['Will it work on my land?', 'Check location, access, utilities, project readiness, and missing facts.', Home],
    ['Who handles what?', 'Separate manufacturer scope, buyer scope, and third-party scope.', Building2],
  ] as const;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {items.map(([title, body, Icon]) => (
        <div key={title} className="rounded-[8px] border border-[#ddd5c2] bg-white p-5">
          <Icon className="h-7 w-7 text-[#1f6b4f]" />
          <h3 className="mt-4 font-semibold text-[#24352f]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#59645e]">{body}</p>
        </div>
      ))}
    </div>
  );
}

export function ReadinessChecklist() {
  const items = ['Do you own land?', 'Do you know the city or location?', 'Do you have an approximate budget?', 'Do you know the intended use?', 'Do you need transport, foundation, utilities, or permit guidance?', 'Do you have site photos or sketches?'];
  return (
    <div className="rounded-[8px] border border-[#d8cfba] bg-[#24352f] p-6 text-white md:p-8">
      <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d3b36b]">Buyer readiness</p>
          <h2 className="mt-2 text-3xl font-semibold">Are you ready to request quotes?</h2>
          <p className="mt-2 text-right text-lg text-[#d7e2dc]" dir="rtl">هل مشروعك جاهز لطلب عروض الأسعار؟</p>
          <Link href="/request-quote" className="mt-5 inline-flex min-h-11 items-center rounded-[8px] bg-white px-4 text-sm font-semibold text-[#24352f]">Check project readiness</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex gap-2 rounded-[8px] border border-white/12 bg-white/6 p-3 text-sm text-[#eef5f1]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d3b36b]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmptyDataNotice({ kind }: { kind: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[#cfc5ad] bg-white p-8 text-center">
      <FileText className="mx-auto h-8 w-8 text-[#8a7650]" />
      <h2 className="mt-3 text-xl font-semibold">No {kind} are published yet.</h2>
      <p className="mt-2 text-sm text-[#59645e]">Mihad is ready for seeded supplier data; add active records and this page will populate automatically.</p>
    </div>
  );
}

export { PREFAB_CATEGORIES, PREFAB_GUIDES, PREFAB_WHATSAPP_URL };
