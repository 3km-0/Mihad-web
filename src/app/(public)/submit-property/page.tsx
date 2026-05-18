import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { OwnerSubmissionForm } from '@/components/private-digest/PrivateDigestForms';
import { DigestShell } from '@/components/private-digest/DigestShell';
import { localize } from '@/lib/private-digest';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Submit a Property — Mihad',
  description: 'Private owner or authorized representative intake for exceptional Saudi homes.',
  alternates: { canonical: absoluteUrl('/submit-property') },
};

export default async function SubmitPropertyPage() {
  const locale = await getLocale();

  return (
    <DigestShell>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c6f45]">{localize(locale, 'للملاك والممثلين', 'For owners and representatives')}</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-[#1e1a14]">
            {localize(locale, 'اعرض المنزل بهدوء، بدون سعر عام أو ضغط بيع.', 'Showcase the home quietly, with no public price or sale pressure.')}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#625746]">
            {localize(
              locale,
              'هذه ليست موافقة نشر. هي بداية مراجعة خاصة للجودة، الصلاحية، الخصوصية، والوسائط الأصلية قبل أي ظهور.',
              'This is not publication approval. It starts a private review of quality, authority, privacy, and original media before any presentation.'
            )}
          </p>
          <div className="mt-6 rounded-[8px] border border-[#ded6c7] bg-white p-4 text-sm leading-7 text-[#625746]">
            {localize(
              locale,
              'لا نحتاج عنوانًا دقيقًا أو سعرًا عامًا في هذه المرحلة. مهاد يتواصل يدويًا قبل أي خطوة لاحقة.',
              'No exact address or public price is needed at this stage. Mihad follows up manually before any next step.'
            )}
          </div>
        </section>
        <OwnerSubmissionForm locale={locale} />
      </main>
    </DigestShell>
  );
}
