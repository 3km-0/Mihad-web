import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
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
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { prefabCopy, pickLocalized } from '@/lib/prefab-copy';
import { cn } from '@/lib/utils';

export async function PrefabNav() {
  const locale = await getLocale();
  const links = [
    [pickLocalized(locale, 'دليل مهاد', 'Fieldbook'), '/fieldbook'],
    [pickLocalized(locale, 'الحاسبة', 'Calculator'), '/calculator'],
    [pickLocalized(locale, prefabCopy.nav.suppliers.ar, prefabCopy.nav.suppliers.en), '/suppliers'],
    [pickLocalized(locale, prefabCopy.nav.models.ar, prefabCopy.nav.models.en), '/models'],
    [pickLocalized(locale, prefabCopy.nav.guides.ar, prefabCopy.nav.guides.en), '/guides'],
    [pickLocalized(locale, prefabCopy.nav.businesses.ar, prefabCopy.nav.businesses.en), '/for-businesses'],
    [pickLocalized(locale, prefabCopy.nav.manufacturers.ar, prefabCopy.nav.manufacturers.en), '/for-manufacturers'],
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-[#D8DEE8] bg-[#EEF2F6]/92 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="font-serif text-3xl font-semibold tracking-normal text-[#101827]">
          Mihad
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-[#334155] lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-[#1D4E89]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/auth/login"
            className="inline-flex min-h-10 items-center rounded-[8px] px-2 text-xs font-semibold text-[#334155] transition hover:bg-[#F8FAFC] hover:text-[#101827] sm:px-3 sm:text-sm"
          >
            {pickLocalized(locale, prefabCopy.nav.signIn.ar, prefabCopy.nav.signIn.en)}
          </Link>
          <Link
            href="/calculator"
            className="inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#23395D] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4E89]"
          >
            {pickLocalized(locale, prefabCopy.nav.getMatched.ar, prefabCopy.nav.getMatched.en)}
          </Link>
          <Link
            href={PREFAB_WHATSAPP_URL}
            className="hidden min-h-10 items-center gap-2 rounded-[8px] border border-[#C8D2E0] px-3 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89] sm:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            {pickLocalized(locale, prefabCopy.nav.whatsapp.ar, prefabCopy.nav.whatsapp.en)}
          </Link>
        </div>
      </div>
    </header>
  );
}

export async function PrefabFooter() {
  const locale = await getLocale();

  return (
    <footer className="border-t border-[#D8DEE8] bg-[#F8FAFC]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-[#334155] sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Link href="/home" className="font-serif text-3xl font-semibold text-[#101827]">
            Mihad
          </Link>
          <p className="mt-3 max-w-xl leading-6">
            {pickLocalized(
              locale,
              'مهاد يحوّل أفكار المباني الجاهزة إلى تقدير عملي، ثم يفتح مسار المورد أو الموقع فقط عندما يحتاجه المشروع.',
              'Mihad turns prefab ideas into practical planning ranges, then opens supplier or site help only when the project needs it.'
            )}
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#101827]">{pickLocalized(locale, 'استكشف', 'Explore')}</p>
          <div className="mt-3 grid gap-2">
            <Link href="/models">{pickLocalized(locale, 'النماذج', 'Models')}</Link>
            <Link href="/suppliers">{pickLocalized(locale, 'الموردون', 'Suppliers')}</Link>
            <Link href="/fieldbook">{pickLocalized(locale, 'دليل مهاد', 'Fieldbook')}</Link>
            <Link href="/guides">{pickLocalized(locale, 'الأدلة', 'Guides')}</Link>
            <Link href="/calculator">{pickLocalized(locale, 'احسب مشروعك الجاهز', 'Estimate your prefab project')}</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[#101827]">{pickLocalized(locale, 'الثقة', 'Trust')}</p>
          <div className="mt-3 grid gap-2">
            <Link href="/about">{pickLocalized(locale, 'عن مهاد', 'About Mihad')}</Link>
            <Link href="/for-manufacturers">{pickLocalized(locale, 'للمصنعين', 'For manufacturers')}</Link>
            <Link href="/privacy">{pickLocalized(locale, 'الخصوصية', 'Privacy')}</Link>
            <Link href="/terms">{pickLocalized(locale, 'الشروط', 'Terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export async function PublicPageShell({ children, nav = true }: { children: React.ReactNode; nav?: boolean }) {
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-[#EEF2F6] text-[#101827]">
      {nav ? <PrefabNav /> : null}
      {children}
      <PrefabFooter />
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#D8DEE8] bg-[#EEF2F6] text-[11px] font-semibold text-[#334155] shadow-[0_-10px_30px_rgba(16,24,39,0.08)] sm:hidden">
        <Link href="/fieldbook" className="grid min-h-14 place-items-center">{pickLocalized(locale, 'الدليل', 'Fieldbook')}</Link>
        <Link href="/suppliers" className="grid min-h-14 place-items-center">{pickLocalized(locale, prefabCopy.nav.suppliers.ar, prefabCopy.nav.suppliers.en)}</Link>
        <Link href="/calculator" className="grid min-h-14 place-items-center text-[#1D4E89]">{pickLocalized(locale, prefabCopy.nav.request.ar, prefabCopy.nav.request.en)}</Link>
        <Link href="/auth/login" className="grid min-h-14 place-items-center">{pickLocalized(locale, prefabCopy.nav.signIn.ar, prefabCopy.nav.signIn.en)}</Link>
      </div>
    </div>
  );
}

export function HeroRfqCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-[8px] border border-[#D8DEE8] bg-white p-4 shadow-[0_18px_60px_rgba(16,24,39,0.12)]">
      <p className="text-sm font-semibold text-[#1D4E89]">احسب الفكرة أولًا</p>
      <p className="mt-1 text-sm text-[#667085]">Start with cost, site readiness, and supplier fit before any deal workflow.</p>
      <div className={cn('mt-4 grid gap-3', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
        {[
          ['كشك أو مقهى جاهز', '/calculator?category=retail-kiosks'],
          ['مكتب موقع جاهز', '/calculator?category=modular-offices'],
          ['مجلس أو ملحق', '/calculator?category=majlis'],
          ['ساعدني أختار', '/calculator'],
        ].map(([item, href]) => (
          <Link
            key={item}
            href={href}
            className="rounded-[8px] border border-[#D8DEE8] bg-[#EEF2F6] px-3 py-3 text-sm font-medium transition hover:border-[#1D4E89] hover:bg-[#F8FAFC]"
          >
            {item}
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[8px] border border-[#D8DEE8] bg-[#EEF2F6] px-3 py-3 text-sm text-[#334155]">المدينة / الموقع</div>
        <div className="rounded-[8px] border border-[#D8DEE8] bg-[#EEF2F6] px-3 py-3 text-sm text-[#334155]">الإيجار / التكاليف</div>
      </div>
      <Link
        href="/calculator"
        className="mt-4 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-[8px] bg-[#23395D] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4E89]"
      >
        احسب مشروعك الجاهز
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function CategoryCard({ category }: { category: PrefabCategory }) {
  return (
    <Link href={`/categories/${category.slug}`} className="group overflow-hidden rounded-[8px] border border-[#D8DEE8] bg-white transition hover:-translate-y-0.5 hover:border-[#1D4E89] hover:shadow-[0_18px_50px_rgba(16,24,39,0.11)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image src={category.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 1024px) 25vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-[6px] bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#101827]">{category.shortTitle}</span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{category.titleAr}</h3>
        <p className="mt-1 text-sm text-[#667085]">{category.shortTitle}</p>
        <p className="mt-2 text-sm leading-6 text-[#334155]">{category.descriptionAr}</p>
      </div>
    </Link>
  );
}

export function SupplierCard({ supplier }: { supplier: PublicSupplier }) {
  return (
    <article className="rounded-[8px] border border-[#D8DEE8] bg-white p-5 shadow-[0_12px_35px_rgba(16,24,39,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#EEF2F6] px-2 py-1 text-xs font-semibold text-[#1D4E89]">
            <BadgeCheck className="h-3.5 w-3.5" />
            {verificationLabel(supplier.verificationState)}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-[#101827]">{supplier.name}</h3>
          <p className="mt-1 text-sm text-[#334155]">{supplier.city} · {supplier.regionsServed.slice(0, 3).join(', ') || 'Saudi delivery'}</p>
        </div>
        <Factory className="h-8 w-8 text-[#1D4E89]" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {supplier.categories.slice(0, 4).map((category) => (
          <span key={category} className="rounded-[6px] border border-[#D8DEE8] px-2 py-1 text-xs text-[#334155]">{category.replaceAll('_', ' ')}</span>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[#334155] sm:grid-cols-3">
        <span>{supplier.modelCount} نموذج</span>
        <span>{supplier.responseSlaMinutes ? `${Math.round(supplier.responseSlaMinutes / 60)} ساعة للرد` : 'زمن الرد غير مؤكد'}</span>
        <span>{Object.keys(supplier.warranty).length ? 'معلومات ضمان' : 'الضمان قيد المراجعة'}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/suppliers/${supplier.slug}`} className="inline-flex min-h-10 items-center rounded-[8px] border border-[#C8D2E0] px-4 text-sm font-semibold transition hover:border-[#1D4E89]">عرض الملف</Link>
        <Link href={`/calculator?supplier=${supplier.id}`} className="inline-flex min-h-10 items-center rounded-[8px] bg-[#23395D] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4E89]">احسب مشروعك</Link>
      </div>
    </article>
  );
}

export function ModelCard({ model }: { model: PublicModel }) {
  return (
    <article className="overflow-hidden rounded-[8px] border border-[#D8DEE8] bg-white shadow-[0_12px_35px_rgba(16,24,39,0.06)]">
      <div className="relative aspect-[4/3]">
        <Image src="/onboarding/workspace.jpg" alt="" fill className="object-cover" sizes="(min-width: 1024px) 25vw, 50vw" />
        <span className="absolute left-3 top-3 rounded-[6px] bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#1D4E89]">
          {model.supplier ? verificationLabel(model.supplier.verificationState) : 'ملف المورد'}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{model.modelType?.replaceAll('_', ' ') || 'Prefab model'}</p>
        <h3 className="mt-2 text-xl font-semibold text-[#101827]">{model.name}</h3>
        <p className="mt-2 text-sm text-[#334155]">{model.materialSummary || 'النطاق والسعر النهائي يعتمد على مراجعة المورد.'}</p>
        <div className="mt-4 grid gap-2 text-sm text-[#334155]">
          <span>{model.sizeSqm ? `${model.sizeSqm} م²` : 'المساحة حسب التكوين'} · {model.bedrooms ?? '-'} غرف</span>
          <span>{formatPriceRange(model.priceRange)}</span>
          <span>المورد: {model.supplier?.name || 'شبكة موردي مهاد'}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/calculator?model=${model.id}`} className="inline-flex min-h-10 items-center rounded-[8px] bg-[#23395D] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4E89]">احسب هذا النموذج</Link>
          <Link href={`/models/${model.slug}`} className="inline-flex min-h-10 items-center rounded-[8px] border border-[#C8D2E0] px-4 text-sm font-semibold transition hover:border-[#1D4E89]">عرض التفاصيل</Link>
        </div>
      </div>
    </article>
  );
}

export function GuideCard({ guide }: { guide: (typeof PREFAB_GUIDES)[number] }) {
  return (
    <Link href={`/guides/${guide.slug}`} className="block rounded-[8px] border border-[#D8DEE8] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#1D4E89] hover:shadow-[0_18px_50px_rgba(16,24,39,0.1)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{guide.category} · {guide.readMinutes} min</p>
      <h3 className="mt-3 text-xl font-semibold text-[#101827]">{guide.titleAr}</h3>
      <p className="mt-2 text-sm text-[#667085]">{guide.title}</p>
      <p className="mt-3 text-sm leading-6 text-[#334155]">{guide.description}</p>
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, titleAr, body }: { eyebrow?: string; title: string; titleAr?: string; body?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4E89]">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#101827] md:text-4xl">{title}</h2>
      {titleAr && titleAr !== title ? <p className="mt-2 text-xl font-semibold text-[#1D4E89]" dir="rtl">{titleAr}</p> : null}
      {body ? <p className="mt-3 text-base leading-7 text-[#334155]">{body}</p> : null}
    </div>
  );
}

export function TrustGrid() {
  const items = [
    ['هل الطلب حقيقي؟', 'نبدأ بالمستأجر والميزانية والمدة قبل تشغيل أي أصل.', ShieldCheck],
    ['هل الأرقام تغطي؟', 'نقارن إيجار المستأجر مع الأرض والوحدة والاحتياطي.', ClipboardCheck],
    ['هل الحقوق واضحة؟', 'التأجير من الباطن، التركيب، الإزالة، والتصاريح قبل التشغيل.', Home],
    ['مين مسؤول عن إيش؟', 'نفصل دور مالك الأرض، المورد، مهاد، والمستأجر.', Building2],
  ] as const;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {items.map(([title, body, Icon]) => (
        <div key={title} className="rounded-[8px] border border-[#D8DEE8] bg-white p-5">
          <Icon className="h-7 w-7 text-[#1D4E89]" />
          <h3 className="mt-4 font-semibold text-[#101827]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#334155]">{body}</p>
        </div>
      ))}
    </div>
  );
}

export function ReadinessChecklist() {
  const items = ['ما الاستخدام والمساحة التقريبية؟', 'هل الأرض موجودة أم تحتاج بحث لاحق؟', 'هل الخدمات والوصول واضحان؟', 'هل الميزانية قريبة من نطاق التخطيط؟', 'هل تفضل الإيجار أم الشراء؟', 'ما النواقص قبل طلب عرض سعر؟'];
  return (
    <div className="rounded-[8px] border border-[#30333A] bg-[#111827] p-6 text-white md:p-8">
      <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A6E3B8]">جاهزية المشروع</p>
          <h2 className="mt-2 text-3xl font-semibold">هل الفكرة جاهزة لعرض سعر؟</h2>
          <p className="mt-2 text-lg text-[#C9CCD1]">ابدأ بالحاسبة لتعرف التكلفة التقريبية والنواقص قبل مقارنة الموردين أو البحث عن موقع.</p>
          <Link href="/calculator" className="mt-5 inline-flex min-h-11 items-center rounded-[8px] bg-white px-4 text-sm font-semibold text-[#111827]">احسب مشروعك</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex gap-2 rounded-[8px] border border-white/[0.12] bg-white/[0.06] p-3 text-sm text-[#F3F4F6]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#A6E3B8]" />
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
    <div className="rounded-[8px] border border-dashed border-[#C8D2E0] bg-white p-8 text-center">
      <FileText className="mx-auto h-8 w-8 text-[#1D4E89]" />
      <h2 className="mt-3 text-xl font-semibold">لا توجد بيانات منشورة بعد.</h2>
      <p className="mt-2 text-sm text-[#334155]">مهاد جاهز لبيانات الموردين والنماذج. عند إضافة السجلات الفعالة ستظهر هنا تلقائيًا.</p>
    </div>
  );
}

export { PREFAB_CATEGORIES, PREFAB_GUIDES, PREFAB_WHATSAPP_URL };
