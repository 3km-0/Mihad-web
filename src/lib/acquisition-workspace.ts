import type { SupabaseClient } from '@supabase/supabase-js';
import { hasEffectivePaidSubscription, type SubscriptionProfileLike } from '@/lib/subscription';

export const assetTypes = ['villa', 'townhouse', 'apartment', 'building', 'land', 'mixed_use'] as const;
export const strategyTypes = ['buy_renovate_rent', 'buy_renovate_sell', 'income_hold', 'family_office', 'opportunistic'] as const;
export const renovationAppetites = ['light', 'medium', 'heavy', 'avoid'] as const;
export const timelineOptions = ['now', '30_days', '90_days', 'six_months'] as const;
export const riskOptions = ['conservative', 'balanced', 'opportunistic'] as const;

export type AssetType = (typeof assetTypes)[number];
export type StrategyType = (typeof strategyTypes)[number];
export type RenovationAppetite = (typeof renovationAppetites)[number];
export type TimelineOption = (typeof timelineOptions)[number];
export type RiskOption = (typeof riskOptions)[number];

export interface BuyBoxInput {
  city?: string | null;
  districts?: string[] | string | null;
  asset_type?: AssetType | string | null;
  strategy?: StrategyType | string | null;
  budget_min_sar?: number | string | null;
  budget_max_sar?: number | string | null;
  target_return?: string | null;
  renovation_appetite?: RenovationAppetite | string | null;
  timeline?: TimelineOption | string | null;
  risk_appetite?: RiskOption | string | null;
  financing?: string | null;
  must_haves?: string[] | string | null;
  avoid?: string[] | string | null;
  notes?: string | null;
}

export interface BuyBox {
  city: string | null;
  districts: string[];
  asset_type: string;
  strategy: string;
  budget_min_sar: number | null;
  budget_max_sar: number | null;
  target_return: string | null;
  renovation_appetite: string;
  timeline: string;
  risk_appetite: string;
  financing: string | null;
  must_haves: string[];
  avoid: string[];
  notes: string | null;
}

export type MihadCountryCode = 'AE' | 'TR' | 'GR' | 'ES' | 'SA';

export type MihadPurpose =
  | 'investment'
  | 'family_use'
  | 'residency'
  | 'education'
  | 'relocation'
  | 'wealth_preservation';

export type MihadMandateTimeline =
  | 'immediate'
  | '1_to_3_months'
  | '3_to_6_months'
  | '6_to_12_months'
  | 'exploratory';

export type MihadLiquidityClass = 'cash_ready' | 'financing_ready' | 'mixed' | 'needs_financing_guidance';

export type MihadBudgetCurrency = 'SAR' | 'AED' | 'TRY' | 'EUR' | 'USD' | 'GBP';

export type WorkspaceKind = 'mihad_buyer_desk' | 'operator' | 'other';

export interface MihadMandateExtras {
  targetCountryCodes?: MihadCountryCode[] | string[] | null;
  purpose?: MihadPurpose | null;
  mandateTimeline?: MihadMandateTimeline | null;
  liquidityClass?: MihadLiquidityClass | null;
  budgetCurrency?: MihadBudgetCurrency | null;
  preferences?: Record<string, unknown> | null;
}

export interface CreateAcquisitionWorkspaceInput {
  userId: string;
  name: string;
  description?: string | null;
  parentFolderId?: string | null;
  buyBox: BuyBoxInput;
  seedSource?: string;
  adminApprovedAdditionalMandate?: boolean;
  workspaceKind?: WorkspaceKind;
  mihad?: MihadMandateExtras;
}

