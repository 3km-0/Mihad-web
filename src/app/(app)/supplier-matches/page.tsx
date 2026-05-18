import Link from 'next/link';
import { ArrowRight, Factory, ShieldCheck } from 'lucide-react';
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

export default async function SupplierMatchesPage() {
  const supabase = await createClient();
  const [{ data: matchRows, error: matchError }, { data: supplierRows, error: supplierError }, { data: landRows, error: landError }] = await Promise.all([
    supabase
      .from('rfq_supplier_matches')
      .select('id,status,quote_status,response_sla_at,buyer_recommendation_json,supplier_response_json,created_at,rfq_id,partner_id,prefab_model_id,rfqs(id,title,city,use_case,workspace_id,metadata_json),partners(id,display_name,city,partner_kind,response_sla_minutes,commercial_terms_json),prefab_models(id,model_name,model_type,size_sqm,price_range_json)')
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('partners')
      .select('id,display_name,city,partner_kind,status,response_sla_minutes,commercial_terms_json,metadata_json,updated_at')
      .eq('partner_kind', 'prefab_supplier')
      .order('updated_at', { ascending: false })
      .limit(40),
    supabase
      .from('sourced_options')
      .select('id,title,summary,source_name,source_url,city,district,area_sqm,price_amount,price_currency,status,workspace_id,rfq_id,evidence_snapshot_json,score_json,updated_at')
      .eq('source_kind', 'portal')
      .order('updated_at', { ascending: false })
      .limit(40),
  ]);

  const matches = (matchRows || []) as Array<Record<string, unknown>>;
  const suppliers = (supplierRows || []) as Array<Record<string, unknown>>;
  const landCandidates = (landRows || []) as Array<Record<string, unknown>>;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Supplier and land match board"
        subtitle="Existing partner and sourced-option primitives, with all outbound contact still approval-gated."
        actions={<Link href="/approvals" className="rounded-zohal-sm border border-border px-3 py-2 text-sm font-semibold text-text-soft hover:bg-surface-alt">Approval gates</Link>}
      />
      <main className="mx-auto grid max-w-7xl gap-6 p-4 md:p-6">
        {matchError || supplierError || landError ? (
          <div className="rounded-zohal border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            Match board loaded with warnings: {[matchError?.message, supplierError?.message, landError?.message].filter(Boolean).join(' ')}
          </div>
        ) : null}

        <section className="rounded-zohal border border-border bg-surface">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-semibold text-text">RFQ supplier matches</h2>
            <p className="text-sm text-text-soft">Use this board to review shortlist fit before creating an outbound approval gate.</p>
          </div>
          <div className="divide-y divide-border">
            {matches.map((match) => {
              const rfq = asRecord(match.rfqs);
              const partner = asRecord(match.partners);
              const model = asRecord(match.prefab_models);
              const recommendation = asRecord(match.buyer_recommendation_json);
              const supplierResponse = asRecord(match.supplier_response_json);
              return (
                <article key={String(match.id)} className="grid gap-4 p-4 lg:grid-cols-[1fr_0.8fr_0.8fr_auto] lg:items-center">
                  <div>
                    <p className="text-sm font-semibold text-text">{valueText(rfq.title, 'Untitled RFQ')}</p>
                    <p className="mt-1 text-xs text-text-soft">{valueText(rfq.city, 'No city')} · {valueText(rfq.use_case, 'No use case')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{valueText(partner.display_name, 'Supplier pending')}</p>
                    <p className="mt-1 text-xs text-text-soft">{valueText(model.model_name, 'No model selected')} · {valueText(model.model_type, 'Unit type pending')}</p>
                  </div>
                  <div className="grid gap-1 text-xs text-text-soft">
                    <span>Status: {valueText(match.status)}</span>
                    <span>Quote: {valueText(match.quote_status)}</span>
                    <span>Fit note: {valueText(recommendation.summary ?? supplierResponse.summary, 'No fit note yet')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rfq.workspace_id ? (
                      <Link href={`/workspaces/${rfq.workspace_id}`} className="inline-flex min-h-10 items-center gap-2 rounded-zohal-sm bg-accent px-3 text-sm font-semibold text-white">
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                    <Link href="/approvals" className="inline-flex min-h-10 items-center rounded-zohal-sm border border-border px-3 text-sm font-semibold text-text-soft">
                      Gate contact
                    </Link>
                  </div>
                </article>
              );
            })}
            {!matches.length ? (
              <div className="p-6 text-sm text-text-soft">
                No RFQ supplier match rows yet. Partner supply below can still be reviewed before a shortlist is created.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-zohal border border-border bg-surface">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-semibold text-text">Operator land candidates</h2>
            <p className="text-sm text-text-soft">Commercial land leads from source runs stay here for review; they are never anonymous public homepage results.</p>
          </div>
          <div className="divide-y divide-border">
            {landCandidates.map((candidate) => {
              const evidence = asRecord(candidate.evidence_snapshot_json);
              const score = asRecord(candidate.score_json);
              return (
                <article key={String(candidate.id)} className="grid gap-4 p-4 lg:grid-cols-[1fr_0.8fr_0.8fr_auto] lg:items-center">
                  <div>
                    <p className="text-sm font-semibold text-text">{valueText(candidate.title, 'Commercial land candidate')}</p>
                    <p className="mt-1 text-xs text-text-soft">{[candidate.district, candidate.city].map((item) => valueText(item, '')).filter(Boolean).join(', ') || 'Location pending'}</p>
                  </div>
                  <div className="grid gap-1 text-xs text-text-soft">
                    <span>Source: {valueText(candidate.source_name)}</span>
                    <span>Area: {candidate.area_sqm ? `${candidate.area_sqm} sqm` : 'Not provided'}</span>
                    <span>Price/rent signal: {candidate.price_amount ? `${candidate.price_amount} ${valueText(candidate.price_currency, 'SAR')}` : 'Not provided'}</span>
                  </div>
                  <div className="grid gap-1 text-xs text-text-soft">
                    <span>Status: {valueText(candidate.status)}</span>
                    <span>Confidence: {valueText(score.confidence ?? evidence.confidence)}</span>
                    <span>Evidence: limited snapshot only</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {candidate.workspace_id ? (
                      <Link href={`/workspaces/${candidate.workspace_id}`} className="inline-flex min-h-10 items-center gap-2 rounded-zohal-sm bg-accent px-3 text-sm font-semibold text-white">
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                    <Link href="/approvals" className="inline-flex min-h-10 items-center rounded-zohal-sm border border-border px-3 text-sm font-semibold text-text-soft">
                      Gate outreach
                    </Link>
                  </div>
                </article>
              );
            })}
            {!landCandidates.length ? (
              <div className="p-6 text-sm text-text-soft">
                No operator-reviewed land candidates yet. Run land sourcing from a qualified tenant request to populate this board.
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-zohal border border-border bg-surface">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-semibold text-text">Supplier panel</h2>
            <p className="text-sm text-text-soft">Lease/sale terms are summarized only from structured partner metadata, not private documents.</p>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {suppliers.map((supplier) => {
              const terms = asRecord(supplier.commercial_terms_json);
              const metadata = asRecord(supplier.metadata_json);
              return (
                <article key={String(supplier.id)} className="rounded-zohal border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{valueText(supplier.display_name, 'Unnamed supplier')}</p>
                      <p className="mt-1 text-xs text-text-soft">{valueText(supplier.city, 'Saudi Arabia')} · {valueText(supplier.status, 'status pending')}</p>
                    </div>
                    <Factory className="h-5 w-5 text-accent" />
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-text-soft">
                    <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Contact requires approval gate</span>
                    <span>Lease terms: {valueText(terms.lease_terms ?? metadata.lease_terms)}</span>
                    <span>Install/removal: {valueText(terms.installation_terms ?? metadata.installation_terms)}</span>
                    <span>Response SLA: {supplier.response_sla_minutes ? `${supplier.response_sla_minutes} minutes` : 'Not set'}</span>
                  </div>
                </article>
              );
            })}
            {!suppliers.length ? (
              <div className="rounded-zohal border border-dashed border-border p-6 text-sm text-text-soft md:col-span-2 xl:col-span-3">
                No published prefab suppliers are visible to this workspace yet.
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
