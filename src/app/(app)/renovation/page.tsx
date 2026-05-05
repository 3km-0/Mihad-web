'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileUp,
  Home,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';

import { DocumentUploadModal } from '@/components/document/DocumentUploadModal';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button, EmptyState, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  acquisitionMetadataNumber,
  acquisitionMetadataString,
  displayTitleForOpportunity,
} from '@/lib/acquisition-workspace-ui';
import { createClient } from '@/lib/supabase/client';
import { cn, formatRelativeTime } from '@/lib/utils';
import { invokeZohalBackendJson } from '@/lib/zohal-backend';

type WorkspaceRow = {
  id: string;
  name: string;
  description?: string | null;
  analysis_brief?: string | null;
  org_id?: string | null;
  owner_id?: string | null;
  updated_at?: string | null;
};

type OpportunityRow = {
  id: string;
  workspace_id?: string | null;
  title?: string | null;
  stage?: string | null;
  summary?: string | null;
  area_summary?: string | null;
  metadata_json?: Record<string, unknown> | null;
  renovation_capex_json?: RenovationCapexEstimate | null;
  renovation_capex_updated_at?: string | null;
  renovation_rate_card_id?: string | null;
  updated_at?: string | null;
};

type RenovationCapexLine = {
  name?: string | null;
  category?: string | null;
  category_code?: string | null;
  base_total?: number | null;
};

type RenovationNotice = {
  type?: string | null;
  label?: string | null;
  message?: string | null;
  description?: string | null;
  suggested_action?: string | null;
};

type RenovationCapexEstimate = {
  planning_estimate_label?: string | null;
  pricing_status?: string | null;
  city?: string | null;
  city_fallback_used?: boolean | null;
  currency?: string | null;
  strategy?: string | null;
  finish_level?: string | null;
  low_total?: number | null;
  base_total?: number | null;
  high_total?: number | null;
  confidence_score?: number | null;
  confidence_label?: string | null;
  rate_card_id?: string | null;
  line_items?: RenovationCapexLine[];
  assumptions?: RenovationNotice[];
  risks?: RenovationNotice[];
  missing_evidence?: RenovationNotice[];
  generated_at?: string | null;
};

type RenovationEstimateEventRow = {
  id: string;
  event_type?: string | null;
  low_total?: number | null;
  base_total?: number | null;
  high_total?: number | null;
  confidence_score?: number | null;
  created_at?: string | null;
};

type CapexEstimateResponse = {
  estimate?: RenovationCapexEstimate;
  event?: { event_id?: string; renovation_capex_updated_at?: string } | null;
  explanation?: { label?: string; summary?: string; next_action?: string };
};

type ManualPropertyDraft = {
  title: string;
  askingPrice: string;
  areaSqm: string;
  city: string;
  district: string;
  propertyType: string;
  sourceUrl: string;
  photoUrls: string;
  notes: string;
  uploadDocs: boolean;
};

type ManualListingResponse = {
  candidate?: { id?: string | null };
};

type PromoteCandidateResponse = {
  opportunity?: OpportunityRow | null;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  body: string;
  meta?: string | null;
};

type UploadContext = {
  workspaceId: string;
  opportunityId: string;
  folderId: string | null;
} | null;

const emptyManualPropertyDraft: ManualPropertyDraft = {
  title: '',
  askingPrice: '',
  areaSqm: '',
  city: 'Riyadh',
  district: '',
  propertyType: 'villa',
  sourceUrl: '',
  photoUrls: '',
  notes: '',
  uploadDocs: true,
};

const strategies = ['cosmetic_refresh', 'rental_ready', 'value_add', 'premium_repositioning', 'custom_scope'];
const finishLevels = ['economy', 'standard', 'mid_grade', 'premium', 'luxury'];

const formatSAR = new Intl.NumberFormat('en-SA', {
  style: 'currency',
  currency: 'SAR',
  maximumFractionDigits: 0,
});

function parseManualNumber(value: string): number | null {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function splitManualUrls(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));
}

function humanize(value: string | null | undefined): string {
  return `${value ?? ''}`.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()).trim();
}

