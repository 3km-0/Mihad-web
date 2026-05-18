import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Terms — Mihad',
  description: 'Mihad editorial digest terms for selected spaces and manual messages.',
  alternates: { canonical: absoluteUrl('/terms') },
};

export default async function TermsPage() {
  const locale = await getLocale();

  const items = [
    [localize(locale, 'عرض تحريري', 'Editorial presentation'), localize(locale, 'تظهر الصفحات كقراءة بصرية مختصرة، وليست سجلًا كاملًا لكل التفاصيل.', 'Pages appear as concise visual readings, not complete records of every detail.')],
    [localize(locale, 'رسائل يدوية', 'Manual messages'), localize(locale, 'إرسال Make an offer يفتح ملاحظة يدوية لفريق مهاد ولا ينشئ التزامًا أو وعدًا بالرد.', 'Sending Make an offer creates a manual note for Mihad and does not create an obligation or promise of response.')],
    [localize(locale, 'مراجعة المحتوى', 'Content review'), localize(locale, 'قد يعدّل مهاد أو يؤخر أو يزيل أي صفحة للحفاظ على جودة العرض وخصوصيته.', 'Mihad may edit, delay, or remove any page to preserve presentation quality and privacy.')],
    [localize(locale, 'نسخة أولى', 'First version'), localize(locale, 'هذه مبادئ تشغيل أولية، وقد تُراجع مع نضج المنتج والعمليات.', 'These are first-version operating principles and may be revised as the product and operations mature.')],
  ];

  return (
    <DigestShell>
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{localize(locale, 'الشروط', 'Terms')}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#101827]">{localize(locale, 'عرض هادئ، ومراجعة يدوية.', 'Quiet presentation, manual review.')}</h1>
        <p className="mt-5 text-base leading-8 text-[#334155]">
          {localize(
            locale,
            'هذه الصفحة تحدد حدود النسخة العامة من مهاد بلغة مختصرة وواضحة.',
            'This page sets the boundaries of Mihad’s public version in concise, clear language.'
          )}
        </p>
        <div className="mt-10 grid gap-4">
          {items.map(([title, body]) => (
            <section key={title} className="rounded-[8px] border border-[#D8DEE8] bg-white p-5">
              <h2 className="text-sm font-semibold text-[#101827]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#334155]">{body}</p>
            </section>
          ))}
        </div>
      </main>
    </DigestShell>
  );
}
