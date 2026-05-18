import { PREFAB_PROJECT_TYPES, PREFAB_WHATSAPP_URL, projectTypeLabel } from '@/lib/prefab-content';
import { scoreActivationRequest, type ActivationPartyType } from '@/lib/activation-scoring';
import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type RequestQuoteBody = {
  audience_type?: unknown;
  project_type?: unknown;
  city?: unknown;
  district?: unknown;
  land_status?: unknown;
  business_activity?: unknown;
  cr_status?: unknown;
  required_land_area_sqm?: unknown;
  size_sqm?: unknown;
  rooms?: unknown;
  use_case?: unknown;
  style_reference?: unknown;
  model_reference?: unknown;
  budget_range?: {
    min?: unknown;
    max?: unknown;
    currency?: unknown;
  };
  monthly_budget?: unknown;
  lease_term_months?: unknown;
  timeline?: unknown;
  deposit_readiness?: unknown;
  location_flexibility?: unknown;
  tenant_commitment?: unknown;
  permit_path?: unknown;
  land_ownership_status?: unknown;
  access_frontage?: unknown;
  utilities_status?: unknown;
  zoning_use?: unknown;
  rent_expectation?: unknown;
  revenue_share_open?: unknown;
  modular_install_permission?: unknown;
  sublease_permission?: unknown;
  removal_rights?: unknown;
  unit_types?: unknown;
  lease_pricing_available?: unknown;
  installation_terms?: unknown;
  maintenance_sla?: unknown;
  drawings_available?: unknown;
  service_areas?: unknown;
  supplier_flexible_lease?: unknown;
  tenant_monthly_rent?: unknown;
  land_rent?: unknown;
  modular_unit_lease?: unknown;
  install_removal_amortization?: unknown;
  maintenance_reserve?: unknown;
  target_coverage?: unknown;
  reserve_months?: unknown;
  scope_needs?: unknown;
  contact?: {
    name?: unknown;
    phone?: unknown;
    email?: unknown;
    whatsapp_preferred?: unknown;
  };
  notes?: unknown;
};

const LAND_STATUSES = new Set(['owned', 'identified', 'needed', 'unknown']);
const PROJECT_TYPES = new Set(PREFAB_PROJECT_TYPES.map((item) => item.value));
const PARTY_TYPES = new Set<ActivationPartyType>(['tenant', 'landowner', 'supplier']);

function jsonError(message: string, status = 400, code = 'invalid_request') {
  return NextResponse.json({ error: message, code }, { status });
}

function text(value: unknown, max = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function optionalNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value ?? '').replace(/[^\d.]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item, 80)).filter(Boolean);
}

function normalizePhone(value: unknown) {
  return text(value, 40).replace(/[^\d+]/g, '');
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 'true' || value === 'yes' || value === '1';
}

function defaultProjectType(partyType: ActivationPartyType) {
  if (partyType === 'landowner') return 'land_activation';
  if (partyType === 'supplier') return 'supplier_application';
  return 'commercial_site';
}

async function resolvePublicRfqOwnerId(service: Awaited<ReturnType<typeof createServiceClient>>) {
  const configured = text(process.env.MIHAD_PUBLIC_RFQ_OWNER_ID || process.env.PUBLIC_RFQ_OWNER_ID, 80);
  if (configured) return configured;

  const { data, error } = await service
    .from('profiles')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message || 'Could not resolve public RFQ owner.');
  if (!data?.id) throw new Error('No profile is available to own public RFQ workspaces.');
  return data.id as string;
}