function compactSAR(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 2)}M SAR`;
  if (value >= 1000) return `${Math.round(value / 1000)}k SAR`;
  return formatSAR.format(value);
}

function opportunityFact(item: OpportunityRow | null, keys: string[]) {
  return acquisitionMetadataString(item, keys);
}

function opportunityNumber(item: OpportunityRow | null, keys: string[]) {
  return acquisitionMetadataNumber(item, keys);
}

function categoryBreakdown(lines: RenovationCapexLine[] = []) {
  const map = new Map<string, number>();
  for (const line of lines) {
    const category = line.category || humanize(line.category_code) || 'Other';
    map.set(category, (map.get(category) || 0) + Number(line.base_total || 0));
  }
  return [...map.entries()].filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
}

export default function RenovationPage() {
  const t = useTranslations('renovationPage');
  const supabase = useMemo(() => createClient(), []);
  const { showError, showSuccess } = useToast();
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [events, setEvents] = useState<RenovationEstimateEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState<ManualPropertyDraft>(emptyManualPropertyDraft);
  const [manualSaving, setManualSaving] = useState(false);
  const [uploadContext, setUploadContext] = useState<UploadContext>(null);
  const [strategy, setStrategy] = useState('rental_ready');
  const [finishLevel, setFinishLevel] = useState('mid_grade');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);

  const selectedWorkspace = workspaces.find((item) => item.id === selectedWorkspaceId) ?? null;
  const selectedOpportunity = opportunities.find((item) => item.id === selectedOpportunityId) ?? null;

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('list_accessible_workspaces');
    if (error) {
      showError(error, 'list_accessible_workspaces');
      setLoading(false);
      return;
    }
    const rows = (Array.isArray(data) ? data : []) as WorkspaceRow[];
    const sorted = rows.sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
    setWorkspaces(sorted);
    setSelectedWorkspaceId((current) => current ?? sorted[0]?.id ?? null);
    setLoading(false);
  }, [showError, supabase]);

  const loadOpportunities = useCallback(async (workspaceId: string | null) => {
    if (!workspaceId) {
      setOpportunities([]);
      setSelectedOpportunityId(null);
      return;
    }
    setOpportunitiesLoading(true);
    const { data, error } = await supabase
      .from('acquisition_opportunities')
      .select('id, workspace_id, stage, title, area_summary, metadata_json, summary, updated_at, renovation_capex_json, renovation_capex_updated_at, renovation_rate_card_id')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(80);
    if (error) {
      showError(error, 'acquisition_opportunities');
      setOpportunitiesLoading(false);
      return;
    }
    const rows = (data ?? []) as OpportunityRow[];
    setOpportunities(rows);
    setSelectedOpportunityId((current) => rows.some((item) => item.id === current) ? current : rows[0]?.id ?? null);
    setOpportunitiesLoading(false);
  }, [showError, supabase]);

  const loadEvents = useCallback(async (opportunityId: string | null) => {
    if (!opportunityId) {
      setEvents([]);
      return;
    }
    const { data } = await supabase
      .from('renovation_estimate_events')
      .select('id, event_type, low_total, base_total, high_total, confidence_score, created_at')
      .eq('acquisition_opportunity_id', opportunityId)
      .order('created_at', { ascending: false })
      .limit(10);
    setEvents((data ?? []) as RenovationEstimateEventRow[]);
  }, [supabase]);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    void loadOpportunities(selectedWorkspaceId);
  }, [loadOpportunities, selectedWorkspaceId]);

  useEffect(() => {
    void loadEvents(selectedOpportunityId);
  }, [loadEvents, selectedOpportunityId]);

  useEffect(() => {
    const estimate = selectedOpportunity?.renovation_capex_json;
    if (estimate?.strategy) setStrategy(estimate.strategy);
    if (estimate?.finish_level) setFinishLevel(estimate.finish_level);
  }, [selectedOpportunity?.id, selectedOpportunity?.renovation_capex_json]);

  const ensureFolder = useCallback(async ({
    parentId = null,
    workspaceId,
    name,
    folderKind,
    metadata = {},
  }: {
    parentId?: string | null;
    workspaceId: string;
    name: string;
    folderKind: string;
    metadata?: Record<string, unknown>;
  }) => {
    const query = supabase
      .from('workspace_folders')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', name)
      .is('deleted_at', null)
      .limit(1);
    const scoped = parentId ? query.eq('parent_id', parentId) : query.is('parent_id', null);
    const { data: existing } = await scoped.maybeSingle();
    if (existing?.id) return existing.id as string;

    const { data, error } = await supabase
      .from('workspace_folders')
      .insert({
        workspace_id: workspaceId,
        parent_id: parentId,
        name,
        folder_kind: folderKind,
        analysis_policy: metadata.analysis_policy || 'manual',
        sensitivity_level: metadata.sensitivity_level || 'standard',
        related_opportunity_id: metadata.related_opportunity_id || null,
        metadata_json: metadata,
      })
      .select('id')
      .single();
    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('workspace_folders')
        .insert({ workspace_id: workspaceId, parent_id: parentId, name })
        .select('id')
        .single();
      if (fallbackError) throw error;
      return fallbackData.id as string;
    }
    return data.id as string;
  }, [supabase]);

  const openPropertyUpload = useCallback(async (opportunity: OpportunityRow | null) => {
    if (!selectedWorkspaceId || !opportunity?.id) return;
    try {
      const rootId = await ensureFolder({
        workspaceId: selectedWorkspaceId,
        name: 'Properties',
        folderKind: 'acquisition_property_root',
        metadata: { analysis_policy: 'none' },
      });
      const label = String(displayTitleForOpportunity(opportunity) || opportunity.title || `Opportunity ${opportunity.id.slice(0, 8)}`).slice(0, 96);
      const folderId = await ensureFolder({
        workspaceId: selectedWorkspaceId,
        parentId: rootId,
        name: label,
        folderKind: 'acquisition_property',
        metadata: { analysis_policy: 'acquisition_property', related_opportunity_id: opportunity.id },
      });
      setUploadContext({ workspaceId: selectedWorkspaceId, opportunityId: opportunity.id, folderId });
    } catch (error) {
      showError(error, 'renovation_property_upload_context');
    }
  }, [ensureFolder, selectedWorkspaceId, showError]);

  const handlePropertyDocumentCreated = useCallback(async (documentId: string) => {
    if (!uploadContext?.opportunityId || !uploadContext.workspaceId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [eventResult, diligenceResult] = await Promise.all([
      supabase.from('acquisition_events').insert({
        opportunity_id: uploadContext.opportunityId,
        workspace_id: uploadContext.workspaceId,
        created_by: user?.id || null,
        event_type: 'upload_property_document',
        event_direction: 'operator',
        body_text: 'Property renovation evidence uploaded; acquisition property analysis queued.',
        media_json: [],
        event_payload: {
          source: 'web_renovation_upload',
          action_id: 'upload_property_document',
          document_id: documentId,
          analysis_policy: 'acquisition_property',
          renovation_intent: true,
        },
      }),
      supabase
        .from('acquisition_diligence_items')
        .update({
          status: 'received',
          evidence_refs_json: [{ document_id: documentId, source: 'web_renovation_upload' }],
        })
        .eq('opportunity_id', uploadContext.opportunityId)
        .eq('status', 'requested')
        .in('item_type', ['missing_info', 'document_request']),
    ]);
    if (eventResult.error || diligenceResult.error) {
      showError(eventResult.error || diligenceResult.error, 'renovation_property_upload');
      return;
    }
    showSuccess(t('uploadAttached'));
  }, [showError, showSuccess, supabase, t, uploadContext]);

  const createManualProperty = useCallback(async () => {
    if (!selectedWorkspaceId) return;
    const title = manualDraft.title.trim();
    const sourceUrl = manualDraft.sourceUrl.trim();
    if (!title && !sourceUrl) {
      showError(new Error(t('manualNeedsTitle')), 'renovation_manual_property');
      return;
    }
    setManualSaving(true);
    try {
      const askingPrice = parseManualNumber(manualDraft.askingPrice);
      const areaSqm = parseManualNumber(manualDraft.areaSqm);
      const photoRefs = splitManualUrls(manualDraft.photoUrls);
      const text = [title, manualDraft.district.trim(), manualDraft.city.trim(), manualDraft.notes.trim()]
        .filter(Boolean)
        .join('\n');
      const intake = await invokeZohalBackendJson<ManualListingResponse>(
        supabase,
        '/api/acquisition/v1/intake/listing',
        {
          workspace_id: selectedWorkspaceId,
          source: 'manual_operator',
          manual_entry: true,
          submitted_by_user: true,
          source_url: sourceUrl || null,
          title: title || sourceUrl,
          asking_price: askingPrice,
          city: manualDraft.city.trim() || null,
          district: manualDraft.district.trim() || null,
          property_type: manualDraft.propertyType.trim() || null,
          area_sqm: areaSqm,
          photo_refs_json: photoRefs,
          text,
          limited_evidence_snapshot: {
            source: 'manual_operator',
            intake_mode: 'renovation_tab_manual_entry',
            submitted_by_user: true,
            submitted_at: new Date().toISOString(),
            notes: manualDraft.notes.trim() || null,
          },
        },
      );
      const candidateId = intake.candidate?.id;
      if (!candidateId) throw new Error(t('manualCreateError'));
      const promoted = await invokeZohalBackendJson<PromoteCandidateResponse>(
        supabase,
        `/api/acquisition/v1/candidates/${candidateId}/promote`,
        {},
      );
      const opportunity = promoted.opportunity;
      if (!opportunity?.id) throw new Error(t('manualCreateError'));
      setOpportunities((current) => [opportunity, ...current.filter((item) => item.id !== opportunity.id)]);
      setSelectedOpportunityId(opportunity.id);
      setManualOpen(false);
      setManualDraft(emptyManualPropertyDraft);
      showSuccess(t('manualCreated'));
      if (manualDraft.uploadDocs) {
        await openPropertyUpload(opportunity);
      }
    } catch (error) {
      showError(error, 'renovation_manual_property');
    } finally {
      setManualSaving(false);
    }
  }, [manualDraft, openPropertyUpload, selectedWorkspaceId, showError, showSuccess, supabase, t]);

  const generateEstimate = useCallback(async () => {
    if (!selectedOpportunity?.id) return;
    const userPrompt = prompt.trim() || t('defaultPrompt');
    setGenerating(true);
    setChat((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', body: userPrompt, meta: `${humanize(strategy)} · ${humanize(finishLevel)}` },
    ]);
    try {
      const response = await invokeZohalBackendJson<CapexEstimateResponse>(
        supabase,
        `/api/acquisition/v1/opportunities/${selectedOpportunity.id}/capex-estimate`,
        {
          strategy,
          finish_level: finishLevel,
          user_notes: userPrompt,
          save: true,
        },
      );
      const estimate = response.estimate ?? {};
      setOpportunities((current) => current.map((item) => item.id === selectedOpportunity.id
        ? {
            ...item,
            renovation_capex_json: estimate,
            renovation_capex_updated_at: response.event?.renovation_capex_updated_at ?? new Date().toISOString(),
            renovation_rate_card_id: estimate.rate_card_id ?? null,
          }
        : item));
      if (response.event?.event_id) {
        setEvents((current) => [{
          id: response.event?.event_id ?? crypto.randomUUID(),
          event_type: 'generated',
          low_total: estimate.low_total,
          base_total: estimate.base_total,
          high_total: estimate.high_total,
          confidence_score: estimate.confidence_score,
          created_at: new Date().toISOString(),
        }, ...current].slice(0, 10));
      }
      setChat((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          body: response.explanation?.summary || t('estimateGenerated'),
          meta: response.explanation?.next_action || null,
        },
      ]);
      setPrompt('');
    } catch (error) {
      showError(error, 'renovation_capex_estimate');
      setChat((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', body: t('estimateError'), meta: null },
      ]);
    } finally {
      setGenerating(false);
    }
  }, [finishLevel, prompt, selectedOpportunity?.id, showError, strategy, supabase, t]);

  return (
    <div className="flex h-full min-h-screen flex-col bg-surface">
      <AppHeader
        title={t('title')}
        subtitle={t('subtitle')}
        leading={<span className="grid h-10 w-10 place-items-center rounded-[12px] bg-accent/12 text-accent"><Wrench className="h-5 w-5" /></span>}
        actions={
          <Button size="sm" onClick={() => setManualOpen(true)} disabled={!selectedWorkspaceId}>
            <Plus className="mr-2 h-4 w-4" />
            {t('addProperty')}
          </Button>
        }
      />
      <main className="mx-auto grid w-full max-w-[1680px] flex-1 gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:p-6">
        <aside className="min-h-0 space-y-4">
          <WorkspaceSelector
            workspaces={workspaces}
            selectedId={selectedWorkspaceId}
            loading={loading}
            onSelect={(id) => {
              setSelectedWorkspaceId(id);
              setChat([]);
            }}
          />
          <PropertyList
            items={opportunities}
            loading={opportunitiesLoading}
            selectedId={selectedOpportunityId}
            onSelect={(id) => {
              setSelectedOpportunityId(id);
              setChat([]);
            }}
            onAdd={() => setManualOpen(true)}
          />
        </aside>

        <section className="min-w-0 space-y-4">
          {!selectedWorkspaceId ? (
            <EmptyState icon={<Building2 className="h-8 w-8" />} title={t('emptyWorkspaces')} variant="card" />
          ) : !selectedOpportunity ? (
            <EmptyState
              icon={<Home className="h-8 w-8" />}
              title={t('emptyProperties')}
              description={t('emptyPropertiesBody')}
              action={{ label: t('addProperty'), onClick: () => setManualOpen(true) }}
              variant="card"
            />
          ) : (
            <>
              <PropertyHeader
                workspace={selectedWorkspace}
                opportunity={selectedOpportunity}
                onUpload={() => void openPropertyUpload(selectedOpportunity)}
              />
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <EstimatePanel opportunity={selectedOpportunity} events={events} />
                <ChatEstimator
                  strategy={strategy}
                  finishLevel={finishLevel}
                  prompt={prompt}
                  generating={generating}
                  messages={chat}
                  onStrategyChange={setStrategy}
                  onFinishLevelChange={setFinishLevel}
                  onPromptChange={setPrompt}
                  onGenerate={() => void generateEstimate()}
                />
              </div>
            </>
          )}
        </section>
      </main>

      {manualOpen ? (
        <ManualPropertyModal
          draft={manualDraft}
          saving={manualSaving}
          onChange={(patch) => setManualDraft((current) => ({ ...current, ...patch }))}
          onSave={() => void createManualProperty()}
          onClose={() => {
            setManualOpen(false);
            setManualDraft(emptyManualPropertyDraft);
          }}
        />
      ) : null}

      {uploadContext ? (
        <DocumentUploadModal
          workspaceId={uploadContext.workspaceId}
          folderId={uploadContext.folderId}
          defaultDocumentTags={['property_file', 'acquisition_property', 'renovation_evidence']}
          defaultSourceMetadata={{
            vault: 'property',
            opportunity_id: uploadContext.opportunityId,
            analysis_policy: 'acquisition_property',
            renovation_intent: true,
          }}
          onDocumentCreated={handlePropertyDocumentCreated}
          onClose={() => setUploadContext(null)}
          onUploaded={() => {
            setUploadContext(null);
            void loadEvents(uploadContext.opportunityId);
          }}
        />
      ) : null}
    </div>
  );
}

function WorkspaceSelector({
  workspaces,
  selectedId,
  loading,
  onSelect,
}: {
  workspaces: WorkspaceRow[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations('renovationPage');
  return (
    <div className="rounded-[16px] border border-border bg-[image:var(--panel-bg)] p-4 shadow-[var(--shadowSm)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-soft">{t('workspace')}</p>
      {loading ? (
        <div className="mt-5 grid min-h-[120px] place-items-center"><Spinner /></div>
      ) : (
        <select
          value={selectedId ?? ''}
          onChange={(event) => onSelect(event.target.value)}
          className="mt-3 w-full rounded-[12px] border border-border bg-surface-alt px-3 py-3 text-sm font-semibold text-text outline-none focus:border-accent"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function PropertyList({
  items,
  loading,
  selectedId,
  onSelect,
  onAdd,
}: {
  items: OpportunityRow[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const t = useTranslations('renovationPage');
  return (
    <div className="rounded-[16px] border border-border bg-[image:var(--panel-bg)] p-3 shadow-[var(--shadowSm)]">
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-soft">{t('properties')}</p>
        <button type="button" onClick={onAdd} className="rounded-[10px] border border-border p-2 text-text-soft hover:bg-surface-alt hover:text-text" aria-label={t('addProperty')}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {loading ? (
        <div className="grid min-h-[240px] place-items-center"><Spinner /></div>
      ) : items.length === 0 ? (
        <p className="rounded-[12px] bg-surface-alt p-3 text-sm text-text-soft">{t('propertyListEmpty')}</p>
      ) : (
        <div className="max-h-[calc(100dvh-260px)] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const selected = selectedId === item.id;
            const estimate = item.renovation_capex_json;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'w-full rounded-[14px] border p-3 text-left transition',
                  selected ? 'border-accent/35 bg-accent/10' : 'border-border bg-surface-alt hover:bg-surface'
                )}
              >
                <p className="line-clamp-2 text-sm font-semibold text-text">{displayTitleForOpportunity(item) || t('untitledProperty')}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-text-soft">
                  <span className="rounded-full border border-border px-2 py-1">{humanize(item.stage) || t('stageUnknown')}</span>
                  {estimate?.base_total ? <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-1 text-warning">{compactSAR(estimate.base_total)}</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PropertyHeader({
  workspace,
  opportunity,
  onUpload,
}: {
  workspace: WorkspaceRow | null;
  opportunity: OpportunityRow;
  onUpload: () => void;
}) {
  const t = useTranslations('renovationPage');
  const price = opportunityNumber(opportunity, ['price', 'asking_price', 'acquisition_price', 'purchase_price']);
  const area = opportunityNumber(opportunity, ['area_sqm', 'sqm', 'area', 'land_area_sqm', 'built_up_area_sqm']);
  const location = [opportunityFact(opportunity, ['district', 'neighborhood']), opportunityFact(opportunity, ['city'])].filter(Boolean).join(', ');
  return (
    <div className="rounded-[18px] border border-border bg-[image:var(--panel-bg)] p-5 shadow-[var(--shadowSm)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{workspace?.name || t('workspace')}</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">{displayTitleForOpportunity(opportunity) || t('untitledProperty')}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-soft">{opportunity.summary || t('propertySummaryFallback')}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-soft">
            {location ? <span className="rounded-full border border-border px-3 py-1.5">{location}</span> : null}
            {price ? <span className="rounded-full border border-border px-3 py-1.5">{formatSAR.format(price)}</span> : null}
            {area ? <span className="rounded-full border border-border px-3 py-1.5">{Math.round(area)} m2</span> : null}
            {opportunity.updated_at ? <span className="rounded-full border border-border px-3 py-1.5">{formatRelativeTime(opportunity.updated_at)}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={onUpload}>
            <FileUp className="mr-2 h-4 w-4" />
            {t('uploadEvidence')}
          </Button>
          <Link
            href={`/workspaces/${encodeURIComponent(workspace?.id || '')}?tab=renovation`}
            className="inline-flex min-h-[40px] items-center justify-center rounded-[12px] border border-border px-4 text-sm font-semibold text-text-soft transition hover:bg-surface-alt hover:text-text"
          >
            {t('openWorkspace')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function EstimatePanel({ opportunity, events }: { opportunity: OpportunityRow; events: RenovationEstimateEventRow[] }) {
  const t = useTranslations('renovationPage');
  const estimate = opportunity.renovation_capex_json;
  const breakdown = categoryBreakdown(estimate?.line_items);
  const totalBreakdown = breakdown.reduce((total, [, value]) => total + value, 0);
  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-border bg-[image:var(--panel-bg)] p-5 shadow-[var(--shadowSm)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-warning">{t('estimate')}</p>
            <h3 className="mt-2 text-xl font-semibold text-text">{t('estimateTitle')}</h3>
          </div>
          <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
            {estimate?.confidence_label ? humanize(estimate.confidence_label) : t('planningOnly')}
          </span>
        </div>

        {estimate ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-[16px] border border-border bg-surface-alt p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{estimate.planning_estimate_label || t('planningEstimate')}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Metric label={t('low')} value={compactSAR(estimate.low_total) || t('notSet')} />
                <Metric label={t('base')} value={compactSAR(estimate.base_total) || t('notSet')} strong />
                <Metric label={t('high')} value={compactSAR(estimate.high_total) || t('notSet')} />
              </div>
              <CapexRange estimate={estimate} />
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-soft">
                <span className="rounded-full border border-border px-3 py-1.5">{humanize(estimate.strategy)}</span>
                <span className="rounded-full border border-border px-3 py-1.5">{humanize(estimate.finish_level)}</span>
                <span className="rounded-full border border-border px-3 py-1.5">{humanize(estimate.city)}{estimate.city_fallback_used ? ` · ${t('fallbackUsed')}` : ''}</span>
              </div>
            </div>

            {breakdown.length ? (
              <div className="rounded-[16px] border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-soft">{t('categoryBreakdown')}</p>
                <div className="mt-4 space-y-3">
                  {breakdown.slice(0, 6).map(([category, value]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-text">{category}</span>
                        <span className="text-text-soft">{compactSAR(value)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-border">
                        <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(6, Math.round((value / Math.max(1, totalBreakdown)) * 100))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <NoticeGrid estimate={estimate} />
          </div>
        ) : (
          <div className="mt-5 rounded-[16px] border border-dashed border-border bg-surface-alt p-6 text-sm leading-6 text-text-soft">
            {t('emptyEstimate')}
          </div>
        )}
      </div>

      <div className="rounded-[18px] border border-border bg-[image:var(--panel-bg)] p-5 shadow-[var(--shadowSm)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-soft">{t('history')}</p>
        {events.length ? (
          <div className="mt-4 space-y-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-surface-alt px-3 py-2 text-sm">
                <span className="font-medium text-text">{humanize(event.event_type) || t('event')}</span>
                <span className="text-text-soft">{compactSAR(event.base_total) || t('scopeOnly')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-soft">{t('historyEmpty')}</p>
        )}
      </div>
    </div>
  );
}

function ChatEstimator({
  strategy,
  finishLevel,
  prompt,
  generating,
  messages,
  onStrategyChange,
  onFinishLevelChange,
  onPromptChange,
  onGenerate,
}: {
  strategy: string;
  finishLevel: string;
  prompt: string;
  generating: boolean;
  messages: ChatMessage[];
  onStrategyChange: (value: string) => void;
  onFinishLevelChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
}) {
  const t = useTranslations('renovationPage');
  return (
    <div className="rounded-[18px] border border-border bg-[image:var(--panel-bg)] p-5 shadow-[var(--shadowSm)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-accent/12 text-accent"><MessageSquare className="h-5 w-5" /></span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t('aiEstimator')}</p>
          <h3 className="mt-1 text-xl font-semibold text-text">{t('chatTitle')}</h3>
          <p className="mt-1 text-sm leading-6 text-text-soft">{t('chatBody')}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('strategy')}</span>
          <select value={strategy} onChange={(event) => onStrategyChange(event.target.value)} className="w-full rounded-[12px] border border-border bg-surface-alt px-3 py-3 text-sm text-text outline-none focus:border-accent">
            {strategies.map((item) => <option key={item} value={item}>{t(`strategies.${item}`)}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('finishLevel')}</span>
          <select value={finishLevel} onChange={(event) => onFinishLevelChange(event.target.value)} className="w-full rounded-[12px] border border-border bg-surface-alt px-3 py-3 text-sm text-text outline-none focus:border-accent">
            {finishLevels.map((item) => <option key={item} value={item}>{t(`finishLevels.${item}`)}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 min-h-[220px] space-y-3 rounded-[16px] border border-border bg-surface-alt p-3">
        {messages.length === 0 ? (
          <div className="grid min-h-[190px] place-items-center text-center text-sm leading-6 text-text-soft">
            <div>
              <Sparkles className="mx-auto mb-3 h-5 w-5 text-accent" />
              {t('chatEmpty')}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={cn('rounded-[14px] border p-3 text-sm leading-6', message.role === 'user' ? 'ml-6 border-accent/25 bg-accent/10 text-text' : 'mr-6 border-border bg-surface text-text-soft')}>
              <p className="font-medium text-text">{message.body}</p>
              {message.meta ? <p className="mt-1 text-xs text-text-soft">{message.meta}</p> : null}
            </div>
          ))
        )}
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('promptLabel')}</span>
        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          rows={5}
          placeholder={t('promptPlaceholder')}
          className="w-full resize-none rounded-[14px] border border-border bg-surface-alt px-3 py-3 text-sm leading-6 text-text outline-none placeholder:text-text-muted focus:border-accent"
        />
      </label>
      <Button className="mt-4 w-full" onClick={onGenerate} disabled={generating}>
        {generating ? <Spinner className="mr-2" size="sm" /> : <Send className="mr-2 h-4 w-4" />}
        {generating ? t('generating') : t('generate')}
      </Button>
    </div>
  );
}

function ManualPropertyModal({
  draft,
  saving,
  onChange,
  onSave,
  onClose,
}: {
  draft: ManualPropertyDraft;
  saving: boolean;
  onChange: (patch: Partial<ManualPropertyDraft>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('renovationPage');
  const inputClass = 'w-full rounded-[12px] border border-border bg-surface-alt px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent';
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-md" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-border bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t('manualEyebrow')}</p>
            <h3 className="mt-1 text-xl font-semibold text-text">{t('manualTitle')}</h3>
            <p className="mt-1 text-sm leading-6 text-text-soft">{t('manualBody')}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t('close')}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('propertyName')}</span>
            <input value={draft.title} onChange={(event) => onChange({ title: event.target.value })} className={inputClass} placeholder={t('propertyNamePlaceholder')} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('askingPrice')}</span>
            <input inputMode="numeric" value={draft.askingPrice} onChange={(event) => onChange({ askingPrice: event.target.value })} className={inputClass} placeholder="3200000" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('areaSqm')}</span>
            <input inputMode="numeric" value={draft.areaSqm} onChange={(event) => onChange({ areaSqm: event.target.value })} className={inputClass} placeholder="360" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('city')}</span>
            <input value={draft.city} onChange={(event) => onChange({ city: event.target.value })} className={inputClass} placeholder="Riyadh" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('district')}</span>
            <input value={draft.district} onChange={(event) => onChange({ district: event.target.value })} className={inputClass} placeholder="Al Arid" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('propertyType')}</span>
            <select value={draft.propertyType} onChange={(event) => onChange({ propertyType: event.target.value })} className={inputClass}>
              <option value="villa">Villa</option>
              <option value="apartment">Apartment</option>
              <option value="duplex">Duplex</option>
              <option value="building">Building</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('listingUrl')}</span>
            <input value={draft.sourceUrl} onChange={(event) => onChange({ sourceUrl: event.target.value })} className={inputClass} placeholder="https://..." />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('photoUrls')}</span>
            <textarea value={draft.photoUrls} onChange={(event) => onChange({ photoUrls: event.target.value })} rows={3} className={cn(inputClass, 'resize-y')} placeholder={t('photoUrlsPlaceholder')} />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-text-soft">{t('notes')}</span>
            <textarea value={draft.notes} onChange={(event) => onChange({ notes: event.target.value })} rows={4} className={cn(inputClass, 'resize-y')} placeholder={t('notesPlaceholder')} />
          </label>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-[14px] border border-border bg-surface-alt p-3 text-sm text-text-soft">
          <input className="mt-1 h-4 w-4 accent-accent" type="checkbox" checked={draft.uploadDocs} onChange={(event) => onChange({ uploadDocs: event.target.checked })} />
          <span>{t('uploadAfterCreate')}</span>
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? t('creating') : t('createProperty')}</Button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs text-text-soft">{label}</p>
      <p className={cn('mt-1 text-lg text-text', strong ? 'font-bold' : 'font-semibold')}>{value}</p>
    </div>
  );
}

function CapexRange({ estimate }: { estimate: RenovationCapexEstimate }) {
  const low = Number(estimate.low_total || 0);
  const base = Number(estimate.base_total || 0);
  const high = Number(estimate.high_total || 0);
  if (!high) return null;
  return (
    <div className="mt-4 space-y-2">
      <div className="relative h-3 rounded-full bg-border">
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent/35" style={{ width: `${Math.max(8, (low / high) * 100)}%` }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, (base / high) * 100))}%` }} />
      </div>
    </div>
  );
}

function NoticeGrid({ estimate }: { estimate: RenovationCapexEstimate }) {
  const t = useTranslations('renovationPage');
  const groups = [
    { title: t('assumptions'), items: estimate.assumptions ?? [], icon: CheckCircle2 },
    { title: t('missingEvidence'), items: estimate.missing_evidence ?? [], icon: FileUp },
    { title: t('risks'), items: estimate.risks ?? [], icon: AlertTriangle },
  ];
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {groups.map(({ title, items, icon: Icon }) => (
        <div key={title} className="rounded-[16px] border border-border p-4">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-accent" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-soft">{title}</p>
          </div>
          {items.length ? (
            <div className="mt-3 space-y-2">
              {items.slice(0, 4).map((item, index) => (
                <div key={`${title}-${item.type || index}`} className="text-sm leading-6">
                  <p className="font-medium text-text">{item.label || item.message || item.description || humanize(item.type)}</p>
                  {item.suggested_action ? <p className="text-xs text-text-soft">{item.suggested_action}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-soft">{t('noneCaptured')}</p>
          )}
        </div>
      ))}
    </div>
  );
}
