import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { DigestSectionHeading, DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About Mihad — Architecture and interiors digest',
  description: 'How Mihad edits selected spaces through architecture, interiors, materials, light, and craft.',
  alternates: { canonical: absoluteUrl('/about') },
};

export default async function AboutPage() {
  const locale = await getLocale();

  return (
    <DigestShell>
      <main>
        <section className="border-b border-[#D8DEE8] bg-[#EEF2F6] px-4 py-14 sm:px-6 lg:px-8">
          <DigestSectionHeading
            eyebrow={localize(locale, 'عن مهاد', 'About Mihad')}
            title={localize(locale, 'دفتر مختصر للمساحات التي تستحق قراءة هادئة.', 'A concise digest for spaces worth a quiet reading.')}
            body={localize(
              locale,
              'مهاد يهتم بما تفعله العمارة الداخلية عندما تكون الصورة كافية، والنص مضبوطًا، والتفاصيل في مكانها.',
              'Mihad is interested in what interior architecture does when the image is enough, the copy is precise, and the details are in place.'
            )}
          />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [localize(locale, 'اختيار محدود', 'Limited selection'), localize(locale, 'لا نبحث عن كثرة. نبحث عن مساحة يمكن قراءتها بصريًا.', 'Not volume. A space should be readable visually.')],
              [localize(locale, 'لغة قليلة', 'Spare language'), localize(locale, 'النص يصف الضوء والمادة والإيقاع دون أن يطغى على الصورة.', 'Copy describes light, material, and rhythm without overtaking the image.')],
              [localize(locale, 'تفاصيل محفوظة', 'Held detail'), localize(locale, 'المعلومات العملية تبقى خارج العرض العام حتى لا يتغير طابع الصفحة.', 'Operational detail stays outside the public presentation so the page keeps its character.')],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[8px] border border-[#D8DEE8] bg-white p-5">
                <h2 className="text-sm font-semibold text-[#101827]">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#334155]">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-[8px] border border-[#D8DEE8] bg-[#F8FAFC] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{localize(locale, 'مبدأ', 'Principle')}</p>
            <p className="mt-4 max-w-4xl text-base leading-8 text-[#334155]">
              {localize(
                locale,
                'الصفحة العامة في مهاد ليست مكانًا لشرح كل شيء. هي قراءة تحريرية منظمة، وما بعدها يتم يدويًا وبهدوء.',
                'A public Mihad page is not a place to explain everything. It is a structured editorial reading; anything beyond that is handled manually and quietly.'
              )}
            </p>
          </div>
        </section>
      </main>
    </DigestShell>
  );
}