export function splitList(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function optionalNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value || '').replace(/[^\d.]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeBuyBox(input: BuyBoxInput): BuyBox {
  return {
    city: String(input.city || '').trim() || null,
    districts: splitList(input.districts),
    asset_type: String(input.asset_type || 'villa'),
    strategy: String(input.strategy || 'buy_renovate_rent'),
    budget_min_sar: optionalNumber(input.budget_min_sar),
    budget_max_sar: optionalNumber(input.budget_max_sar),
    target_return: String(input.target_return || '').trim() || null,
    renovation_appetite: String(input.renovation_appetite || 'medium'),
    timeline: String(input.timeline || '90_days'),
    risk_appetite: String(input.risk_appetite || 'balanced'),
    financing: String(input.financing || '').trim() || null,
    must_haves: splitList(input.must_haves),
    avoid: splitList(input.avoid),
    notes: String(input.notes || '').trim() || null,
  };
}

export function buildAcquisitionBrief(name: string, buyBox: BuyBox) {
  const parts = [
    `Mandate: ${name}`,
    buyBox.asset_type ? `Asset type: ${buyBox.asset_type}` : null,
    buyBox.city || buyBox.districts.length
      ? `Location: ${[buyBox.city, buyBox.districts.join(', ')].filter(Boolean).join(' - ')}`
      : null,
    buyBox.budget_min_sar || buyBox.budget_max_sar
      ? `Budget: ${buyBox.budget_min_sar ?? '...'} - ${buyBox.budget_max_sar ?? '...'} SAR`
      : null,
    buyBox.strategy ? `Strategy: ${buyBox.strategy}` : null,
    buyBox.renovation_appetite ? `Renovation appetite: ${buyBox.renovation_appetite}` : null,
    buyBox.target_return ? `Target return: ${buyBox.target_return}` : null,
    buyBox.notes ? `Notes: ${buyBox.notes}` : null,
  ].filter(Boolean);

  return parts.join('\n');
}

async function assertAcquisitionWorkspaceAllowed(
  supabase: SupabaseClient,
  input: CreateAcquisitionWorkspaceInput
) {
  if (input.adminApprovedAdditionalMandate) return;

  const db = supabase as any;
  const { data: existingMandates, error: mandatesError } = await db
    .from('buyer_mandates')
    .select('id, status')
    .eq('user_id', input.userId);

  if (mandatesError) {
    throw new Error(mandatesError.message || 'Failed to inspect mandate access');
  }

  const activeMandateCount = (existingMandates || []).filter((row: { status?: string | null }) => row.status === 'active').length;
  if (activeMandateCount < 1) return;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status, subscription_expires_at, grace_period_ends_at')
    .eq('id', input.userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message || 'Failed to inspect subscription access');
  }

  if (!hasEffectivePaidSubscription(profile as SubscriptionProfileLike | null)) {
    throw new Error('Additional active mandates require a paid plan or admin approval.');
  }
}

const SUPPORTED_MIHAD_COUNTRIES = new Set<MihadCountryCode>(['SA', 'AE', 'TR', 'GR', 'ES']);

function normalizeMihadCountryCodes(codes: MihadMandateExtras['targetCountryCodes']): MihadCountryCode[] {
  const list = Array.isArray(codes) ? codes : [];
  const cleaned = new Set<MihadCountryCode>();
  for (const raw of list) {
    const code = String(raw || '').trim().toUpperCase() as MihadCountryCode;
    if (SUPPORTED_MIHAD_COUNTRIES.has(code)) cleaned.add(code);
  }
  if (cleaned.size === 0) cleaned.add('SA');
  return Array.from(cleaned);
}

function inferWorkspaceKind(input: CreateAcquisitionWorkspaceInput): WorkspaceKind {
  if (input.workspaceKind) return input.workspaceKind;
  return 'mihad_buyer_desk';
}

