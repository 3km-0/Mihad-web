import { notFound, redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const OPERATOR_ALLOWLIST_RAW = process.env.MIHAD_OPERATOR_USER_IDS || process.env.OPERATOR_USER_IDS || '';
const OPERATOR_USER_IDS = new Set(
  OPERATOR_ALLOWLIST_RAW.split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

type BrokerPartnerRow = {
  id: string;
  display_name: string;
  legal_name: string | null;
  country_code: string;
  city: string | null;
  languages: string[] | null;
  status: string;
  privacy_agreement_signed_at: string | null;
  response_sla_minutes: number | null;
  licensing_json: Record<string, unknown> | null;
  markets_covered_json: Record<string, unknown> | null;
  co_brokerage_terms_json: Record<string, unknown> | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type BrokerScorecardRow = {
  broker_partner_id: string;
  response_speed_pts: number;
  shortlist_quality_pts: number;
  buyer_satisfaction_pts: number;
  offer_to_close_pts: number;
  compliance_pts: number;
  composite_score: number;
  inputs_json: Record<string, unknown> | null;
  computed_at: string;
};

type BrokerEventRow = {
  id: string;
  event_type: string;
  response_latency_seconds: number | null;
  outcome: string | null;
  occurred_at: string;
};

async function loadBroker(brokerId: string) {
  const service = await createServiceClient();
  const [{ data: broker }, { data: scorecard }, { data: events }] = await Promise.all([
    (service as any).from('partners').select('*').eq('id', brokerId).maybeSingle(),
    (service as any).from('partner_scorecards').select('*').eq('partner_id', brokerId).maybeSingle(),
    (service as any)
      .from('partner_events')
      .select('id, event_type, response_latency_seconds, outcome, occurred_at')
      .eq('partner_id', brokerId)
      .order('occurred_at', { ascending: false })
      .limit(25),
  ]);
  return {
    broker: broker as BrokerPartnerRow | null,
    scorecard: scorecard as BrokerScorecardRow | null,
    events: (events || []) as BrokerEventRow[],
  };
}

export default async function OperatorBrokerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  if (OPERATOR_USER_IDS.size > 0 && !OPERATOR_USER_IDS.has(session.user.id)) {
    redirect('/home');
  }

  const { broker, scorecard, events } = await loadBroker(id);
  if (!broker) return notFound();

  const pillars: Array<{ label: string; pts: number; max: number }> = scorecard
    ? [
        { label: 'Response speed', pts: scorecard.response_speed_pts, max: 25 },
        { label: 'Shortlist quality', pts: scorecard.shortlist_quality_pts, max: 20 },
        { label: 'Buyer satisfaction', pts: scorecard.buyer_satisfaction_pts, max: 20 },
        { label: 'Offer-to-close', pts: scorecard.offer_to_close_pts, max: 20 },
        { label: 'Compliance', pts: scorecard.compliance_pts, max: 15 },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10 text-text">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-soft">Operator preview</p>
        <h1 className="text-3xl font-semibold">{broker.display_name}</h1>
        <p className="text-sm text-text-soft">
          {broker.country_code} {broker.city ? `· ${broker.city}` : null} · Status: <span className="font-medium text-text">{broker.status}</span>
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface-alt p-6 sm:grid-cols-2">
        <Detail label="Legal name" value={broker.legal_name || '—'} />
        <Detail label="Languages" value={broker.languages?.join(', ') || '—'} />
        <Detail
          label="Privacy agreement"
          value={broker.privacy_agreement_signed_at ? new Date(broker.privacy_agreement_signed_at).toLocaleDateString() : 'Not signed'}
        />
        <Detail
          label="Response SLA"
          value={broker.response_sla_minutes ? `${broker.response_sla_minutes} minutes` : '—'}
        />
        <Detail label="Contact email" value={broker.contact_email || '—'} />
        <Detail label="Contact phone" value={broker.contact_phone || '—'} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Scorecard</h2>
        {scorecard ? (
          <div className="rounded-2xl border border-border bg-surface-alt p-6">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-semibold">{scorecard.composite_score}</span>
              <span className="text-sm text-text-soft">/ 100 composite</span>
              <span className="ml-auto text-xs text-text-soft">
                Updated {new Date(scorecard.computed_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {pillars.map((pillar) => (
                <div key={pillar.label} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-text-soft">{pillar.label}</span>
                  <div className="h-2 flex-1 rounded-full bg-border">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${Math.round((pillar.pts / pillar.max) * 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm tabular-nums">
                    {pillar.pts}/{pillar.max}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-soft">
            No scorecard computed yet. The daily cron will populate it once events arrive.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recent events</h2>
        {events.length === 0 ? (
          <p className="text-sm text-text-soft">No events logged.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface-alt">
            {events.map((event) => (
              <li key={event.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                <span className="w-40 font-medium">{event.event_type}</span>
                <span className="text-text-soft">{new Date(event.occurred_at).toLocaleString()}</span>
                {event.response_latency_seconds != null ? (
                  <span className="ml-auto text-text-soft">
                    {Math.round(event.response_latency_seconds / 60)}m latency
                  </span>
                ) : null}
                {event.outcome ? <span className="text-text-soft">· {event.outcome}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">{label}</p>
      <p className="text-sm text-text">{value}</p>
    </div>
  );
}
