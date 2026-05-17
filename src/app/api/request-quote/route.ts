import { PREFAB_PROJECT_TYPES, PREFAB_WHATSAPP_URL, projectTypeLabel } from '@/lib/prefab-content';
import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type RequestQuoteBody = {
  project_type?: unknown;
  city?: unknown;
  land_status?: unknown;
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
  timeline?: unknown;
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

function buildWhatsappUrl(input: { rfqId?: string; projectType: string; city: string; phone: string }) {
  const configured = text(process.env.NEXT_PUBLIC_MIHAD_WHATSAPP_URL || process.env.MIHAD_WHATSAPP_URL, 300);
  const base = configured || PREFAB_WHATSAPP_URL;
  const message = `I submitted a Mihad prefab RFQ${input.rfqId ? ` (${input.rfqId})` : ''} for ${input.projectType} in ${input.city}. My phone is ${input.phone}.`;

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

  const projectType = text(body.project_type, 80);
  const city = text(body.city, 120);
  const rawLandStatus = text(body.land_status, 40);
  const landStatus = LAND_STATUSES.has(rawLandStatus) ? rawLandStatus : 'unknown';
  const budgetMin = optionalNumber(body.budget_range?.min);
  const budgetMax = optionalNumber(body.budget_range?.max);
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

  if (!projectType || !PROJECT_TYPES.has(projectType as (typeof PREFAB_PROJECT_TYPES)[number]['value'])) {
    return jsonError('Choose a prefab project type.', 400, 'project_type_required');
  }
  if (!city) return jsonError('City or delivery location is required.', 400, 'city_required');
  if (!rawLandStatus) return jsonError('Land status is required.', 400, 'land_status_required');
  if (!budgetMax) return jsonError('Maximum budget is required.', 400, 'budget_required');
  if (!timeline) return jsonError('Timeline is required.', 400, 'timeline_required');
  if (!contactName) return jsonError('Contact name is required.', 400, 'contact_name_required');
  if (!contactPhone) return jsonError('Phone number is required.', 400, 'phone_required');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonError('RFQ submission is not configured on this environment.', 503, 'rfq_service_not_configured');
  }

  const service = await createServiceClient();
  const ownerId = await resolvePublicRfqOwnerId(service);
  const createdAt = new Date().toISOString();
  const label = projectTypeLabel(projectType);
  const title = `${label} RFQ - ${city}`;
  const budgetRange = { min: budgetMin, max: budgetMax, currency: budgetCurrency };
  const contact = {
    name: contactName,
    phone: contactPhone,
    email: contactEmail || null,
    whatsapp_preferred: whatsappPreferred,
  };

  const { data: workspace, error: workspaceError } = await service
    .from('workspaces')
    .insert({
      name: title,
      description: `Public prefab RFQ submitted from Mihad for ${label} in ${city}.`,
      analysis_brief: [
        `Prefab RFQ: ${label}`,
        `City: ${city}`,
        `Land status: ${landStatus}`,
        `Budget: ${budgetMin ?? '...'} - ${budgetMax} ${budgetCurrency}`,
        timeline ? `Timeline: ${timeline}` : null,
      ].filter(Boolean).join('\n'),
      workspace_type: 'project',
      workspace_kind: 'mihad_buyer_desk',
      workspace_domain: 'prefab',
      icon: 'home',
      color: '#1f6b4f',
      owner_id: ownerId,
      status: 'active',
      preparation_status: 'submitted',
      preparation_metadata: {
        seed_source: 'public_prefab_rfq',
        public_rfq: true,
        submitted_at: createdAt,
        product_lane: 'prefab',
        source_channel: 'public_web',
        contact_preference: whatsappPreferred ? 'whatsapp' : 'phone',
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
      entity_type: 'individual',
      metadata_json: {
        intake_source: 'public_prefab_rfq',
        public_rfq: true,
        contact,
      },
    })
    .select('id')
    .single();

  if (buyerError || !buyerEntity?.id) {
    return jsonError(buyerError?.message || 'Could not create buyer entity.', 500, 'buyer_create_failed');
  }

  const { data: mandate, error: mandateError } = await service
    .from('buyer_mandates')
    .insert({
      workspace_id: workspace.id,
      buyer_entity_id: buyerEntity.id,
      user_id: ownerId,
      title,
      status: 'active',
      target_country_codes: ['SA'],
      target_locations_json: [city],
      budget_range_json: budgetRange,
      budget_currency: budgetCurrency,
      use_case: useCase || label,
      purpose: 'prefab_project',
      timeline,
      readiness_state: 'public_intake',
      constraints_json: {
        land_status: landStatus,
        project_type: projectType,
        target_size: sizeSqm || null,
        rooms: rooms || null,
        style_reference: styleReference || null,
        model_reference: modelReference || null,
        scope_needs: scopeNeeds,
      },
      notes,
      metadata_json: {
        intake_source: 'public_prefab_rfq',
        public_rfq: true,
        no_raw_financial_documents: true,
        contact_preference: whatsappPreferred ? 'whatsapp' : 'phone',
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
      city,
      country_code: 'SA',
      land_status: landStatus,
      use_case: useCase || label,
      prefab_category: projectType,
      budget_range_json: budgetRange,
      target_size_json: {
        label: sizeSqm || null,
        rooms: rooms || null,
      },
      delivery_timeline: timeline,
      document_refs_json: [],
      scope_needs_json: {
        scope_needs: scopeNeeds,
        style_reference: styleReference || null,
        model_reference: modelReference || null,
      },
      contact_preference: whatsappPreferred ? 'whatsapp' : 'phone',
      qualification_json: {
        contact,
        public_submission: true,
        readiness: {
          land_status: landStatus,
          has_budget: true,
          has_city: true,
        },
      },
      metadata_json: {
        intake_source: 'public_prefab_rfq',
        public_rfq: true,
        no_raw_financial_documents: true,
        notes,
      },
    })
    .select('id, status')
    .single();

  if (rfqError || !rfq?.id) {
    return jsonError(rfqError?.message || 'Could not create RFQ.', 500, 'rfq_create_failed');
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
      external_thread_id: `public-rfq:${rfq.id}`,
      status: 'open',
      last_message_at: createdAt,
      state_json: {
        source: 'public_prefab_rfq',
        contact_preference: whatsappPreferred ? 'whatsapp' : 'phone',
      },
    })
    .select('id')
    .maybeSingle();

  await service.from('agent_events').insert({
    workspace_id: workspace.id,
    mandate_id: mandate.id,
    rfq_id: rfq.id,
    thread_id: thread?.id ?? null,
    created_by: ownerId,
    channel: 'web',
    event_direction: 'inbound',
    event_type: 'public_rfq_submitted',
    body_text: `${contactName} requested quotes for ${label} in ${city}.`,
    event_payload: {
      project_type: projectType,
      city,
      land_status: landStatus,
      budget_range: budgetRange,
      timeline,
      scope_needs: scopeNeeds,
      contact,
    },
  });

  return NextResponse.json({
    rfq_id: rfq.id,
    mandate_id: mandate.id,
    buyer_entity_id: buyerEntity.id,
    workspace_id: workspace.id,
    status: rfq.status || 'submitted',
    whatsapp_url: buildWhatsappUrl({ rfqId: rfq.id, projectType: label, city, phone: contactPhone }),
  });
}