export async function createAcquisitionWorkspace(
  supabase: SupabaseClient,
  input: CreateAcquisitionWorkspaceInput
) {
  await assertAcquisitionWorkspaceAllowed(supabase, input);

  const buyBox = normalizeBuyBox(input.buyBox);
  const name = input.name.trim();
  const summary = input.description?.trim() || buildAcquisitionBrief(name, buyBox);
  const createdAt = new Date().toISOString();

  const db = supabase as any;
  const workspaceKind = inferWorkspaceKind(input);
  const targetCountryCodes = normalizeMihadCountryCodes(input.mihad?.targetCountryCodes);
  const budgetCurrency: MihadBudgetCurrency = (input.mihad?.budgetCurrency || 'SAR') as MihadBudgetCurrency;

  const { data: createdWorkspace, error: workspaceError } = await db
    .from('workspaces')
    .insert({
      name,
      description: summary || null,
      analysis_brief: buildAcquisitionBrief(name, buyBox) || summary || null,
      workspace_type: 'project',
      workspace_kind: workspaceKind,
      icon: 'scope',
      color: '#B7F34A',
      parent_folder_id: input.parentFolderId || null,
      owner_id: input.userId,
      status: 'active',
      preparation_status: 'seeded',
      preparation_metadata: {
        seed_source: input.seedSource || 'mihad_buyer_workspace_creation_form',
        seeded_at: createdAt,
        product_model: 'Buyer Mandate -> RFQ -> Source Run -> Sourced Option -> Match -> Buyer Packet -> Partner Intro -> Deal Event',
        buy_box: buyBox,
        mihad: input.mihad
          ? {
              target_country_codes: targetCountryCodes,
              purpose: input.mihad.purpose ?? null,
              timeline: input.mihad.mandateTimeline ?? null,
              liquidity_class: input.mihad.liquidityClass ?? null,
              budget_currency: budgetCurrency,
              preferences: input.mihad.preferences ?? null,
            }
          : null,
      },
    })
    .select('id')
    .single();

  if (workspaceError || !createdWorkspace) {
    throw new Error(workspaceError?.message || 'Failed to create workspace');
  }

  const { data: buyerEntity, error: buyerEntityError } = await db
    .from('buyer_entities')
    .insert({
      owner_user_id: input.userId,
      display_name: name,
      entity_type: 'individual',
      metadata_json: {
        intake_source: input.seedSource || 'workspace_creation_form',
      },
    })
    .select('id')
    .single();

  if (buyerEntityError || !buyerEntity) {
    throw new Error(buyerEntityError?.message || 'Failed to create buyer entity');
  }

  const { data: mandate, error: mandateError } = await db
    .from('buyer_mandates')
    .insert({
      workspace_id: createdWorkspace.id,
      buyer_entity_id: buyerEntity.id,
      user_id: input.userId,
      title: name,
      status: 'active',
      target_locations_json: buyBox.districts.length
        ? buyBox.districts
        : buyBox.city
          ? [buyBox.city]
          : targetCountryCodes,
      budget_range_json: {
        min: buyBox.budget_min_sar,
        max: buyBox.budget_max_sar,
        currency: budgetCurrency,
      },
      budget_currency: budgetCurrency,
      use_case: input.mihad?.purpose ?? buyBox.strategy,
      purpose: input.mihad?.purpose ?? null,
      timeline: input.mihad?.mandateTimeline ?? buyBox.timeline,
      readiness_state: input.mihad?.liquidityClass ? 'self_declared' : 'intake',
      constraints_json: {
        must_haves: buyBox.must_haves,
        avoid: buyBox.avoid,
        risk_appetite: buyBox.risk_appetite,
        financing: buyBox.financing,
      },
      notes: buyBox.notes,
      metadata_json: {
        intake_source: input.seedSource || 'workspace_creation_form',
        basis_label: 'buyer_provided',
        buy_box: buyBox,
        target_return: buyBox.target_return,
        liquidity_class: input.mihad?.liquidityClass ?? null,
      },
      target_country_codes: targetCountryCodes,
    })
    .select('id')
    .single();

  if (mandateError || !mandate) {
    throw new Error(mandateError?.message || 'Failed to create buyer mandate');
  }

  const preferences = input.mihad?.preferences ?? {};
  const scoutIntent = (preferences as { scout_intent?: Record<string, unknown> | null })?.scout_intent ?? null;
  const activationRequest = (preferences as { activation_request?: Record<string, unknown> | null })?.activation_request ?? null;
  const activationScoring = (preferences as { activation_scoring?: Record<string, unknown> | null })?.activation_scoring ?? null;
  const activationEconomics = activationRequest
    ? {
        tenant_monthly_rent: activationRequest.tenant_monthly_rent ?? activationRequest.monthly_budget ?? null,
        land_rent: activationRequest.land_rent ?? activationRequest.rent_expectation ?? null,
        modular_unit_lease: activationRequest.modular_unit_lease ?? null,
        install_removal_amortization: activationRequest.install_removal_amortization ?? null,
        maintenance_reserve: activationRequest.maintenance_reserve ?? null,
        target_coverage: activationRequest.target_coverage ?? 1.5,
        reserve_months: activationRequest.reserve_months ?? null,
      }
    : null;
  const activationPartyType = String(activationRequest?.audience_type || activationRequest?.party_type || 'tenant');
  const activationRoute = String(activationScoring?.route_recommendation || 'needs_review');
  const { data: rfq, error: rfqError } = await db
    .from('rfqs')
    .insert({
      workspace_id: createdWorkspace.id,
      mandate_id: mandate.id,
      buyer_entity_id: buyerEntity.id,
      status: 'submitted',
      vertical: 'prefab',
      title: name,
      city: String((scoutIntent?.city as string | undefined) || buyBox.city || '').trim() || null,
      country_code: targetCountryCodes[0] || 'SA',
      land_status: typeof preferences.land_status === 'string' ? preferences.land_status : String(activationRequest?.land_status || 'unknown'),
      use_case: String(activationRequest?.business_activity || input.mihad?.purpose || scoutIntent?.purpose || buyBox.strategy || 'prefab_buyer'),
      prefab_category: String(activationRequest?.project_type || preferences.prefab_category || buyBox.asset_type || 'villa'),
      budget_range_json: {
        min: buyBox.budget_min_sar,
        max: buyBox.budget_max_sar,
        currency: budgetCurrency,
      },
      target_size_json: {
        area_sqm: activationRequest?.required_land_area_sqm ?? preferences.target_size_sqm ?? null,
        structure_size_sqm: activationRequest?.size_sqm ?? null,
      },
      delivery_timeline: input.mihad?.mandateTimeline ?? buyBox.timeline,
      scope_needs_json: {
        must_haves: buyBox.must_haves,
        avoid: buyBox.avoid,
        scope_needs: preferences.scope_needs ?? [],
      },
      contact_preference: typeof preferences.contact_preference === 'string' ? preferences.contact_preference : 'whatsapp',
      qualification_json: {
        liquidity_class: input.mihad?.liquidityClass ?? null,
        readiness: scoutIntent?.readiness ?? null,
        financing_posture: scoutIntent?.financing_posture ?? buyBox.financing,
        activation_request: activationRequest,
        activation_economics: activationEconomics,
        activation_scoring: activationScoring,
      },
      activation_party_type: ['tenant', 'landowner', 'supplier'].includes(activationPartyType) ? activationPartyType : 'tenant',
      activation_route: ['tenant_demand', 'land_supply', 'supplier_panel', 'broker_manager', 'operator_candidate', 'needs_review'].includes(activationRoute) ? activationRoute : 'needs_review',
      activation_score_json: activationScoring || {},
      metadata_json: {
        intake_source: input.seedSource || 'workspace_creation_form',
        buy_box: buyBox,
        scout_intent: scoutIntent,
        activation_request: activationRequest,
        activation_economics: activationEconomics,
        activation_scoring: activationScoring,
      },
      created_by: input.userId,
    })
    .select('id')
    .single();

  if (rfqError || !rfq) {
    throw new Error(rfqError?.message || 'Failed to create RFQ');
  }

  return {
    workspaceId: createdWorkspace.id as string,
    mandateId: mandate.id as string,
    rfqId: rfq.id as string,
    buyBox,
  };
}
