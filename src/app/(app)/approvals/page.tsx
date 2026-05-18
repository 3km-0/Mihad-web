import Link from 'next/link';
import { CheckCircle2, Clock3, ExternalLink, ShieldAlert, XCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function valueText(value: unknown, fallback = 'Not provided') {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

const statusConfig = {
  pending: { title: 'Pending approval', icon: Clock3, className: 'bg-amber-50 text-amber-700' },
  approved: { title: 'Approved', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  rejected: { title: 'Rejected', icon: XCircle, className: 'bg-red-50 text-red-700' },
  executed: { title: 'Executed', icon: ExternalLink, className: 'bg-blue-50 text-blue-700' },
} as const;

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('approval_gates')
    .select('id,action_type,approval_status,draft_payload_json,execution_result_json,created_at,updated_at,approved_at,executed_at,workspace_id,rfq_id,partner_id,match_id,rfqs(id,title,city,workspace_id,metadata_json),partners(id,display_name,partner_kind,city)')
    .order('created_at', { ascending: false })
    .limit(100);

  const gates = (data || []) as Array<Record<string, unknown>>;
  const groups = Object.entries(statusConfig);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Approval gates"
        subtitle="Outbound supplier, landowner, and broker actions require explicit approval before contact."
        actions={<Link href="/supplier-matches" className="rounded-zohal-sm border border-border px-3 py-2 text-sm font-semibold text-text-soft hover:bg-surface-alt">Match board</Link>}
      />
      <main className="mx-auto grid max-w-7xl gap-6 p-4 md:p-6">
        <div className="rounded-zohal border border-border bg-surface p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 text-accent" />
            <div>
              <p className="font-semibold text-text">Operator discipline</p>
              <p className="mt-1 text-sm text-text-soft">
                These gates are the control point before contacting suppliers, landowners, brokers, or sharing buyer packets. Public/operator summaries should stay derived-only unless consent is explicit.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-zohal border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            Could not load approval gates: {error.message}
          </div>
        ) : null}

        {groups.map(([status, config]) => {
          const rows = gates.filter((gate) => String(gate.approval_status || 'pending') === status);
          const Icon = config.icon;
          return (
            <section key={status} className="rounded-zohal border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="text-lg font-semibold text-text">{config.title}</h2>
                  <p className="text-sm text-text-soft">{rows.length} gate(s)</p>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-zohal-sm px-3 py-1 text-xs font-semibold ${config.className}`}>
                  <Icon className="h-4 w-4" />
                  {status}
                </span>
              </div>
              <div className="divide-y divide-border">
                {rows.map((gate) => {
                  const rfq = asRecord(gate.rfqs);
                  const partner = asRecord(gate.partners);
                  const draft = asRecord(gate.draft_payload_json);
                  const hardStops = Array.isArray(draft.hard_stops) ? draft.hard_stops.map(String) : [];
                  return (
                    <article key={String(gate.id)} className="grid gap-4 p-4 lg:grid-cols-[1fr_0.8fr_0.9fr_auto] lg:items-center">
                      <div>
                        <p className="text-sm font-semibold text-text">{valueText(gate.action_type, 'outbound_action')}</p>
                        <p className="mt-1 text-xs text-text-soft">{valueText(rfq.title, 'No RFQ linked')} · {valueText(rfq.city, 'No city')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{valueText(partner.display_name, 'No partner linked')}</p>
                        <p className="mt-1 text-xs text-text-soft">{valueText(partner.partner_kind, 'partner')} · {valueText(partner.city, 'Saudi Arabia')}</p>
                      </div>
                      <div className="grid gap-2 text-xs text-text-soft">
                        <span>Reason: {valueText(draft.reason ?? draft.summary, 'Approval reason not summarized')}</span>
                        {hardStops.length ? <span className="rounded-zohal-sm bg-red-50 px-2 py-1 text-red-700">Hard stops present: {hardStops.slice(0, 2).join(', ')}</span> : <span className="rounded-zohal-sm bg-emerald-50 px-2 py-1 text-emerald-700">No hard stops declared in gate</span>}
                      </div>
                      {rfq.workspace_id ? (
                        <Link href={`/workspaces/${rfq.workspace_id}`} className="inline-flex min-h-10 items-center rounded-zohal-sm bg-accent px-3 text-sm font-semibold text-white">
                          Review
                        </Link>
                      ) : (
                        <span className="text-xs text-text-soft">No workspace</span>
                      )}
                    </article>
                  );
                })}
                {!rows.length ? (
                  <div className="p-5 text-sm text-text-soft">No {config.title.toLowerCase()} gates.</div>
                ) : null}
              </div>
            </section>
          );
        })}

        {!gates.length && !error ? (
          <div className="rounded-zohal border border-dashed border-border bg-surface p-8 text-center text-text-soft">
            No approval gates yet. Outbound actions created from the match board or request detail should appear here first.
          </div>
        ) : null}
      </main>
    </div>
  );
}
