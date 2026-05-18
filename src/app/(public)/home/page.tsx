import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Building2, MessageCircle, ShieldCheck } from 'lucide-react';
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
  PREFAB_WHATSAPP_URL,
  ReadinessChecklist,
  SectionHeading,
  SupplierCard,
  TrustGrid,
} from '@/components/prefab/PrefabMarketing';
import { pickLocalized } from '@/lib/prefab-copy';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mihad — Saudi prefab buying guide and RFQ engine',
  description: 'Compare prefab suppliers and models in Saudi Arabia, understand scope, and request quotes based on your city, land, budget, and use case.',
  alternates: { canonical: absoluteUrl('/home') },
  openGraph: {
    title: 'Mihad — Saudi prefab buying guide and RFQ engine',
    description: 'Find the right prefab home or modular space in Saudi Arabia.',
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
                {pickLocalized(locale, 'طلبات بناء جاهز للسوق السعودي', 'Saudi-first prefab RFQs')}
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-[#101827] md:text-7xl">
                {pickLocalized(locale, 'اختر حل البناء الجاهز المناسب لمشروعك في السعودية', 'Find the right prefab home or modular space in Saudi Arabia')}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#334155]">
                {pickLocalized(
                  locale,
                  'قارن بين موردين موثوقين، تصفح النماذج الجاهزة، واطلب عروض حسب المدينة، الأرض، الميزانية، ونوع المشروع.',
                  'Compare verified prefab manufacturers, explore ready models, and request quotes based on your city, land, budget, and use case.'
                )}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/request-quote" className="inline-flex min-h-12 items-center gap-2 rounded-[8px] bg-[#23395D] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4E89]">
                  {pickLocalized(locale, 'ابدأ بالموقع والميزانية ونوع المشروع', 'Start with your land, budget, and use case')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/models" className="inline-flex min-h-12 items-center rounded-[8px] border border-[#C8D2E0] bg-white/75 px-5 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89]">
                  {pickLocalized(locale, 'تصفح النماذج', 'Browse prefab models')}
                </Link>
                <Link href={PREFAB_WHATSAPP_URL} className="inline-flex min-h-12 items-center gap-2 rounded-[8px] border border-[#C8D2E0] bg-white/75 px-5 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89]">
                  <MessageCircle className="h-4 w-4" />
                  {pickLocalized(locale, 'واتساب', 'WhatsApp')}
                </Link>
              </div>
              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                {[
                  pickLocalized(locale, 'موردون موثوقون', 'Verified suppliers'),
                  pickLocalized(locale, 'مناطق تسليم داخل السعودية', 'Saudi delivery regions'),
                  pickLocalized(locale, 'طلبات أسعار + واتساب', 'RFQ + WhatsApp matching'),
                  pickLocalized(locale, 'منازل، شاليهات، مجالس، مكاتب', 'Homes, chalets, majlis, offices'),
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
                    {pickLocalized(locale, 'قبل مكالمة المورد، خلّ النطاق واضح.', 'Before supplier calls, clarify scope.')}
                  </p>
                  <p className="mt-1 text-sm text-[#334155]">
                    {pickLocalized(
                      locale,
                      'الأرض، الميزانية، الوقت، النقل، الأساسات، الخدمات، والتركيب كلها تغيّر العرض النهائي.',
                      'Land, budget, timeline, transport, foundation, utilities, and installation all change the quote.'
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
              title={pickLocalized(locale, 'من الفكرة إلى قائمة الموردين المناسبة', 'From idea to supplier shortlist')}
              titleAr="من الفكرة إلى قائمة الموردين المناسبة"
            />
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[
                [
                  pickLocalized(locale, 'عرّفنا على مشروعك', 'Tell us your project'),
                  pickLocalized(locale, 'المدينة، الأرض، الاستخدام، الميزانية، والوقت.', 'City, land, use case, budget, timeline.'),
                ],
                [
                  pickLocalized(locale, 'افهم خياراتك', 'Understand your options'),
                  pickLocalized(locale, 'السعر، التسليم، الأساسات، التركيب، والتصاريح.', 'Price, delivery, foundation, installation, permits.'),
                ],
                [
                  pickLocalized(locale, 'نرشح لك الأنسب', 'Get matched'),
                  pickLocalized(locale, 'نوجه الطلب لمصنعين مناسبين تمت مراجعة ملفاتهم.', 'Route the RFQ to suitable reviewed manufacturers.'),
                ],
                [
                  pickLocalized(locale, 'قارن وقرر الخطوة التالية', 'Compare and move forward'),
                  pickLocalized(locale, 'راجع ملاءمة المورد، النطاق، والخطوات القادمة.', 'Review supplier fit, scope, and next steps.'),
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
            title={pickLocalized(locale, 'نماذج جاهزة شائعة', 'Popular prefab models')}
            titleAr="نماذج جاهزة شائعة"
            body={pickLocalized(locale, 'الأسعار تظهر كنطاقات أو ملاحظات لأن النقل والأساسات والخدمات والتخصيص تؤثر على العرض النهائي.', 'Prices are shown as ranges or quote notes because transport, foundations, utilities, and customization affect the final offer.')}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {models.slice(0, 3).map((model) => <ModelCard key={model.id} model={model} />)}
          </div>
        </section>

        <section className="bg-[#F8FAFC] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow={pickLocalized(locale, 'الموردون', 'Suppliers')}
              title={pickLocalized(locale, 'تعرّف على مصنّعين موثوقين للبناء الجاهز', 'Meet reviewed prefab manufacturers')}
              titleAr="تعرّف على مصنّعين موثوقين للبناء الجاهز"
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {suppliers.slice(0, 3).map((supplier) => <SupplierCard key={supplier.id} supplier={supplier} />)}
            </div>
            <p className="mt-6 rounded-[8px] border border-[#D8DEE8] bg-white p-4 text-sm leading-6 text-[#334155]">
              {pickLocalized(
                locale,
                'التحقق لا يعني أن مهاد يضمن اعتماد المشروع أو السعر أو التسليم. معناه أن المورد قدّم معلومات أساسية عن الشركة والأعمال والخدمة للمراجعة.',
                'Verification does not mean Mihad guarantees project approval, pricing, or delivery. It means the supplier has submitted key company, portfolio, and service information for review.'
              )}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={pickLocalized(locale, 'الثقة', 'Trust')}
            title={pickLocalized(locale, 'اختيار البناء الجاهز قد يكون مربكًا. نحن نسهّل المقارنة.', 'Prefab buying is confusing. We make it easier to compare.')}
            titleAr="اختيار البناء الجاهز قد يكون مربكًا. نحن نسهّل المقارنة."
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
            <h2 className="mt-4 text-3xl font-semibold">{pickLocalized(locale, 'تحتاج وحدات جاهزة لمشروع تجاري؟', 'Need modular spaces for a business project?')}</h2>
            <p className="mt-3 leading-7 text-[#334155]">
              {pickLocalized(locale, 'اطلب عروض للمكاتب الجاهزة، سكن العمال، العيادات، الفصول، المقاهي، الأكشاك، ومرافق المواقع.', 'Request quotes for modular offices, staff housing, clinics, classrooms, cafes, kiosks, and site facilities.')}
            </p>
            <Link href="/for-businesses" className="mt-5 inline-flex min-h-11 items-center rounded-[8px] bg-[#23395D] px-4 text-sm font-semibold text-white">{pickLocalized(locale, 'قدّم طلب شركة', 'Submit business RFQ')}</Link>
          </div>
          <div className="rounded-[8px] border border-[#30333A] bg-[#111827] p-8 text-white">
            <h2 className="text-3xl font-semibold">{pickLocalized(locale, 'هل أنت مصنع أو مورد لحلول البناء الجاهز؟', 'Are you a prefab manufacturer?')}</h2>
            <p className="mt-3 leading-7 text-[#C9CCD1]">
              {pickLocalized(locale, 'انضم إلى مهاد لعرض نماذجك واستقبال طلبات مؤهلة وبناء الثقة مع المشترين في السعودية.', 'Join Mihad to showcase your models, receive qualified RFQs, and build trust with Saudi buyers.')}
            </p>
            <Link href="/for-manufacturers" className="mt-5 inline-flex min-h-11 items-center rounded-[8px] bg-white px-4 text-sm font-semibold text-[#111827]">{pickLocalized(locale, 'قدّم كمورد', 'Apply as supplier')}</Link>
          </div>
        </section>
      </main>
      <PrefabFooter />
    </div>
  );
}
