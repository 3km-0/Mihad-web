import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Terms — Mihad',
  description: 'Mihad private digest terms for confidential inquiries, owner consent, and manual review.',
  alternates: { canonical: absoluteUrl('/terms') },
};

export default async function TermsPage() {
  const locale = await getLocale();

  const items = [
    [localize(locale, 'ليست دعوة بيع عامة', 'Not a public sale invitation'), localize(locale, 'ظهور أي صفحة لا يعني أن المالك ملزم بالبيع أو الرد أو قبول أي اهتمام.', 'A page appearing on Mihad does not mean the owner is obliged to sell, respond, or accept any interest.')],
    [localize(locale, 'الاهتمام غير ملزم', 'Interest is non-binding'), localize(locale, 'أي نطاق إرشادي أو اهتمام خاص يُستخدم للفحص الأولي فقط ولا يصبح عرضًا رسميًا إلا من خلال مستندات مناسبة.', 'Any indicative range or confidential interest is used only for initial screening and is not a formal offer unless documented appropriately.')],
    [localize(locale, 'المراجعة اليدوية', 'Manual review'), localize(locale, 'قد يرفض مهاد أو يؤخر أو يطلب معلومات إضافية من أي مالك أو مشترٍ لحماية الخصوصية وجودة المسار.', 'Mihad may reject, delay, or request more information from any owner or buyer to protect privacy and process quality.')],
    [localize(locale, 'المتطلبات النظامية', 'Regulatory requirements'), localize(locale, 'أي خطوة وساطة أو عمولة أو تفويض أو إفصاح يجب أن تكون متوافقة ومراجعة من مختصين قبل التعامل الحي.', 'Any brokerage step, commission, mandate, or disclosure must be compliant and professionally reviewed before live transaction work.')],
  ];

  return (
    <DigestShell>
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6f45]">{localize(locale, 'الشروط', 'Terms')}</p>
        <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-[#1e1a14]">{localize(locale, 'مهاد يعمل بهدوء وبمراجعة يدوية.', 'Mihad works quietly and manually.')}</h1>
        <p className="mt-5 text-lg leading-8 text-[#625746]">
          {localize(
            locale,
            'هذه مبادئ نسخة MVP وليست مستندًا قانونيًا نهائيًا. يجب تحويلها إلى شروط معتمدة قبل تشغيل معاملات حية.',
            'These are MVP principles, not final legal terms. They should be converted into approved terms before live transaction handling.'
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