function buildWhatsappUrl(input: { rfqId?: string; partyType: ActivationPartyType; projectType: string; city: string; phone: string }) {
  const configured = text(process.env.NEXT_PUBLIC_MIHAD_WHATSAPP_URL || process.env.MIHAD_WHATSAPP_URL, 300);
  const base = configured || PREFAB_WHATSAPP_URL;
  const message = `I submitted a Mihad activation request${input.rfqId ? ` (${input.rfqId})` : ''} for ${input.partyType}/${input.projectType} in ${input.city || 'Saudi Arabia'}. My phone is ${input.phone}.`;

  try {
    const url = new URL(base);
    if (url.hostname.includes('wa.me') || url.hostname.includes('whatsapp')) {
      url.searchParams.set('text', message);
    }
    return url.toString();
  } catch {
    return `${PREFAB_WHATSAPP_URL}&text=${encodeURIComponent(message)}`;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestQuoteBody | null;
  if (!body) return jsonError('Invalid request payload.');

  const rawPartyType = text(body.audience_type, 40) as ActivationPartyType;
  const partyType = PARTY_TYPES.has(rawPartyType) ? rawPartyType : 'tenant';
  const requestedProjectType = text(body.project_type, 80);
  const projectType = PROJECT_TYPES.has(requestedProjectType as (typeof PREFAB_PROJECT_TYPES)[number]['value'])
    ? requestedProjectType
    : defaultProjectType(partyType);
  const city = text(body.city, 120);
  const district = text(body.district, 120);
  const rawLandStatus = text(body.land_status, 40);
  const landStatus = LAND_STATUSES.has(rawLandStatus) ? rawLandStatus : partyType === 'landowner' ? 'owned' : 'unknown';
  const budgetMin = optionalNumber(body.budget_range?.min);
  const budgetMax = optionalNumber(body.budget_range?.max) ?? optionalNumber(body.monthly_budget);
  const budgetCurrency = text(body.budget_range?.currency, 10).toUpperCase() || 'SAR';
  const timeline = text(body.timeline, 160);
  const contactName = text(body.contact?.name, 160);
  const contactPhone = normalizePhone(body.contact?.phone);
  const contactEmail = text(body.contact?.email, 180);
  const whatsappPreferred = body.contact?.whatsapp_preferred !== false;
  const sizeSqm = text(body.size_sqm, 80);
  const rooms = text(body.rooms, 120);
  const useCase = text(body.use_case, 240);
  const styleReference = text(body.style_reference, 180);
  const modelReference = text(body.model_reference, 180);
  const notes = text(body.notes, 1200);
  const scopeNeeds = normalizeList(body.scope_needs);
  const activationRequest = {
    party_type: partyType,
    business_activity: text(body.business_activity, 180),
    cr_status: text(body.cr_status, 80),
    city,
    district,
    required_land_area_sqm: optionalNumber(body.required_land_area_sqm),
    structure_size_sqm: optionalNumber(body.size_sqm),
    monthly_budget: optionalNumber(body.monthly_budget) ?? budgetMax,
    lease_term_months: optionalNumber(body.lease_term_months),
    timeline,
    deposit_readiness: text(body.deposit_readiness, 160),
    location_flexibility: normalizeBoolean(body.location_flexibility),
    tenant_commitment: normalizeBoolean(body.tenant_commitment),
    permit_path: normalizeBoolean(body.permit_path),
    land_ownership_status: text(body.land_ownership_status, 120),
    access_frontage: text(body.access_frontage, 240),
    utilities_status: text(body.utilities_status, 160),
    zoning_use: text(body.zoning_use, 160),
    rent_expectation: optionalNumber(body.rent_expectation),
    revenue_share_open: normalizeBoolean(body.revenue_share_open),
    modular_install_permission: normalizeBoolean(body.modular_install_permission),
    sublease_permission: normalizeBoolean(body.sublease_permission),
    removal_rights: normalizeBoolean(body.removal_rights),
    unit_types: text(body.unit_types, 260),
    lease_pricing_available: normalizeBoolean(body.lease_pricing_available),
    installation_terms: text(body.installation_terms, 240),
    maintenance_sla: text(body.maintenance_sla, 240),
    drawings_available: normalizeBoolean(body.drawings_available),
    service_areas: text(body.service_areas, 260),
    supplier_flexible_lease: normalizeBoolean(body.supplier_flexible_lease),
  };
  const economics = {
    tenant_monthly_rent: optionalNumber(body.tenant_monthly_rent) ?? activationRequest.monthly_budget,
    land_rent: optionalNumber(body.land_rent) ?? activationRequest.rent_expectation,
    modular_unit_lease: optionalNumber(body.modular_unit_lease),
    install_removal_amortization: optionalNumber(body.install_removal_amortization),
    maintenance_reserve: optionalNumber(body.maintenance_reserve),
    target_coverage: optionalNumber(body.target_coverage) ?? 1.5,
    reserve_months: optionalNumber(body.reserve_months),
  };
  const scoring = scoreActivationRequest({
    partyType,
    businessActivity: activationRequest.business_activity,
    crStatus: activationRequest.cr_status,
    city,
    district,
    requiredLandAreaSqm: activationRequest.required_land_area_sqm,
    requiredStructureSizeSqm: activationRequest.structure_size_sqm,
    monthlyBudget: activationRequest.monthly_budget,
    leaseTermMonths: activationRequest.lease_term_months,
    depositReadiness: activationRequest.deposit_readiness,
    timeline,
    locationFlexibility: activationRequest.location_flexibility ? 'yes' : 'no',
    tenantCommitment: activationRequest.tenant_commitment ? 'yes' : 'no',
    permitPath: activationRequest.permit_path ? 'yes' : 'no',
    landOwnershipStatus: activationRequest.land_ownership_status,
    accessFrontage: activationRequest.access_frontage,
    utilitiesStatus: activationRequest.utilities_status,
    zoningUse: activationRequest.zoning_use,
    rentExpectation: activationRequest.rent_expectation,
    revenueShareOpen: activationRequest.revenue_share_open ? 'yes' : 'no',
    modularInstallPermission: activationRequest.modular_install_permission ? 'yes' : 'no',
    subleasePermission: activationRequest.sublease_permission ? 'yes' : 'no',
    removalRights: activationRequest.removal_rights ? 'yes' : 'no',
    unitTypes: activationRequest.unit_types,
    leasePricingAvailable: activationRequest.lease_pricing_available ? 'yes' : 'no',
    installationTerms: activationRequest.installation_terms,
    maintenanceSla: activationRequest.maintenance_sla,
    drawingsAvailable: activationRequest.drawings_available ? 'yes' : 'no',
    serviceAreas: activationRequest.service_areas,
    supplierFlexibleLease: activationRequest.supplier_flexible_lease ? 'yes' : 'no',
    tenantMonthlyRent: economics.tenant_monthly_rent,
    landRent: economics.land_rent,
    modularUnitLease: economics.modular_unit_lease,
    installRemovalAmortization: economics.install_removal_amortization,
    maintenanceReserve: economics.maintenance_reserve,
    targetCoverage: economics.target_coverage,
    reserveMonths: economics.reserve_months,
  });

  if (!city && partyType !== 'supplier') return jsonError('City or land location is required.', 400, 'city_required');
  if (partyType === 'supplier' && !activationRequest.service_areas && !city) return jsonError('Service regions are required.', 400, 'service_regions_required');
  if (partyType === 'tenant' && !activationRequest.business_activity && !useCase) return jsonError('Business activity is required.', 400, 'business_activity_required');
  if (partyType === 'landowner' && !activationRequest.required_land_area_sqm && !activationRequest.zoning_use) return jsonError('Plot size or current use is required.', 400, 'plot_details_required');
  if (partyType === 'supplier' && !activationRequest.unit_types) return jsonError('Unit types are required.', 400, 'unit_types_required');
  if (!timeline && partyType !== 'landowner') return jsonError('Timeline is required.', 400, 'timeline_required');
  if (!contactName) return jsonError('Contact name is required.', 400, 'contact_name_required');
  if (!contactPhone) return jsonError('Phone number is required.', 400, 'phone_required');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonError('RFQ submission is not configured on this environment.', 503, 'rfq_service_not_configured');
  }

  const service = await createServiceClient();
  const ownerId = await resolvePublicRfqOwnerId(service);
  const createdAt = new Date().toISOString();
  const label = projectTypeLabel(projectType);
  const titlePrefix = partyType === 'landowner'
    ? 'Land activation lead'
    : partyType === 'supplier'
      ? 'Modular supplier application'
      : 'Commercial site request';
  const locationLabel = city || activationRequest.service_areas || 'Saudi Arabia';
  const title = `${titlePrefix} - ${locationLabel}`;
  const budgetRange = { min: budgetMin, max: budgetMax, currency: budgetCurrency };
  const contact = {
    name: contactName,
    phone: contactPhone,
    email: contactEmail || null,
    whatsapp_preferred: whatsappPreferred,
  };
  const activationMetadata = {
    activation_request: activationRequest,
    activation_economics: economics,
    activation_scoring: scoring,
    contact,
    project_type: projectType,
    label,
    no_raw_financial_documents: true,
  };

  const { data: workspace, error: workspaceError } = await service
    .from('workspaces')
    .insert({
      name: title,
      description: `Public Mihad activation request for ${label} in ${locationLabel}.`,
      analysis_brief: [
        `Activation request: ${partyType}`,
        `Use: ${activationRequest.business_activity || useCase || label}`,
        `Location: ${locationLabel}`,
        `Route: ${scoring.route_recommendation}`,
        scoring.hard_stops.length ? `Hard stops: ${scoring.hard_stops.join(', ')}` : null,
      ].filter(Boolean).join('\n'),
      workspace_type: 'project',
      workspace_kind: 'mihad_buyer_desk',
      workspace_domain: 'prefab',
      icon: partyType === 'landowner' ? 'map' : partyType === 'supplier' ? 'factory' : 'building',
      color: '#1f6b4f',
      owner_id: ownerId,
      status: 'active',
      preparation_status: 'submitted',
      preparation_metadata: {
        seed_source: 'public_activation_request',
        public_rfq: true,
        submitted_at: createdAt,
        product_lane: 'prefab_activation',
        source_channel: 'public_web',
        contact_preference: whatsappPreferred ? 'whatsapp' : 'phone',
        ...activationMetadata,
      },
    })
    .select('id')
    .single();

  if (workspaceError || !workspace?.id) {
    return jsonError(workspaceError?.message || 'Could not create RFQ workspace.', 500, 'workspace_create_failed');
  }

  const { data: buyerEntity, error: buyerError } = await service
    .from('buyer_entities')
    .insert({
      owner_user_id: ownerId,
      display_name: contactName,
      entity_type: partyType === 'landowner' ? 'individual' : 'company',
      metadata_json: {
        intake_source: 'public_activation_request',
        public_rfq: true,
        party_type: partyType,
        contact,
      },
    })
    .select('id')
    .single();

  if (buyerError || !buyerEntity?.id) {
    return jsonError(buyerError?.message || 'Could not create buyer entity.', 500, 'buyer_create_failed');
  }

  const purpose = partyType === 'landowner'
    ? 'land_activation_supply'
    : partyType === 'supplier'
      ? 'modular_supplier_panel'
      : 'commercial_site_activation';

  const { data: mandate, error: mandateError } = await service
    .from('buyer_mandates')
    .insert({
      workspace_id: workspace.id,
      buyer_entity_id: buyerEntity.id,
      user_id: ownerId,
      title,
      status: 'active',
      target_country_codes: ['SA'],
      target_locations_json: [city, district].filter(Boolean),
      budget_range_json: budgetRange,
      budget_currency: budgetCurrency,
      use_case: activationRequest.business_activity || useCase || label,
      purpose,
      timeline,
      readiness_state: scoring.route_recommendation,
      constraints_json: {
        land_status: landStatus,
        project_type: projectType,
        target_size: sizeSqm || null,
        rooms: rooms || null,
        style_reference: styleReference || null,
        model_reference: modelReference || null,
        scope_needs: scopeNeeds,
        ...activationRequest,
      },
      notes,
      metadata_json: {
        intake_source: 'public_activation_request',
        public_rfq: true,
        contact_preference: whatsappPreferred ? 'whatsapp' : 'phone',
        activation_economics: economics,
        activation_scoring: scoring,
        no_raw_financial_documents: true,
      },
    })
    .select('id')
    .single();

  if (mandateError || !mandate?.id) {
    return jsonError(mandateError?.message || 'Could not create buyer mandate.', 500, 'mandate_create_failed');
  }

  const { data: rfq, error: rfqError } = await service
    .from('rfqs')
    .insert({
      workspace_id: workspace.id,
      mandate_id: mandate.id,
      buyer_entity_id: buyerEntity.id,
      created_by: ownerId,
      status: 'submitted',
      vertical: 'prefab',
      title,
      city: city || locationLabel,
      country_code: 'SA',
      land_status: landStatus,
      use_case: activationRequest.business_activity || useCase || label,
      prefab_category: projectType,
      budget_range_json: budgetRange,
      target_size_json: {
        label: sizeSqm || activationRequest.required_land_area_sqm || null,
        rooms: rooms || null,
        land_area_sqm: activationRequest.required_land_area_sqm,
        structure_size_sqm: activationRequest.structure_size_sqm,
      },
      delivery_timeline: timeline,
      document_refs_json: [],
      activation_party_type: partyType,
      activation_route: scoring.route_recommendation,
      activation_score_json: scoring,
      scope_needs_json: {
        scope_needs: scopeNeeds,
        style_reference: styleReference || null,
        model_reference: modelReference || null,
      },
      contact_preference: whatsappPreferred ? 'whatsapp' : 'phone',
      qualification_json: {
        contact,
        public_submission: true,
        activation_request: activationRequest,
        activation_economics: economics,
        activation_scoring: scoring,
        missing_fields: scoring.missing_fields,
        readiness: {
          land_status: landStatus,
          has_budget: Boolean(budgetMax || activationRequest.rent_expectation),
          has_city: Boolean(city),
          route_recommendation: scoring.route_recommendation,
        },
      },
      metadata_json: {
        intake_source: 'public_activation_request',
        public_rfq: true,
        activation_request: activationRequest,
        activation_economics: economics,
        activation_scoring: scoring,
        no_raw_financial_documents: true,
        notes,
      },
    })
    .select('id, status')
    .single();

  if (rfqError || !rfq?.id) {
    return jsonError(rfqError?.message || 'Could not create RFQ.', 500, 'rfq_create_failed');
  }

  const { data: activationOpportunity, error: activationOpportunityError } = await service
    .from('activation_opportunities')
    .insert({
      workspace_id: workspace.id,
      mandate_id: mandate.id,
      rfq_id: rfq.id,
      party_type: partyType,
      status: 'intake',
      route_recommendation: scoring.route_recommendation,
      score_json: scoring,
      hard_stops_json: scoring.hard_stops,
      missing_fields_json: scoring.missing_fields,
      economics_json: economics,
      notes,
      created_by: ownerId,
    })
    .select('id')
    .single();

  if (activationOpportunityError || !activationOpportunity?.id) {
    return jsonError(activationOpportunityError?.message || 'Could not create activation opportunity.', 500, 'activation_opportunity_create_failed');
  }

  const { data: thread } = await service
    .from('agent_threads')
    .insert({
      workspace_id: workspace.id,
      mandate_id: mandate.id,
      rfq_id: rfq.id,
      buyer_entity_id: buyerEntity.id,
      created_by: ownerId,
      channel: 'web',
      external_thread_id: `public-activation:${rfq.id}`,
      status: 'open',
      last_message_at: createdAt,
      state_json: {
        source: 'public_activation_request',
        party_type: partyType,
        route_recommendation: scoring.route_recommendation,
        contact_preference: whatsappPreferred ? 'whatsapp' : 'phone',
      },
    })
    .select('id')
    .maybeSingle();

  await service.from('agent_events').insert({
    workspace_id: workspace.id,
    mandate_id: mandate.id,
    rfq_id: rfq.id,
    activation_opportunity_id: activationOpportunity.id,
    thread_id: thread?.id ?? null,
    created_by: ownerId,
    channel: 'web',
    event_direction: 'inbound',
    event_type: 'public_activation_request_submitted',
    body_text: `${contactName} submitted a ${partyType} activation request for ${locationLabel}.`,
    event_payload: {
      project_type: projectType,
      party_type: partyType,
      city,
      district,
      land_status: landStatus,
      budget_range: budgetRange,
      timeline,
      scope_needs: scopeNeeds,
      activation_request: activationRequest,
      activation_economics: economics,
      activation_scoring: scoring,
      contact,
    },
  });

  return NextResponse.json({
    rfq_id: rfq.id,
    mandate_id: mandate.id,
    buyer_entity_id: buyerEntity.id,
    workspace_id: workspace.id,
    status: rfq.status || 'submitted',
    route_recommendation: scoring.route_recommendation,
    hard_stops: scoring.hard_stops,
    whatsapp_url: buildWhatsappUrl({ rfqId: rfq.id, partyType, projectType: label, city: locationLabel, phone: contactPhone }),
  });
}
