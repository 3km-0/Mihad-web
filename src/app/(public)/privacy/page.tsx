import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy — Mihad',
  description: 'How Mihad handles editorial space submissions, notes, and media review.',
  alternates: { canonical: absoluteUrl('/privacy') },
};

export default async function PrivacyPage() {
  const locale = await getLocale();

  const items = [
    [localize(locale, 'الموافقة التحريرية', 'Editorial approval'), localize(locale, 'لا ننشر مساحة حقيقية قبل اعتماد النص والصورة ومستوى الظهور.', 'A real space is not published before copy, image, and visibility level are approved.')],
    [localize(locale, 'الوسائط', 'Media'), localize(locale, 'قد تُراجع بيانات الصور داخليًا للتحقق من الجودة والحداثة. لا تُعرض بيانات الملفات في الصفحة العامة.', 'Image data may be reviewed privately for quality and recency. File data is not displayed on the public page.')],
    [localize(locale, 'الرسائل', 'Messages'), localize(locale, 'رسائل Make an offer تصل إلى فريق مهاد للمراجعة اليدوية، ولا تظهر على الصفحة.', 'Make an offer messages go to the Mihad team for manual review and do not appear on the page.')],
    [localize(locale, 'التفاصيل المحفوظة', 'Held details'), localize(locale, 'ما لا يخدم القراءة البصرية يبقى خارج العرض العام.', 'Anything that does not serve the visual reading stays outside the public presentation.')],
  ];

  return (
    <DigestShell>
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4E89]">{localize(locale, 'الخصوصية', 'Privacy')}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#101827]">{localize(locale, 'الهدوء جزء من طريقة العرض.', 'Quiet is part of the presentation.')}</h1>
        <p className="mt-5 text-base leading-8 text-[#334155]">
          {localize(
            locale,
            'هذه الصفحة تلخص مبادئ النسخة الأولى في التعامل مع الصور، النصوص، والرسائل اليدوية.',
            'This page summarizes the first version principles for handling images, copy, and manual messages.'
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
