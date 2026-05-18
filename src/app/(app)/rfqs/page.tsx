import Link from 'next/link';
import { AlertTriangle, ArrowRight, Building2, Factory, MapPinned } from 'lucide-react';
import { AppHeader } from '@/components/layout';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type JsonRecord = Record<string, unknown>;

type RfqRow = {
  id: string;
  title: string;
  status: string;
  city: string | null;
  use_case: string | null;
  prefab_category: string | null;
  delivery_timeline: string | null;
  qualification_json: unknown;
  metadata_json: unknown;
  created_at: string;
  updated_at: string;
  workspace_id: string;
};

const groups = [
  { key: 'tenant', title: 'Tenant demand', subtitle: 'Businesses looking for sites', icon: Building2 },
  { key: 'landowner', title: 'Land supply', subtitle: 'Owners offering activation rights', icon: MapPinned },
  { key: 'supplier', title: 'Modular suppliers', subtitle: 'Units, pricing, and service regions', icon: Factory },
  { key: 'unknown', title: 'Needs review', subtitle: 'Older or incomplete requests', icon: AlertTriangle },
] as const;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function activationPayload(row: RfqRow) {
  const qualification = asRecord(row.qualification_json);
  const metadata = asRecord(row.metadata_json);
  const request = asRecord(metadata.activation_request ?? qualification.activation_request);
  const scoring = asRecord(metadata.activation_scoring ?? qualification.activation_scoring);
  const economics = asRecord(metadata.activation_economics ?? qualification.activation_economics);
  const partyType = String(request.party_type || scoring.party_type || 'unknown');
  return {
    partyType: partyType === 'tenant' || partyType === 'landowner' || partyType === 'supplier' ? partyType : 'unknown',
    request,
    scoring,
    economics,
    route: String(scoring.route_recommendation || 'review_required'),
    hard_stops: Array.isArray(scoring.hard_stops) ? scoring.hard_stops.map(String) : [],
    missing_fields: Array.isArray(scoring.missing_fields) ? scoring.missing_fields.map(String) : [],
    operatorScore: typeof scoring.operator_worthy_score === 'number' ? scoring.operator_worthy_score : null,
  };
}

export default async function RfqsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rfqs')
    .select('id,title,status,city,use_case,prefab_category,delivery_timeline,qualification_json,metadata_json,created_at,updated_at,workspace_id')
    .order('updated_at', { ascending: false })
    .limit(120);

  const rows = (data || []) as RfqRow[];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Activation RFQ queue"
        subtitle="Tenant, landowner, and supplier requests with deterministic scoring and next actions."
        actions={<Link href="/request-quote" className="rounded-zohal-sm border border-border px-3 py-2 text-sm font-semibold text-text-soft hover:bg-surface-alt">New request</Link>}
      />
      <main className="mx-auto grid max-w-7xl gap-6 p-4 md:p-6">
        {error ? (
          <div className="rounded-zohal border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            Could not load RFQs: {error.message}
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-4">
          {groups.map((group) => {
            const count = rows.filter((row) => activationPayload(row).partyType === group.key).length;
            const Icon = group.icon;
            return (
              <div key={group.key} className="rounded-zohal border border-border bg-surface p-4">
                <Icon className="h-5 w-5 text-accent" />
                <p className="mt-3 text-2xl font-semibold text-text">{count}</p>
                <p className="text-sm font-semibold text-text">{group.title}</p>
                <p className="mt-1 text-xs text-text-soft">{group.subtitle}</p>
              </div>
            );
          })}
        </div>

        {groups.map((group) => {
          const sectionRows = rows.filter((row) => activationPayload(row).partyType === group.key);
          if (!sectionRows.length) return null;
          return (
            <section key={group.key} className="rounded-zohal border border-border bg-surface">
              <div className="border-b border-border p-4">
                <h2 className="text-lg font-semibold text-text">{group.title}</h2>
                <p className="text-sm text-text-soft">{group.subtitle}</p>
              </div>
              <div className="divide-y divide-border">
                {sectionRows.map((row) => {
                  const payload = activationPayload(row);
                  return (
                    <article key={row.id} className="grid gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr_0.9fr_auto] lg:items-center">
                      <div>
                        <p className="text-sm font-semibold text-text">{row.title}</p>
                        <p className="mt-1 text-xs text-text-soft">{row.city || 'No city'} · {row.use_case || row.prefab_category || 'Activation request'} · {row.delivery_timeline || 'No timeline'}</p>
                        <p className="mt-2 text-xs text-text-soft">Updated {new Date(row.updated_at).toLocaleDateString()}</p>
                      </div>
                      <div className="grid gap-1 text-sm">
                        <span className="font-semibold text-text">Route: {payload.route}</span>
                        <span className="text-text-soft">Operator score: {payload.operatorScore ?? 'n/a'}</span>
                      </div>
                      <div className="grid gap-2 text-xs">
                        {payload.hard_stops.length ? (
                          <span className="rounded-zohal-sm bg-red-50 px-2 py-1 text-red-700">{payload.hard_stops.length} hard stop(s): {payload.hard_stops.slice(0, 2).join(', ')}</span>
                        ) : (
                          <span className="rounded-zohal-sm bg-emerald-50 px-2 py-1 text-emerald-700">No deterministic hard stops</span>
                        )}
                        {payload.missing_fields.length ? <span className="rounded-zohal-sm bg-amber-50 px-2 py-1 text-amber-700">Missing: {payload.missing_fields.slice(0, 3).join(', ')}</span> : null}
                      </div>
                      <Link href={`/workspaces/${row.workspace_id}`} className="inline-flex min-h-10 items-center gap-2 rounded-zohal-sm bg-accent px-3 text-sm font-semibold text-white">
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {!rows.length && !error ? (
          <div className="rounded-zohal border border-dashed border-border bg-surface p-8 text-center text-text-soft">
            No activation requests yet. Public submissions will appear here grouped by party type.
          </div>
        ) : null}
      </main>
    </div>
  );
}
