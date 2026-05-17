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
    [pickLocalized(locale, prefabCopy.nav.explore.ar, prefabCopy.nav.explore.en), '/categories/prefab-homes'],
    [pickLocalized(locale, prefabCopy.nav.suppliers.ar, prefabCopy.nav.suppliers.en), '/suppliers'],
    [pickLocalized(locale, prefabCopy.nav.models.ar, prefabCopy.nav.models.en), '/models'],
    [pickLocalized(locale, prefabCopy.nav.guides.ar, prefabCopy.nav.guides.en), '/guides'],
    [pickLocalized(locale, prefabCopy.nav.businesses.ar, prefabCopy.nav.businesses.en), '/for-businesses'],
    [pickLocalized(locale, prefabCopy.nav.manufacturers.ar, prefabCopy.nav.manufacturers.en), '/for-manufacturers'],
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
          <LanguageSwitcher />
          <Link
            href="/auth/login"
            className="inline-flex min-h-10 items-center rounded-[8px] px-2 text-xs font-semibold text-[#59645e] transition hover:bg-[#f5f1e7] hover:text-[#24352f] sm:px-3 sm:text-sm"
          >
            {pickLocalized(locale, prefabCopy.nav.signIn.ar, prefabCopy.nav.signIn.en)}
          </Link>
          <Link
            href="/request-quote"
            className="inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#18543f]"
          >
            {pickLocalized(locale, prefabCopy.nav.getMatched.ar, prefabCopy.nav.getMatched.en)}
          </Link>
          <Link
            href={PREFAB_WHATSAPP_URL}
            className="hidden min-h-10 items-center gap-2 rounded-[8px] border border-[#cfc5ad] px-3 text-sm font-semibold text-[#24352f] transition hover:border-[#1f6b4f] sm:inline-flex"
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
    <footer className="border-t border-[#ddd5c2] bg-[#f5f1e7]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-[#59645e] sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Link href="/home" className="font-serif text-3xl font-semibold text-[#24352f]">
            Mihad
          </Link>
          <p className="mt-3 max-w-xl leading-6">
            {pickLocalized(
              locale,
              'مهاد يساعد المشترين في السعودية على فهم حلول البناء الجاهز، مقارنة نطاق الموردين، وطلب عروض مناسبة حسب الأرض والميزانية والاستخدام.',
              'Mihad helps Saudi buyers understand prefab options, compare supplier scope, and request quotes based on land, budget, use case, and timeline.'
            )}
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#24352f]">{pickLocalized(locale, 'استكشف', 'Explore')}</p>
          <div className="mt-3 grid gap-2">
            <Link href="/models">{pickLocalized(locale, 'النماذج', 'Models')}</Link>
            <Link href="/suppliers">{pickLocalized(locale, 'الموردون', 'Suppliers')}</Link>
            <Link href="/guides">{pickLocalized(locale, 'الأدلة', 'Guides')}</Link>
            <Link href="/request-quote">{pickLocalized(locale, 'طلب عرض', 'Request quote')}</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[#24352f]">{pickLocalized(locale, 'الثقة', 'Trust')}</p>
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
    <div className="min-h-screen bg-[#fbfaf6] text-[#24352f]">
      {nav ? <PrefabNav /> : null}
      {children}
      <PrefabFooter />
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#d8cfba] bg-[#fbfaf6] text-[11px] font-semibold text-[#59645e] shadow-[0_-10px_30px_rgba(36,53,47,0.08)] sm:hidden">
        <Link href="/categories/prefab-homes" className="grid min-h-14 place-items-center">{pickLocalized(locale, 'استكشف', 'Explore')}</Link>
        <Link href="/suppliers" className="grid min-h-14 place-items-center">{pickLocalized(locale, prefabCopy.nav.suppliers.ar, prefabCopy.nav.suppliers.en)}</Link>
        <Link href="/request-quote" className="grid min-h-14 place-items-center text-[#1f6b4f]">{pickLocalized(locale, prefabCopy.nav.request.ar, prefabCopy.nav.request.en)}</Link>
        <Link href="/auth/login" className="grid min-h-14 place-items-center">{pickLocalized(locale, prefabCopy.nav.signIn.ar, prefabCopy.nav.signIn.en)}</Link>
      </div>
    </div>
  );
}

