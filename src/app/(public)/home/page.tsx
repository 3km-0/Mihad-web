import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';
import { DigestSectionHeading, DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Mihad — Architecture and interiors digest',
  description: 'A quiet editorial digest for selected spaces, interior architecture, materials, light, and craft.',
  alternates: { canonical: absoluteUrl('/home') },
  openGraph: {
    title: 'Mihad — Architecture and interiors digest',
    description: 'Selected spaces, interior architecture, materials, light, and craft.',
    url: absoluteUrl('/home'),
    siteName: 'Mihad',
    images: [absoluteUrl('/private-digest/interior-study.png')],
  },
};

export default async function HomePage() {
  const locale = await getLocale();

  return (
    <DigestShell>
      <main>
        <section className="border-b border-[#D8DEE8] bg-[#EEF2F6]">
          <div className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4E89]">
                {localize(locale, 'دفتر معماري هادئ', 'Quiet architecture digest')}
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-[#101827] md:text-5xl">
                {localize(locale, 'مساحات تُقرأ من الضوء والمادة والتكوين.', 'Spaces read through light, material, and composition.')}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#334155]">
                {localize(
                  locale,
                  'مهاد يختار مساحات معمارية وداخلية تظهر بهدوء: لقطة واضحة، نص قليل، وتفاصيل تكفي لفهم الشعور دون ضجيج.',
                  'Mihad selects architectural and interior spaces with restraint: clear image, spare copy, and enough detail to understand the feeling without noise.'
                )}
              </p>
              <Link href="/spaces" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-[#23395D] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4E89]">
                {localize(locale, 'استعراض المساحات', 'View spaces')}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] border border-[#D8DEE8] bg-white">
              <Image src="/private-digest/interior-study.png" alt="" fill priority className="object-cover" sizes="(min-width: 1024px) 54vw, 100vw" />
            </div>
          </div>
        </section>

        <section className="bg-[#EEF2F6] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <DigestSectionHeading
              eyebrow={localize(locale, 'التحرير', 'Editorial')}
              title={localize(locale, 'الصورة أولًا، ثم ما يكفي من اللغة.', 'Image first, then only enough language.')}
              body={localize(
                locale,
                'الصفحة الجيدة لا تشرح كل شيء. تترك للضوء، النسب، السطح، والفراغ أن يقوموا بالعمل.',
                'A good page does not explain everything. It lets light, proportion, surface, and void do the work.'
              )}
            />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                [localize(locale, 'الضوء', 'Light'), localize(locale, 'كيف يدخل، أين يتوقف، وما الذي يكشفه.', 'How it enters, where it rests, and what it reveals.')],
                [localize(locale, 'المادة', 'Material'), localize(locale, 'خشونة، لمعان، وزن، وملمس بدون مبالغة.', 'Texture, sheen, weight, and tactility without excess.')],
                [localize(locale, 'التكوين', 'Composition'), localize(locale, 'علاقة العناصر ببعضها: فتحة، حافة، محور، ظل.', 'The relation of elements: opening, edge, axis, shadow.')],
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1D4E89]">{localize(locale, 'طريقة مهاد', 'Mihad method')}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#101827]">
                {localize(locale, 'عرض مختصر، منظم، وغير صاخب.', 'A concise, structured, quiet presentation.')}
              </h2>
            </div>
            <div className="grid gap-3">
              {[
                localize(locale, 'نختار زاوية بصرية واحدة تقود القراءة.', 'Select one visual angle to lead the reading.'),
                localize(locale, 'نكتب ملاحظات قصيرة عن الضوء، المادة، والإيقاع.', 'Write short notes on light, material, and rhythm.'),
                localize(locale, 'نترك التفاصيل العملية خارج الصفحة العامة.', 'Keep operational details outside the public page.'),
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
