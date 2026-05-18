import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { DigestSectionHeading, DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About Mihad — Private Saudi luxury-home digest',
  description: 'How Mihad protects owners, screens serious interest, and keeps exceptional homes private.',
  alternates: { canonical: absoluteUrl('/about') },
};

export default async function AboutPage() {
  const locale = await getLocale();

  return (
    <DigestShell>
      <main>
        <section className="border-b border-[#ded6c7] px-4 py-16 sm:px-6 lg:px-8">
          <DigestSectionHeading
            eyebrow={localize(locale, 'عن مهاد', 'About Mihad')}
            title={localize(locale, 'مجلة خاصة من الخارج، وبوابة تأهيل يدوية من الداخل', 'A private magazine outside, a careful qualification gateway inside')}
            body={localize(
              locale,
              'مهاد صُمم للمنازل التي قد تستمع لاهتمام جاد، لكنها لا تريد الظهور كإعلان بيع عام.',
              'Mihad is built for homes that may listen to serious interest, without appearing as a public sale advert.'
            )}
          />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [localize(locale, 'نحمي المالك', 'Protect the owner'), localize(locale, 'لا سعر عام، لا اسم مالك، لا عنوان دقيق، ولا ضغط للرد.', 'No public price, no owner name, no exact address, and no pressure to respond.')],
              [localize(locale, 'نؤهل الاهتمام', 'Qualify interest'), localize(locale, 'هوية، نية، قدرة، وقت، واستعداد للسرية قبل أي اقتراب.', 'Identity, intent, ability, timing, and confidentiality readiness before any approach.')],
              [localize(locale, 'نتحرك عند الجدية', 'Move when serious'), localize(locale, 'المسار يبقى هادئًا حتى توجد إشارة تستحق وقت المالك ومراجعة مهاد.', 'The process stays quiet until a signal deserves owner time and Mihad review.')],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[8px] border border-[#ded6c7] bg-white p-6">
                <h2 className="font-serif text-2xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#625746]">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-[8px] border border-[#ded6c7] bg-[#1e1a14] p-6 text-white md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f2dfb8]">{localize(locale, 'مهم', 'Important')}</p>
            <p className="mt-4 max-w-4xl text-lg leading-9 text-white/82">
              {localize(
                locale,
                'قبل أي خطوة وساطة فعلية، يجب أن تكون الصلاحيات، الإفصاحات، التفويضات، والالتزامات النظامية واضحة ومراجعة مهنيًا. مهاد لا يقدم نصيحة قانونية أو وعدًا بصفقة.',
                'Before any actual brokerage step, authority, disclosures, mandates, and regulatory obligations must be clear and professionally reviewed. Mihad does not provide legal advice or promise a transaction.'
              )}
            </p>
          </div>
        </section>
      </main>
    </DigestShell>
  );
}