export function HeroRfqCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-[8px] border border-[#d8cfba] bg-white p-4 shadow-[0_18px_60px_rgba(36,53,47,0.12)]">
      <p className="text-sm font-semibold text-[#1f6b4f]">وش ناوي تبني؟</p>
      <p className="mt-1 text-sm text-[#6a746f]">What are you looking to build?</p>
      <div className={cn('mt-4 grid gap-3', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
        {[
          ['منزل / فيلا', 'villa'],
          ['شاليه / كابن', 'chalet'],
          ['مجلس', 'majlis'],
          ['مكتب جاهز', 'modular_office'],
        ].map(([item, value]) => (
          <Link
            key={item}
            href={`/request-quote?project_type=${encodeURIComponent(value)}`}
            className="rounded-[8px] border border-[#e1dac9] bg-[#fbfaf6] px-3 py-3 text-sm font-medium transition hover:border-[#1f6b4f] hover:bg-[#f1f7f2]"
          >
            {item}
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[8px] border border-[#e1dac9] bg-[#fbfaf6] px-3 py-3 text-sm text-[#59645e]">المدينة / موقع التسليم</div>
        <div className="rounded-[8px] border border-[#e1dac9] bg-[#fbfaf6] px-3 py-3 text-sm text-[#59645e]">نطاق الميزانية</div>
      </div>
      <Link
        href="/request-quote"
        className="mt-4 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#18543f]"
      >
        ابدأ طلبك
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
        <h3 className="text-lg font-semibold">{category.titleAr}</h3>
        <p className="mt-1 text-sm text-[#6a746f]">{category.shortTitle}</p>
        <p className="mt-2 text-sm leading-6 text-[#59645e]">{category.descriptionAr}</p>
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
        <span>{supplier.modelCount} نموذج</span>
        <span>{supplier.responseSlaMinutes ? `${Math.round(supplier.responseSlaMinutes / 60)} ساعة للرد` : 'زمن الرد غير مؤكد'}</span>
        <span>{Object.keys(supplier.warranty).length ? 'معلومات ضمان' : 'الضمان قيد المراجعة'}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/suppliers/${supplier.slug}`} className="inline-flex min-h-10 items-center rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold transition hover:border-[#1f6b4f]">عرض الملف</Link>
        <Link href={`/request-quote?supplier=${supplier.id}`} className="inline-flex min-h-10 items-center rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#18543f]">طلب عرض</Link>
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
          {model.supplier ? verificationLabel(model.supplier.verificationState) : 'ملف المورد'}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7650]">{model.modelType?.replaceAll('_', ' ') || 'Prefab model'}</p>
        <h3 className="mt-2 text-xl font-semibold text-[#24352f]">{model.name}</h3>
        <p className="mt-2 text-sm text-[#59645e]">{model.materialSummary || 'النطاق والسعر النهائي يعتمد على مراجعة المورد.'}</p>
        <div className="mt-4 grid gap-2 text-sm text-[#59645e]">
          <span>{model.sizeSqm ? `${model.sizeSqm} م²` : 'المساحة حسب التكوين'} · {model.bedrooms ?? '-'} غرف</span>
          <span>{formatPriceRange(model.priceRange)}</span>
          <span>المورد: {model.supplier?.name || 'شبكة موردي مهاد'}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/request-quote?model=${model.id}`} className="inline-flex min-h-10 items-center rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#18543f]">طلب عرض</Link>
          <Link href={`/models/${model.slug}`} className="inline-flex min-h-10 items-center rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold transition hover:border-[#1f6b4f]">عرض التفاصيل</Link>
        </div>
      </div>
    </article>
  );
}

export function GuideCard({ guide }: { guide: (typeof PREFAB_GUIDES)[number] }) {
  return (
    <Link href={`/guides/${guide.slug}`} className="block rounded-[8px] border border-[#ddd5c2] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#1f6b4f] hover:shadow-[0_18px_50px_rgba(36,53,47,0.1)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7650]">{guide.category} · {guide.readMinutes} min</p>
      <h3 className="mt-3 text-xl font-semibold text-[#24352f]">{guide.titleAr}</h3>
      <p className="mt-2 text-sm text-[#6a746f]">{guide.title}</p>
      <p className="mt-3 text-sm leading-6 text-[#59645e]">{guide.description}</p>
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, titleAr, body }: { eyebrow?: string; title: string; titleAr?: string; body?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7650]">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[#24352f] md:text-4xl">{title}</h2>
      {titleAr && titleAr !== title ? <p className="mt-2 text-xl font-semibold text-[#1f6b4f]" dir="rtl">{titleAr}</p> : null}
      {body ? <p className="mt-3 text-base leading-7 text-[#59645e]">{body}</p> : null}
    </div>
  );
}

export function TrustGrid() {
  const items = [
    ['من أقدر أوثق فيه؟', 'ملفات موردين موثقة، صور مشاريع، وقائمة مستندات واضحة.', ShieldCheck],
    ['وش يشمل السعر؟', 'قارن النقل، الأساسات، الخدمات، التركيب، والتخصيص.', ClipboardCheck],
    ['يناسب أرضي؟', 'راجع الموقع، الوصول، الخدمات، جاهزية المشروع، والنواقص.', Home],
    ['مين مسؤول عن إيش؟', 'افصل نطاق المصنع عن نطاق المشتري وأي طرف ثالث.', Building2],
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
  const items = ['هل الأرض موجودة؟', 'هل تعرف المدينة أو الموقع؟', 'هل عندك ميزانية تقريبية؟', 'هل الاستخدام واضح؟', 'هل تحتاج نقل أو أساسات أو خدمات أو إرشاد تصاريح؟', 'هل عندك صور للموقع أو اسكتشات؟'];
  return (
    <div className="rounded-[8px] border border-[#d8cfba] bg-[#24352f] p-6 text-white md:p-8">
      <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d3b36b]">جاهزية المشتري</p>
          <h2 className="mt-2 text-3xl font-semibold">هل مشروعك جاهز لطلب عروض الأسعار؟</h2>
          <p className="mt-2 text-lg text-[#d7e2dc]">نراجع الأساسيات قبل ما يضيع وقتك مع عروض غير قابلة للمقارنة.</p>
          <Link href="/request-quote" className="mt-5 inline-flex min-h-11 items-center rounded-[8px] bg-white px-4 text-sm font-semibold text-[#24352f]">افحص جاهزية المشروع</Link>
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
      <h2 className="mt-3 text-xl font-semibold">لا توجد بيانات منشورة بعد.</h2>
      <p className="mt-2 text-sm text-[#59645e]">مهاد جاهز لبيانات الموردين والنماذج. عند إضافة السجلات الفعالة ستظهر هنا تلقائيًا.</p>
    </div>
  );
}

export { PREFAB_CATEGORIES, PREFAB_GUIDES, PREFAB_WHATSAPP_URL };
