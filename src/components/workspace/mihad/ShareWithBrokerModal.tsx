'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui';

// PDPL Article 11 (cross-border transfer) requires an explicit, informed, and
// revocable consent action before personal data is transferred outside Saudi
// Arabia. The Mihad buyer-packet "share with broker" flow IS that transfer for
// every non-SA destination, so this modal is the canonical consent surface.
// Keep the disclosure copy here in sync with
// `LegalDisclaimerFooter.tsx` and the
// `Mihad_Privacy_Compliance_Checklist.md` operator gate.

export type ShareWithBrokerModalBroker = {
  id: string;
  display_name: string;
  country_code: string;
  city?: string | null;
  response_sla_minutes?: number | null;
};

export type SharePacketModalPartner = ShareWithBrokerModalBroker;

export type ShareWithBrokerModalPacket = {
  id: string;
  version?: number | null;
  expires_at?: string | null;
  snapshot_json?: Record<string, unknown> | null;
};

export type SharePacketModalPacket = ShareWithBrokerModalPacket;

interface ShareWithBrokerModalProps {
  broker: ShareWithBrokerModalBroker;
  packet: ShareWithBrokerModalPacket;
  busy?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

type SharePacketModalProps = ShareWithBrokerModalProps;

function formatDateLocalized(iso: string | null | undefined, locale: string) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// Translated, country-aware label e.g. "United Arab Emirates" / "الإمارات".
function countryLabel(t: ReturnType<typeof useTranslations>, code: string) {
  const upper = code.toUpperCase();
  const fallbackMap: Record<string, string> = {
    AE: 'United Arab Emirates',
    TR: 'Türkiye',
    GR: 'Greece',
    ES: 'Spain',
    SA: 'Saudi Arabia',
    UK: 'United Kingdom',
  };
  return t(`mihad.country.${upper}`, { default: fallbackMap[upper] || upper });
}

export function ShareWithBrokerModal({
  broker,
  packet,
  busy = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ShareWithBrokerModalProps) {
  const t = useTranslations('workspaceCockpitPage');
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [busy, onCancel]);

  const snapshot = (packet.snapshot_json as Record<string, unknown> | null) ?? {};
  const targetCountries = Array.isArray(snapshot.target_country_codes)
    ? (snapshot.target_country_codes as string[])
    : [];
  const budgetBand = typeof snapshot.budget_band === 'string' ? snapshot.budget_band : null;
  const purpose = typeof snapshot.purpose === 'string' ? snapshot.purpose : null;
  const timeline = typeof snapshot.timeline === 'string' ? snapshot.timeline : null;
  const liquidityClass = typeof snapshot.liquidity_class === 'string' ? snapshot.liquidity_class : null;
  const buyerType = typeof snapshot.buyer_type === 'string' ? snapshot.buyer_type : null;
  const verificationConfidence = typeof snapshot.verification_confidence === 'string'
    ? snapshot.verification_confidence
    : null;

  const expiryLabel = formatDateLocalized(packet.expires_at, locale);
  const isCrossBorder = broker.country_code.toUpperCase() !== 'SA';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-broker-title"
      dir={dir}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={busy ? undefined : onCancel}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-[var(--shadowMd)]">
        <div className="border-b border-border bg-[image:var(--panel-bg)] px-5 py-4 sm:px-6">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            {t('mihad.shareModalEyebrow', { default: 'Consent to share' })}
          </p>
          <h2 id="share-broker-title" className="mt-2 text-xl font-semibold text-text">
            {t('mihad.shareModalTitle', {
              default: 'Share your buyer packet with {broker}',
              broker: broker.display_name,
            })}
          </h2>
          <p className="mt-2 text-sm text-text-soft">
            {t('mihad.shareModalSubtitle', {
              default:
                'Review what will be sent. We only share derived readiness signals — never the underlying documents.',
            })}
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <section className="rounded-[14px] border border-border bg-surface-alt px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-soft">
              {t('mihad.shareModalBrokerSection', { default: 'Broker' })}
            </p>
            <p className="mt-1 text-base font-semibold text-text">{broker.display_name}</p>
            <p className="mt-0.5 text-sm text-text-soft">
              {[broker.city, countryLabel(t, broker.country_code)].filter(Boolean).join(' · ')}
            </p>
            {broker.response_sla_minutes ? (
              <p className="mt-1 text-xs text-text-soft">
                {t('mihad.shareModalSla', {
                  default: 'Response SLA: {minutes} minutes',
                  minutes: String(broker.response_sla_minutes),
                })}
              </p>
            ) : null}
          </section>

          <section className="rounded-[14px] border border-border bg-surface-alt px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-soft">
              {t('mihad.shareModalScopeSection', { default: 'Fields included in this share' })}
            </p>
            <ul className="mt-2 grid gap-1.5 text-sm text-text">
              {targetCountries.length > 0 ? (
                <li>
                  <span className="text-text-soft">{t('mihad.shareModalScopeMarkets', { default: 'Markets' })}: </span>
                  {targetCountries.map((c) => countryLabel(t, c)).join(', ')}
                </li>
              ) : null}
              {budgetBand ? (
                <li>
                  <span className="text-text-soft">{t('mihad.shareModalScopeBudget', { default: 'Budget band' })}: </span>
                  {budgetBand}
                </li>
              ) : null}
              {purpose ? (
                <li>
                  <span className="text-text-soft">{t('mihad.shareModalScopePurpose', { default: 'Purpose' })}: </span>
                  {purpose}
                </li>
              ) : null}
              {timeline ? (
                <li>
                  <span className="text-text-soft">{t('mihad.shareModalScopeTimeline', { default: 'Timeline' })}: </span>
                  {timeline}
                </li>
              ) : null}
              {liquidityClass ? (
                <li>
                  <span className="text-text-soft">{t('mihad.shareModalScopeLiquidity', { default: 'Liquidity class' })}: </span>
                  {liquidityClass}
                </li>
              ) : null}
              {buyerType ? (
                <li>
                  <span className="text-text-soft">{t('mihad.shareModalScopeBuyerType', { default: 'Buyer type' })}: </span>
                  {buyerType}
                </li>
              ) : null}
              {verificationConfidence ? (
                <li>
                  <span className="text-text-soft">{t('mihad.shareModalScopeConfidence', { default: 'Verification confidence' })}: </span>
                  {verificationConfidence}
                </li>
              ) : null}
            </ul>
            <p className="mt-3 text-xs leading-5 text-text-soft">
              {t('mihad.shareModalScopeExclusions', {
                default:
                  'Never shared: your name, contact details, ID/passport numbers, raw bank statements, raw KYC documents, exact budget figures.',
              })}
            </p>
          </section>

          {isCrossBorder ? (
            <section className="rounded-[14px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-warning">
                {t('mihad.shareModalCrossBorderEyebrow', { default: 'Cross-border transfer · PDPL Art. 11' })}
              </p>
              <p className="mt-2 leading-6">
                {t('mihad.shareModalCrossBorderBody', {
                  default:
                    'This broker is outside Saudi Arabia. By confirming, you authorise Mihad to transfer the derived signals above to {country} under PDPL Article 11. The broker has signed our data-processing agreement and is bound to use the signals only to qualify properties for you.',
                  country: countryLabel(t, broker.country_code),
                })}
              </p>
            </section>
          ) : null}

          <section className="rounded-[14px] border border-border bg-surface-alt px-4 py-3 text-sm text-text-soft">
            <p>
              {t('mihad.shareModalRevocable', {
                default:
                  'This consent is revocable at any time from the Activate tab. Revocation is logged against the broker scorecard.',
              })}
            </p>
            {expiryLabel ? (
              <p className="mt-1.5">
                {t('mihad.shareModalExpiry', {
                  default: 'Packet expires on {date} unless renewed.',
                  date: expiryLabel,
                })}
              </p>
            ) : null}
          </section>

          {errorMessage ? (
            <p className="rounded-[12px] border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            {t('mihad.shareModalCancel', { default: 'Cancel' })}
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm} disabled={busy}>
            {busy
              ? t('mihad.shareModalConfirming', { default: 'Confirming…' })
              : t('mihad.shareModalConfirm', { default: 'I consent — share packet' })}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SharePacketModal(props: SharePacketModalProps) {
  return <ShareWithBrokerModal {...props} />;
}
