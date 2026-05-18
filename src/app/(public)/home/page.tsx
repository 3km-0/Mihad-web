import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { DigestSectionHeading, DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Mihad — Private Saudi luxury-home digest',
  description: 'Exceptional Saudi homes, privately showcased and quietly open to serious interest through screened confidential inquiry.',
  alternates: { canonical: absoluteUrl('/home') },
  openGraph: {
    title: 'Mihad — Private Saudi luxury-home digest',
    description: 'Exceptional Saudi homes. Privately showcased. Quietly open to serious interest.',
    url: absoluteUrl('/home'),
    siteName: 'Mihad',
    images: [absoluteUrl('/onboarding/workspace.jpg')],
  },
};

export default async function HomePage() {
  const locale = await getLocale();
  const ownerHref = '/submit-property';
  const buyerHref = '/private-interest';

  return (
    <DigestShell>
      <main>
        <section className="relative min-h-[calc(100svh-72px)] overflow-hidden border-b border-[#ded6c7]">
          <Image src="/onboarding/workspace.jpg" alt="" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(30,26,20,0.86),rgba(30,26,20,0.58),rgba(30,26,20,0.18))]" />
          <div className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-7xl items-end px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-4xl pb-8 text-white">
              <p className="inline-flex items-center gap-2 rounded-[999px] border border-white/25 bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#f2dfb8]">
                <Sparkles className="h-4 w-4" />
                {localize(locale, 'خاص. منتقى. هادئ.', 'Private. Curated. Discreet.')}
              </p>
              <h1 className="mt-6 max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-normal md:text-7xl">
                {localize(locale, 'منازل سعودية استثنائية. تُعرض بخصوصية. وتبقى مفتوحة لاهتمام جاد.', 'Exceptional Saudi homes. Privately showcased. Quietly open to serious interest.')}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">
                {localize(
                  locale,
                  'مهاد ليس بوابة عقارية عامة. هو مساحة تحريرية هادئة للمنازل النادرة، حيث يتحكم المالك في الظهور، ويُفحص اهتمام المشتري قبل أي اقتراب.',
                  'Mihad is not a public property portal. It is a quiet editorial room for rare homes, where owners control visibility and buyer interest is screened before any approach.'
                )}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={buyerHref} className="inline-flex min-h-12 items-center rounded-[8px] bg-white px-5 text-sm font-semibold text-[#1e1a14] transition hover:bg-[#f2dfb8]">
                  {localize(locale, 'إرسال اهتمام خاص', 'Submit Private Interest')}
                </Link>
                <Link href={ownerHref} className="inline-flex min-h-12 items-center rounded-[8px] border border-white/35 px-5 text-sm font-semibold text-white transition hover:bg-white/12">
                  {localize(locale, 'اعرض منزلك بهدوء', 'Showcase Your Home Quietly')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f2e8] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <DigestSectionHeading
              eyebrow={localize(locale, 'الفكرة', 'The premise')}
              title={localize(locale, 'المالك لا يحتاج أن يظهر كبائع. والمشتري لا يحتاج أن يصرخ ليصل.', 'The owner does not need to look like a seller. The buyer does not need noise to reach access.')}
              body={localize(
                locale,
                'مهاد يحوّل الفضول الجاد إلى مسار مؤهل: عرض تحريري، خصوصية قوية، ثم فحص يدوي قبل أي خطوة وساطة.',
                'Mihad turns serious curiosity into a qualified path: editorial presentation, strong privacy, then manual screening before any brokerage step.'
              )}
            />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: EyeOff,
                  title: localize(locale, 'لا سعر عام', 'No public price'),
                  body: localize(locale, 'السعر لا يتحول إلى مرساة عامة أو ضغط اجتماعي.', 'Price never becomes a public anchor or social pressure.'),
                },
                {
                  icon: LockKeyhole,
                  title: localize(locale, 'تحكم كامل للمالك', 'Owner control'),
                  body: localize(locale, 'المالك يوافق على ما يظهر ويقرر متى يستمع.', 'The owner approves what appears and decides when to listen.'),
                },
                {
                  icon: UserCheck,
                  title: localize(locale, 'فحص قبل الاقتراب', 'Screen before approach'),
                  body: localize(locale, 'الهوية، النية، القدرة، والوقت تُراجع قبل إزعاج أي مالك.', 'Identity, intent, ability, and timing are reviewed before disturbing any owner.'),
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-[8px] border border-[#ded6c7] bg-white p-6">
                  <Icon className="h-8 w-8 text-[#8c6f45]" />
                  <h2 className="mt-5 font-serif text-2xl font-semibold">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#625746]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#1e1a14] py-16 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f2dfb8]">{localize(locale, 'كيف يعمل', 'How it works')}</p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight">{localize(locale, 'واجهة هادئة. مسار وساطة يدوي عند الجدية فقط.', 'A quiet surface. Manual brokerage path only when signal becomes serious.')}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                localize(locale, 'المالك يقدّم المنزل أو تتم دعوته بهدوء.', 'Owner submits or is invited quietly.'),
                localize(locale, 'مهاد يراجع الجودة والخصوصية والوسائط الأصلية.', 'Mihad reviews quality, privacy, and original media.'),
                localize(locale, 'الصفحة تظهر بتفاصيل محدودة ودون سعر أو عنوان دقيق.', 'The page appears with limited detail and no price or exact address.'),
                localize(locale, 'المشتري يرسل اهتمامًا خاصًا مع الهوية والقدرة والوقت.', 'Buyer submits private interest with identity, ability, and timing.'),
                localize(locale, 'مهاد يفحص الإشارة قبل أن يقترب من المالك.', 'Mihad screens the signal before approaching the owner.'),
                localize(locale, 'إذا وافق المالك، تبدأ المحادثة الخاصة كمسار وساطة منظم.', 'If the owner agrees, the private conversation begins as a structured brokerage path.'),
              ].map((item, index) => (
                <div key={item} className="rounded-[8px] border border-white/12 bg-white/[0.06] p-4 text-sm leading-7 text-white/82">
                  <span className="mb-3 grid h-8 w-8 place-items-center rounded-[8px] bg-white text-xs font-bold text-[#1e1a14]">{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f2e8] py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <Link href={ownerHref} className="rounded-[8px] border border-[#ded6c7] bg-white p-8 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(30,26,20,0.11)]">
              <ShieldCheck className="h-9 w-9 text-[#8c6f45]" />
              <h2 className="mt-5 font-serif text-4xl font-semibold">{localize(locale, 'للملاك', 'For owners')}</h2>
              <p className="mt-4 leading-8 text-[#625746]">
                {localize(locale, 'منزلك لا يحتاج أن يكون معروضًا للبيع. يمكنك الموافقة على عرض تحريري هادئ، وتقرر وحدك هل يستحق أي اهتمام جاد الرد.', 'Your home does not need to be actively for sale. You can approve a quiet editorial presentation and decide whether any serious interest deserves a response.')}
              </p>
            </Link>
            <Link href={buyerHref} className="rounded-[8px] border border-[#ded6c7] bg-white p-8 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(30,26,20,0.11)]">
              <UserCheck className="h-9 w-9 text-[#8c6f45]" />
              <h2 className="mt-5 font-serif text-4xl font-semibold">{localize(locale, 'للمشترين الجادين', 'For serious buyers')}</h2>
              <p className="mt-4 leading-8 text-[#625746]">
                {localize(locale, 'بعض المنازل لا تظهر في الأماكن العامة. أرسل اهتمامًا خاصًا، ومهاد يفحص الجدية قبل أن يطلب من المالك أي رد.', 'Some homes do not appear in public channels. Submit confidential interest, and Mihad screens seriousness before asking an owner for any response.')}
              </p>
            </Link>
          </div>
        </section>
      </main>
    </DigestShell>
  );
}
