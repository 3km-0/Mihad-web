import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { DigestSectionHeading, DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

const visualSamples = [
  {
    src: '/onboarding/launch.jpg',
    ar: 'واجهة ليلية بخطوط مضاءة',
    en: 'Evening facade, lit edges',
  },
  {
    src: '/onboarding/budget.jpg',
    ar: 'ظل أبيض وسقف خشبي',
    en: 'White shade, timber soffit',
  },
  {
    src: '/onboarding/trial.jpg',
    ar: 'حجم عائلي بإضاءة هادئة',
    en: 'Family scale, quiet light',
  },
];

export const metadata: Metadata = {
  title: 'Mihad — Saudi architecture and interiors',
  description: 'Selected villas, majlis rooms, courtyards, and interiors in a contemporary Saudi mood.',
  alternates: { canonical: absoluteUrl('/home') },
  openGraph: {
    title: 'Mihad — Saudi architecture and interiors',
    description: 'Selected villas, majlis rooms, courtyards, and interiors in a contemporary Saudi mood.',
    url: absoluteUrl('/home'),
    siteName: 'Mihad',
    images: [absoluteUrl('/onboarding/launch.jpg')],
  },
};

export default async function HomePage() {
  const locale = await getLocale();

  return (
    <DigestShell>
      <main>
        <section className="relative min-h-[calc(100svh-72px)] overflow-hidden border-b border-[#D8DEE8] bg-[#101827]">
          <Image src="/onboarding/launch.jpg" alt="" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,24,39,0.84),rgba(16,24,39,0.44),rgba(16,24,39,0.08))]" />
          <div className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-7xl items-end px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-3xl pb-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                {localize(locale, 'حياة سعودية معاصرة', 'Saudi modern living')}
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal md:text-6xl">
                {localize(locale, 'فلل ومجالس وأفنية مصاغة للضوء.', 'Villas, majlis rooms, and courtyards shaped for light.')}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/82">
                {localize(
                  locale,
                  'مختارات بصرية لواجهات هادئة، مداخل مضاءة، حجر بارد، خشب دافئ، ومجالس تحفظ الخصوصية من غير أن تفقد الفخامة.',
                  'A visual edit of quiet facades, lit arrivals, cool stone, warm timber, and interiors that hold privacy without losing luxury.'
                )}
              </p>
              <Link href="/spaces" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-[#23395D] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4E89]">
                {localize(locale, 'مشاهدة المختارات', 'Enter the edit')}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#EEF2F6] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <DigestSectionHeading
              eyebrow={localize(locale, 'مشاهد مختارة', 'Selected scenes')}
              title={localize(locale, 'من وهج المجلس إلى ظل الفناء.', 'From majlis glow to courtyard shade.')}
              body={localize(
                locale,
                'واجهات، فراغات خارجية، وداخلية تقرأ ببطء: كتلة واضحة، مادة محترمة، وتفاصيل لا تحتاج إلى ضجيج.',
                'Facades, outdoor rooms, and interiors read slowly: clear massing, composed material, and detail that does not need noise.'
              )}
            />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {visualSamples.map((item) => (
                <figure key={item.src} className="overflow-hidden rounded-[8px] border border-[#D8DEE8] bg-white">
                  <div className="relative aspect-[4/3]">
                    <Image src={item.src} alt="" fill className="object-cover" sizes="(min-width: 768px) 33vw, 100vw" />
                  </div>
                  <figcaption className="border-t border-[#D8DEE8] px-4 py-3 text-sm font-semibold text-[#334155]">
                    {localize(locale, item.ar, item.en)}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                [localize(locale, 'المجلس', 'Majlis'), localize(locale, 'دفء الإضاءة، هدوء الجلسة، وحضور الضيافة.', 'Warm light, calm seating, and the presence of hosting.')],
                [localize(locale, 'الفناء', 'Courtyard'), localize(locale, 'ظل وماء ونباتات تقطع حرارة اليوم.', 'Shade, water, and planting to soften the day.')],
                [localize(locale, 'الواجهة', 'Facade'), localize(locale, 'كتلة وخصوصية وخط وصول واضح من أول نظرة.', 'Mass, privacy, and a clear arrival line at first glance.')],
              ].map(([title, body]) => (
                <section key={title} className="rounded-[8px] border border-[#D8DEE8] bg-white p-5">
                  <h2 className="text-sm font-semibold text-[#101827]">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#334155]">{body}</p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#D8DEE8] bg-white py-14">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4E89]">{localize(locale, 'الذوق', 'The tone')}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#101827]">
                {localize(locale, 'فخامة سعودية من غير استعراض زائد.', 'Saudi luxury without the overstatement.')}
              </h2>
            </div>
            <div className="grid gap-3">
              {[
                localize(locale, 'خصوصية واضحة، لكن ليست مغلقة على نفسها.', 'Privacy that feels clear without feeling closed.'),
                localize(locale, 'مادة صادقة: حجر، خشب، زجاج، ظل.', 'Honest material: stone, timber, glass, shade.'),
                localize(locale, 'لقطة قليلة الكلام، كافية لتذكر المكان.', 'A spare visual moment, enough to remember the place.'),
              ].map((item, index) => (
                <div key={item} className="flex gap-4 rounded-[8px] border border-[#D8DEE8] bg-[#F8FAFC] p-4 text-sm leading-7 text-[#334155]">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-[#EEF2F6] font-semibold text-[#1D4E89]">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </DigestShell>
  );
}
