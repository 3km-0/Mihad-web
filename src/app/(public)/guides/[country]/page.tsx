import { notFound } from 'next/navigation';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/seo';
import { COUNTRY_GUIDE_CODES, getCountryGuide } from '@/lib/country-guides';
import { LegalDisclaimerFooter } from '@/components/legal/LegalDisclaimerFooter';

type Params = { country: string };

export async function generateStaticParams() {
  return COUNTRY_GUIDE_CODES.map((code) => ({ country: code.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const guide = getCountryGuide(country);
  if (!guide) {
    return { title: 'Country guide' };
  }
  return {
    title: `${guide.displayName} — Mihad buyer guide`,
    description: guide.oneLineSummary,
    alternates: {
      canonical: absoluteUrl(`/guides/${guide.countryCode.toLowerCase()}`),
    },
  };
}

export default async function CountryGuidePage({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const guide = getCountryGuide(country);
  if (!guide) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-text">
      <nav className="mb-6 text-sm text-text-soft">
        <Link href="/" className="hover:text-text">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/guides" className="hover:text-text">
          Guides
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text">{guide.displayName}</span>
      </nav>

      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Mihad buyer guide</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight">{guide.displayName}</h1>
        <p className="mt-3 text-lg text-text-soft">{guide.oneLineSummary}</p>
        {guide.operatorReviewRequired ? (
          <div className="mt-4 rounded-[12px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            <strong>Operator review required.</strong> This guide contains thresholds and programme details
            that must be verified by Mihad legal/operations before any number is presented as advice to a
            buyer. Treat every figure marked &quot;OPERATOR_REVIEW_REQUIRED&quot; as a placeholder pending
            authoritative confirmation.
          </div>
        ) : null}
      </header>

      <section className="prose prose-invert max-w-none">
        <h2 className="mb-3 text-xl font-semibold">Market context</h2>
        <p className="text-text-soft">{guide.marketContext}</p>
      </section>

      <div className="mt-10 space-y-8">
        {guide.sections.map((section) => (
          <section key={section.id}>
            <h2 className="mb-3 text-xl font-semibold">{section.heading}</h2>
            <ul className="space-y-2 text-text-soft">
              {section.body.map((line, idx) => (
                <li key={idx} className="leading-7">
                  {line}
                </li>
              ))}
            </ul>
            {section.operatorReviewRequired ? (
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-warning">
                Operator review required
              </p>
            ) : null}
            {section.citations && section.citations.length > 0 ? (
              <div className="mt-4 rounded-[10px] border border-border bg-surface-alt p-4 text-sm text-text-soft">
                <p className="mb-2 font-semibold text-text">Sources to verify</p>
                <ul className="space-y-1">
                  {section.citations.map((cite) => (
                    <li key={cite.url}>
                      <a href={cite.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {cite.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">Saudi compliance notes</h2>
        <ul className="space-y-2 text-text-soft">
          {guide.saudiComplianceNotes.map((note, idx) => (
            <li key={idx} className="leading-7">
              {note}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 rounded-[12px] border border-border bg-surface-alt p-4 text-xs text-text-soft">
        Last verified at:{' '}
        <span className="font-mono text-text">{guide.lastVerifiedAt || 'never (pending operator review)'}</span>
      </div>

      <LegalDisclaimerFooter />
    </main>
  );
}
