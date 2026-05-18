import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Building2, MapPinned, ShieldCheck } from 'lucide-react';
import { absoluteUrl } from '@/lib/seo';
import { listPublicModels, listPublicSuppliers } from '@/lib/prefab-public-data';
import {
  CategoryCard,
  GuideCard,
  HeroRfqCard,
  ModelCard,
  PrefabFooter,
  PrefabNav,
  PREFAB_CATEGORIES,
  PREFAB_GUIDES,
  ReadinessChecklist,
  SectionHeading,
  SupplierCard,
  TrustGrid,
} from '@/components/prefab/PrefabMarketing';
import { pickLocalized } from '@/lib/prefab-copy';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mihad — Modular buildings and land activation in Saudi Arabia',
  description: 'Explore prefab homes, modular buildings, retail pods, project offices, and land activation ideas in Saudi Arabia.',
  alternates: { canonical: absoluteUrl('/home') },
  openGraph: {
    title: 'Mihad — Modular buildings and land activation in Saudi Arabia',
    description: 'Explore prefab buildings and start a Saudi land activation request when the timing is right.',
    url: absoluteUrl('/home'),
    siteName: 'Mihad',
    images: [absoluteUrl('/onboarding/workspace.jpg')],
  },
};

export default async function HomePage() {
  const locale = await getLocale();
  const [models, suppliers] = await Promise.all([
    listPublicModels({}),
    listPublicSuppliers({}),
  ]);

  return (
    <div className="min-h-screen bg-[#EEF2F6] text-[#101827]">
      <PrefabNav />
      <main>
        <section className="relative overflow-hidden border-b border-[#D8DEE8]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(29,78,137,0.12),transparent_30%),linear-gradient(120deg,#EEF2F6,#F8FAFC)]" />
          <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.85fr)] lg:items-center lg:px-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-[999px] border border-[#D8DEE8] bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">
                <BadgeCheck className="h-4 w-4" />
                {pickLocalized(locale, 'مباني جاهزة وتفعيل أراضٍ في السعودية', 'Modular buildings and land activation in Saudi Arabia')}
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-[#101827] md:text-7xl">
                {pickLocalized(locale, 'شاهد أفكار المباني الجاهزة، ثم فعّل الموقع المناسب عند جاهزية الطلب', 'Explore modular building ideas, then activate the right site when demand is real')}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#334155]">
                {pickLocalized(
                  locale,
                  'مهاد واجهة إلهام وتصفح للمباني الجاهزة، ومعها محرك طلبات هادئ يربط الشركات، ملاك الأراضي، وموردي الوحدات عندما تكون الأرقام والحقوق مناسبة.',
                  'Mihad is an editorial gallery for prefab and modular buildings, with a quiet demand engine for businesses, landowners, and suppliers when the economics and rights line up.'
                )}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/request-quote?audience=tenant&project_type=commercial_site" className="inline-flex min-h-12 items-center gap-2 rounded-[8px] bg-[#23395D] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4E89]">
                  {pickLocalized(locale, 'ابدأ طلبك', 'Start a request')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/request-quote?audience=landowner&project_type=land_activation" className="inline-flex min-h-12 items-center rounded-[8px] border border-[#C8D2E0] bg-white/75 px-5 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89]">
                  {pickLocalized(locale, 'عندي أرض', 'I own land')}
                </Link>
                <Link href="/request-quote?audience=supplier&project_type=supplier_application" className="inline-flex min-h-12 items-center rounded-[8px] border border-[#C8D2E0] bg-white/75 px-5 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89]">
                  {pickLocalized(locale, 'أنا مورد مباني جاهزة', 'I provide modular units')}
                </Link>
                <Link href="/models" className="inline-flex min-h-12 items-center rounded-[8px] border border-[#C8D2E0] bg-white/75 px-5 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89]">
                  {pickLocalized(locale, 'تصفح النماذج', 'Browse prefab models')}
                </Link>
                <Link href="/request-quote?audience=tenant" className="inline-flex min-h-12 items-center rounded-[8px] border border-[#C8D2E0] bg-white/75 px-5 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89]">
                  {pickLocalized(locale, 'ساعدني أختار', 'Help me choose')}
                </Link>
              </div>
              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                {[
                  pickLocalized(locale, 'معارض، مكاتب مشاريع، وأكشاك', 'Showrooms, project offices, and pods'),
                  pickLocalized(locale, 'أراضٍ خاملة قابلة للتفعيل', 'Idle land activation'),
                  pickLocalized(locale, 'موردون ونماذج جاهزة', 'Suppliers and modular models'),
                  pickLocalized(locale, 'تقييم أولي للتغطية والمخاطر', 'Early spread and risk screening'),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-[8px] border border-[#D8DEE8] bg-white/75 px-3 py-2 text-sm font-semibold text-[#334155]">
                    <ShieldCheck className="h-4 w-4 text-[#1D4E89]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-[#D8DEE8] shadow-[0_28px_80px_rgba(16,24,39,0.16)]">
                <Image src="/onboarding/workspace.jpg" alt="Modern prefab project planning in Saudi Arabia" fill className="object-cover" priority sizes="(min-width: 1024px) 40vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-[8px] bg-white/92 p-4">
                  <p className="text-sm font-semibold text-[#101827]">
                    {pickLocalized(locale, 'الفكرة جميلة، لكن التشغيل يحتاج طلبًا حقيقيًا.', 'The idea can be beautiful, but operation needs real demand.')}
                  </p>
                  <p className="mt-1 text-sm text-[#334155]">
                    {pickLocalized(
                      locale,
                      'نبدأ بالإلهام والتصفح، ثم نفحص المستأجر، الأرض، الوحدة الجاهزة، والانتشار المالي قبل أي التزام.',
                      'Browse first, then screen tenant demand, land rights, modular supply, and spread before any commitment.'
                    )}
                  </p>
                </div>
              </div>
              <HeroRfqCard />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={pickLocalized(locale, 'استكشف', 'Explore')}
            title={pickLocalized(locale, 'استكشف حلول البناء الجاهز حسب الاستخدام', 'Explore prefab solutions by use case')}
            titleAr="استكشف حلول البناء الجاهز حسب الاستخدام"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PREFAB_CATEGORIES.slice(0, 8).map((category) => <CategoryCard key={category.slug} category={category} />)}
          </div>
        </section>

        <section className="bg-[#F8FAFC] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
            eyebrow={pickLocalized(locale, 'كيف يعمل', 'How it works')}
              title={pickLocalized(locale, 'من الإلهام إلى فرصة تفعيل قابلة للفحص', 'From inspiration to a screenable activation opportunity')}
              titleAr="من الإلهام إلى فرصة تفعيل قابلة للفحص"
            />
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[
                [
                  pickLocalized(locale, 'تصفح الأفكار والنماذج', 'Browse ideas and models'),
                  pickLocalized(locale, 'منازل، مكاتب جاهزة، أكشاك، معارض، وحلول مواقع.', 'Homes, offices, pods, showrooms, and site facilities.'),
                ],
                [
                  pickLocalized(locale, 'اختر مسار الطلب', 'Pick the right request path'),
                  pickLocalized(locale, 'مستأجر، مالك أرض، أو مورد وحدات جاهزة.', 'Tenant, landowner, or modular supplier.'),
                ],
                [
                  pickLocalized(locale, 'نفحص الملاءمة والأرقام', 'Screen fit and economics'),
                  pickLocalized(locale, 'طلب مؤكد، حقوق واضحة، وتغطية تكاليف قبل التشغيل.', 'Confirmed demand, clear rights, and cost coverage before operation.'),
                ],
                [
                  pickLocalized(locale, 'نرتب التواصل بموافقة', 'Coordinate approved outreach'),
                  pickLocalized(locale, 'كل تواصل خارجي يمر عبر بوابة موافقة من المشغل.', 'Every external outreach stays approval-gated.'),
                ],
              ].map(([title, body], index) => (
                <div key={title} className="rounded-[8px] border border-[#D8DEE8] bg-white p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#23395D] text-sm font-bold text-white">{index + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#334155]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={pickLocalized(locale, 'النماذج', 'Models')}
            title={pickLocalized(locale, 'نماذج جاهزة تلهم الاستخدام', 'Modular models that shape the use case')}
            titleAr="نماذج جاهزة تلهم الاستخدام"
            body={pickLocalized(locale, 'النموذج ليس الصفقة وحده. الموقع، الحقوق، التركيب، والصيانة هي التي تحدد ما إذا كان التفعيل مناسبًا.', 'The model alone is not the deal. Site rights, installation, and maintenance determine whether activation works.')}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {models.slice(0, 3).map((model) => <ModelCard key={model.id} model={model} />)}
          </div>
        </section>

        <section className="bg-[#F8FAFC] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow={pickLocalized(locale, 'الموردون', 'Suppliers')}
            title={pickLocalized(locale, 'موردون يمكن ربطهم بطلب فعلي', 'Suppliers that can be matched to real demand')}
              titleAr="موردون يمكن ربطهم بطلب فعلي"
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {suppliers.slice(0, 3).map((supplier) => <SupplierCard key={supplier.id} supplier={supplier} />)}
            </div>
            <p className="mt-6 rounded-[8px] border border-[#D8DEE8] bg-white p-4 text-sm leading-6 text-[#334155]">
              {pickLocalized(
                locale,
                'التحقق لا يعني أن مهاد يضمن اعتماد المشروع أو السعر أو التسليم. معناه أن المورد قدّم معلومات أساسية تساعدنا نفحص الملاءمة قبل التواصل.',
                'Verification does not mean Mihad guarantees approval, pricing, or delivery. It means the supplier has submitted basic information that helps screen fit before outreach.'
              )}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={pickLocalized(locale, 'الثقة', 'Trust')}
            title={pickLocalized(locale, 'الجمال يفتح الباب. الانضباط يحمي الصفقة.', 'Beauty opens the door. Discipline protects the deal.')}
            titleAr="الجمال يفتح الباب. الانضباط يحمي الصفقة."
          />
          <div className="mt-10"><TrustGrid /></div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <ReadinessChecklist />
        </section>

        <section className="bg-[#F8FAFC] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow={pickLocalized(locale, 'الأدلة', 'Guides')}
              title={pickLocalized(locale, 'افهم الخيارات قبل أن تشتري', 'Learn before you buy')}
              titleAr="افهم الخيارات قبل أن تشتري"
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PREFAB_GUIDES.slice(0, 6).map((guide) => <GuideCard key={guide.slug} guide={guide} />)}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[8px] border border-[#D8DEE8] bg-white p-8">
            <Building2 className="h-9 w-9 text-[#1D4E89]" />
            <h2 className="mt-4 text-3xl font-semibold">{pickLocalized(locale, 'أحتاج موقع تجاري', 'I need a commercial site')}</h2>
            <p className="mt-3 leading-7 text-[#334155]">
              {pickLocalized(locale, 'أرسل نشاطك، المدينة، مساحة الأرض، ميزانيتك الشهرية، والجدول الزمني عشان نفحص أفضل موقع ووحدة جاهزة.', 'Share your activity, city, land area, monthly budget, and timeline so Mihad can screen the right site and modular unit.')}
            </p>
            <Link href="/request-quote?audience=tenant&project_type=commercial_site" className="mt-5 inline-flex min-h-11 items-center rounded-[8px] bg-[#23395D] px-4 text-sm font-semibold text-white">{pickLocalized(locale, 'ابدأ طلب موقع', 'Start site request')}</Link>
          </div>
          <div className="rounded-[8px] border border-[#30333A] bg-[#111827] p-8 text-white">
            <MapPinned className="h-9 w-9 text-[#A6E3B8]" />
            <h2 className="mt-4 text-3xl font-semibold">{pickLocalized(locale, 'عندي أرض أو وحدات جاهزة', 'I have land or modular supply')}</h2>
            <p className="mt-3 leading-7 text-[#C9CCD1]">
              {pickLocalized(locale, 'ملاك الأراضي والموردون يدخلون نفس محرك الطلب لكن بمسار مختلف: حقوق، تسعير، قابلية تركيب، وصيانة.', 'Landowners and suppliers enter the same demand engine with a different path: rights, pricing, installability, and maintenance.')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/request-quote?audience=landowner&project_type=land_activation" className="inline-flex min-h-11 items-center rounded-[8px] bg-white px-4 text-sm font-semibold text-[#111827]">{pickLocalized(locale, 'سجل أرضك', 'Submit land')}</Link>
              <Link href="/request-quote?audience=supplier&project_type=supplier_application" className="inline-flex min-h-11 items-center rounded-[8px] border border-white/25 px-4 text-sm font-semibold text-white">{pickLocalized(locale, 'قدّم كمورد', 'Apply as supplier')}</Link>
            </div>
          </div>
        </section>
      </main>
      <PrefabFooter />
    </div>
  );
}
