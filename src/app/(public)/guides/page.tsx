import Link from 'next/link';
import { absoluteUrl } from '@/lib/seo';
import { COUNTRY_GUIDES, COUNTRY_GUIDE_CODES } from '@/lib/country-guides';
import { LegalDisclaimerFooter } from '@/components/legal/LegalDisclaimerFooter';

export async function generateMetadata() {
  return {
    title: 'Country guides — Mihad',
    description:
      'Cross-border property buying guides for Saudi buyers: UAE, Türkiye, Greece, and Spain. Source-cited residency, due diligence, and Saudi compliance notes.',
    alternates: {
      canonical: absoluteUrl('/guides'),
    },
  };
}

export default function GuidesIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-text">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Mihad buyer guides</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight">Cross-border property guides</h1>
        <p className="mt-3 text-lg text-text-soft">
          Practical, source-cited notes for Saudi buyers exploring UAE, Türkiye, Greece, and Spain.
          Every threshold and tax rate is marked for operator verification — Mihad does not provide
          legal, tax, or brokerage advice.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {COUNTRY_GUIDE_CODES.filter((code) => code !== 'SA').map((code) => {
          const guide = COUNTRY_GUIDES[code];
          return (
            <Link
              key={code}
              href={`/guides/${code.toLowerCase()}`}
              className="block rounded-[14px] border border-border bg-surface-alt p-5 transition hover:border-accent/30"
            >
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-soft">{code}</p>
              <h2 className="mt-2 text-xl font-semibold text-text">{guide.displayName}</h2>
              <p className="mt-2 text-sm text-text-soft">{guide.oneLineSummary}</p>
            </Link>
          );
        })}
      </div>

      <LegalDisclaimerFooter />
    </main>
  );
}
