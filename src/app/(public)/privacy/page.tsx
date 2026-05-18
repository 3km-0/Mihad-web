import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy — Mihad',
  description: 'How Mihad handles confidential owner submissions, private interest, and media review.',
  alternates: { canonical: absoluteUrl('/privacy') },
};

export default async function PrivacyPage() {
  const locale = await getLocale();

  const items = [
    [localize(locale, 'موافقة المالك', 'Owner consent'), localize(locale, 'لا ننشر صفحة عقار حقيقية قبل موافقة المالك أو ممثله على النص والصور ومستوى الظهور.', 'We do not publish a real property page before the owner or representative approves copy, images, and visibility level.')],
    [localize(locale, 'الاهتمام الخاص', 'Private interest'), localize(locale, 'بيانات المشترين تُستخدم لفحص الجدية قبل أي اقتراب من مالك. لا يوجد تواصل مباشر مع المالك من خلال الموقع.', 'Buyer details are used to screen seriousness before any owner approach. The site does not provide direct owner contact.')],
    [localize(locale, 'الوسائط الأصلية', 'Original media'), localize(locale, 'قد يراجع مهاد بيانات الصور داخليًا للتحقق من الأصالة والحداثة. لا تُعرض بيانات الوسائط أو الموقع الدقيق للعامة.', 'Mihad may privately review media metadata to support authenticity and recency checks. Media data and exact location are not displayed publicly.')],
    [localize(locale, 'المعلومات الحساسة', 'Sensitive details'), localize(locale, 'اسم المالك، العنوان الدقيق، السعر الخاص، والمستندات لا تظهر للعامة ولا تُشارك إلا ضمن مسار موافقة مناسب.', 'Owner name, exact address, private price guidance, and documents are not public and are shared only through an appropriate approval path.')],
  ];

  return (
    <DigestShell>
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6f45]">{localize(locale, 'الخصوصية', 'Privacy')}</p>
        <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-[#1e1a14]">{localize(locale, 'الخصوصية هي المنتج.', 'Privacy is the product.')}</h1>
        <p className="mt-5 text-lg leading-8 text-[#625746]">
          {localize(
            locale,
            'مهاد مبني على الهدوء والتحكم. هذه الصفحة تلخص مبادئ التعامل مع بيانات الملاك والمشترين والوسائط في النسخة الأولى.',
            'Mihad is built on discretion and control. This page summarizes how owner, buyer, and media data are handled in the first version.'
          )}
        </p>
        <div className="mt-10 grid gap-4">
          {items.map(([title, body]) => (
            <section key={title} className="rounded-[8px] border border-[#ded6c7] bg-white p-5">
              <h2 className="font-serif text-2xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#625746]">{body}</p>
            </section>
          ))}
        </div>
      </main>
    </DigestShell>
  );
}
