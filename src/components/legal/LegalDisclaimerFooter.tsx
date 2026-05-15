// Global legal disclaimer used by Mihad surfaces (country guides,
// buyer-desk Activate tab, broker introductions). The wording is
// intentionally conservative; do NOT remove the brokerage/legal/tax
// advice carve-outs without sign-off from Mihad legal.
//
// Where the user is a Saudi resident, the PDPL reference is mandatory.

export function LegalDisclaimerFooter({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`mt-10 rounded-[14px] border border-border bg-surface-alt px-5 py-4 text-xs leading-6 text-text-soft ${className}`}
      aria-label="Mihad legal disclaimer"
    >
      <p>
        <strong className="text-text">Disclaimer.</strong>{' '}
        Mihad is a buyer-readiness and introduction network. Mihad does not provide brokerage, legal,
        tax, immigration, or investment advice and is not a licensed real-estate agent in any of the
        markets it covers. Information shown about residency programmes, transaction costs, and
        regulatory requirements may be incomplete or out of date; you must verify any threshold,
        rate, or programme rule with the cited authority and licensed local counsel before relying
        on it.
      </p>
      <p className="mt-2">
        For Saudi residents: outbound transfers and foreign-property holdings remain subject to SAMA
        reporting and any applicable disclosure regimes. Mihad processes your personal data under the
        Saudi Personal Data Protection Law (PDPL). We share only derived readiness signals with
        vetted brokers, never the underlying documents, and each share is logged as an explicit
        consent action you can revoke at any time.
      </p>
    </footer>
  );
}
