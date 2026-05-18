import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Building2, Calculator, MapPinned, ShieldCheck } from 'lucide-react';
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
  title: 'Mihad — Prefab Fieldbook and AI Calculator',
  description: 'Read prefab ideas, browse modular models, and estimate project cost, timeline, and site readiness before requesting quotes.',
  alternates: { canonical: absoluteUrl('/home') },
  openGraph: {
    title: 'Mihad — Prefab Fieldbook and AI Calculator',
    description: 'Explore prefab ideas and estimate your project before supplier or site outreach.',
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
                {pickLocalized(locale, 'دليل مهاد وحاسبة المباني الجاهزة', 'Prefab Fieldbook and AI Calculator')}
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-[#101827] md:text-7xl">
                {pickLocalized(locale, 'اقرأ الفكرة، شاهد النموذج، ثم احسب مشروعك الجاهز', 'Read the idea, see the model, then estimate your prefab project')}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#334155]">
                {pickLocalized(
                  locale,
                  'مهاد يبدأ كمجلة عملية للمباني الجاهزة: أفكار، نماذج، موردون، وحاسبة تقدّر التكلفة والمدة وجاهزية الموقع قبل أي تواصل.',
                  'Mihad starts as a practical prefab fieldbook: ideas, models, suppliers, and a calculator that estimates cost, timeline, and site readiness before any outreach.'
                )}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/calculator" className="inline-flex min-h-12 items-center gap-2 rounded-[8px] bg-[#23395D] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4E89]">
                  <Calculator className="h-4 w-4" />
                  {pickLocalized(locale, 'احسب مشروعك الجاهز', 'Estimate your prefab project')}
                </Link>
                <Link href="/fieldbook" className="inline-flex min-h-12 items-center gap-2 rounded-[8px] border border-[#C8D2E0] bg-white/75 px-5 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89]">
                  {pickLocalized(locale, 'تصفح دليل مهاد', 'Browse the Fieldbook')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/models" className="inline-flex min-h-12 items-center rounded-[8px] border border-[#C8D2E0] bg-white/75 px-5 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89]">
                  {pickLocalized(locale, 'تصفح النماذج', 'Browse prefab models')}
                </Link>
              </div>
              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                {[
                  pickLocalized(locale, 'مقالات عملية وليست صور فقط', 'Practical articles, not just images'),
                  pickLocalized(locale, 'نطاق تكلفة منخفض/أساس/مرتفع', 'Low/base/high planning ranges'),
                  pickLocalized(locale, 'جاهزية أرض وخدمات وموقع', 'Land, utility, and access readiness'),
                  pickLocalized(locale, 'موردون ونماذج عند الحاجة', 'Suppliers and models when needed'),
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
                    {pickLocalized(locale, 'الصورة تلهمك. الحاسبة توضّح لك الواقع.', 'The image inspires. The calculator makes it practical.')}
                  </p>
                  <p className="mt-1 text-sm text-[#334155]">
                    {pickLocalized(
                      locale,
                      'ابدأ بفكرة جاهزة، ثم احسب التكلفة والمدة ونواقص الموقع قبل طلب عروض أو البحث عن أرض.',
                      'Start with a prefab idea, then estimate cost, timeline, and site gaps before quotes or land help.'
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
            eyebrow={pickLocalized(locale, 'دليل مهاد', 'Fieldbook')}
            title={pickLocalized(locale, 'أفكار جاهزة تتحول إلى تقديرات', 'Prefab ideas that turn into estimates')}
            titleAr="أفكار جاهزة تتحول إلى تقديرات"
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PREFAB_CATEGORIES.slice(0, 8).map((category) => <CategoryCard key={category.slug} category={category} />)}
          </div>
        </section>

        <section className="bg-[#F8FAFC] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
            eyebrow={pickLocalized(locale, 'كيف يعمل', 'How it works')}
              title={pickLocalized(locale, 'من المقالة إلى الحاسبة ثم القرار', 'From article to calculator to decision')}
              titleAr="من المقالة إلى الحاسبة ثم القرار"
            />
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[
                [
                  pickLocalized(locale, 'اقرأ الفكرة', 'Read the idea'),
                  pickLocalized(locale, 'منازل، مكاتب جاهزة، أكشاك، معارض، وحلول مواقع.', 'Homes, offices, pods, showrooms, and site facilities.'),
                ],
                [
                  pickLocalized(locale, 'احسب المشروع', 'Estimate the project'),
                  pickLocalized(locale, 'تكلفة، تركيب، جاهزية موقع، ومدة متوقعة.', 'Cost, installation, site readiness, and timeline.'),
                ],
                [
                  pickLocalized(locale, 'قارن الموردين', 'Compare suppliers'),
                  pickLocalized(locale, 'استخدم نتيجة الحاسبة لمقارنة النطاقات والنواقص.', 'Use the calculator result to compare scope and gaps.'),
                ],
                [
                  pickLocalized(locale, 'افتح المساعدة عند الحاجة', 'Open help when needed'),
                  pickLocalized(locale, 'إذا احتجت أرض أو مساحة عمل، يظهر المسار المناسب بعد الحساب.', 'If you need land or a workspace, the right path appears after the estimate.'),
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
            body={pickLocalized(locale, 'النموذج بداية جيدة، لكن السعر الحقيقي يتأثر بالموقع، التركيب، الخدمات، والصيانة.', 'The model is a good starting point, but real cost depends on site, installation, utilities, and maintenance.')}
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
            title={pickLocalized(locale, 'الصورة تلهمك. النطاق يساعدك تقرر.', 'The image inspires. The range helps you decide.')}
            titleAr="الصورة تلهمك. النطاق يساعدك تقرر."
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
            <h2 className="mt-4 text-3xl font-semibold">{pickLocalized(locale, 'هل تحتاج موقعًا بعد الحساب؟', 'Need a site after estimating?')}</h2>
            <p className="mt-3 leading-7 text-[#334155]">
              {pickLocalized(locale, 'إذا أظهرت الحاسبة أن الفكرة تحتاج أرضًا أو ساحة، يمكنك تحويلها لاحقًا إلى موجز مشروع محفوظ.', 'If the calculator shows the concept needs land or a yard, you can later turn it into a saved project brief.')}
            </p>
            <Link href="/calculator?category=modular-offices" className="mt-5 inline-flex min-h-11 items-center rounded-[8px] bg-[#23395D] px-4 text-sm font-semibold text-white">{pickLocalized(locale, 'احسب الفكرة أولًا', 'Estimate first')}</Link>
          </div>
          <div className="rounded-[8px] border border-[#30333A] bg-[#111827] p-8 text-white">
            <MapPinned className="h-9 w-9 text-[#A6E3B8]" />
            <h2 className="mt-4 text-3xl font-semibold">{pickLocalized(locale, 'للملاك والموردين', 'For landowners and suppliers')}</h2>
            <p className="mt-3 leading-7 text-[#C9CCD1]">
              {pickLocalized(locale, 'المسار موجود عند الحاجة، لكنه ليس واجهة المستخدم الأساسية. نبدأ بالمشروع ونفتح الشركاء عندما يفيد ذلك.', 'The path is available when needed, but it is not the main public face. We start with the project and open partner flows when useful.')}
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
