import {
  createAcquisitionWorkspace,
  normalizeBuyBox,
  type BuyBoxInput,
  type MihadBudgetCurrency,
  type MihadCountryCode,
  type MihadLiquidityClass,
  type MihadMandateTimeline,
  type MihadPurpose,
} from '@/lib/acquisition-workspace';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { zohalBackendUrl } from '@/lib/zohal-backend';
import { NextResponse } from 'next/server';

type CompleteOnboardingRequest = {
  persona?: string;
  display_name?: string;
  workspace_name?: string;
  buy_box?: BuyBoxInput;
  target_country_codes?: MihadCountryCode[] | string[];
  purpose?: MihadPurpose | null;
  timeline?: MihadMandateTimeline | null;
  liquidity_class?: MihadLiquidityClass | null;
  budget_currency?: MihadBudgetCurrency | null;
  budget_range?: { min?: number | string | null; max?: number | string | null; currency?: string | null };
  preferences?: Record<string, unknown>;
};

function jsonError(message: string, status: number, code?: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, code, ...extra }, { status });
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStoredPersona(value: unknown) {
  const normalized = normalizeText(value);
  if (['student', 'lawyer', 'analyst', 'researcher', 'operator', 'other'].includes(normalized)) {
    return normalized;
  }
  return normalized ? 'operator' : null;
}

function getInternalBackendToken() {
  return (
    process.env.INTERNAL_FUNCTION_JWT ||
    process.env.INTERNAL_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();
}

function internalBackendHeaders() {
  const token = getInternalBackendToken();
  if (!token) return null;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    apikey: token,
    'x-internal-function-jwt': token,
  };
}

async function findExistingOnboardingWorkspace(service: Awaited<ReturnType<typeof createServiceClient>>, userId: string) {
  const { data: workspace } = await service
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .contains('preparation_metadata', { seed_source: 'onboarding_buyer_rfq' })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!workspace?.id) return null;

  const { data: mandate } = await (service as any)
    .from('buyer_mandates')
    .select('id')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    workspaceId: workspace.id as string,
    mandateId: mandate?.id as string | undefined,
    rfqId: undefined as string | undefined,
  };
}

async function triggerSearchRunProcessing(searchRunId: string) {
  const headers = internalBackendHeaders();
  if (!headers) return { attempted: false, error: 'Internal backend token is not configured.' };

  const response = await fetch(zohalBackendUrl(`/api/mihad/v1/source-runs/${searchRunId}/execute`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ search_run_id: searchRunId }),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  return {
    attempted: true,
    ok: response.ok,
    status: response.status,
    payload,
    error: response.ok ? null : String(payload?.message || payload?.error || `Search processor returned ${response.status}`),
  };
}

async function createSearchRunFallback(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  input: {
    workspaceId: string;
    mandateId: string | null;
    userId: string;
    queryDescription: string;
    limits: Record<string, unknown>;
  }
) {
  if (!input.mandateId) {
    throw new Error('Workspace mandate is missing, so the search run cannot be created.');
  }

  const { data, error } = await (service as any)
    .from('source_runs')
    .insert({
      workspace_id: input.workspaceId,
      mandate_id: input.mandateId,
      user_id: input.userId,
      status: 'queued',
      trigger_kind: 'manual',
      sources_json: ['aqar', 'bayut'],
      query_text: input.queryDescription,
      limits_json: input.limits,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create onboarding source run.');
  }

  return data as Record<string, unknown>;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user || !session.access_token) {
    return jsonError('Not authenticated', 401);
  }

  const body = (await request.json().catch(() => null)) as CompleteOnboardingRequest | null;
  if (!body) {
    return jsonError('Invalid onboarding payload', 400);
  }

  const workspaceName = normalizeText(body.workspace_name);
  if (!workspaceName) {
    return jsonError('Workspace name is required', 400, 'workspace_name_required');
  }

  const service = await createServiceClient();
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('phone_verified_at, onboarding_completed_at')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    return jsonError('Profile not found', 404);
  }

  if (profile.onboarding_completed_at) {
    return jsonError('Onboarding is already complete.', 409, 'already_completed');
  }

  if (!profile.phone_verified_at) {
    return jsonError('Verify your phone number before creating a workspace.', 409, 'phone_not_verified');
  }

  const targetCountryCodes = Array.isArray(body.target_country_codes) && body.target_country_codes.length
    ? (body.target_country_codes as MihadCountryCode[])
    : ['SA'] as MihadCountryCode[];
  const isMihadIntake = true;
  const existingWorkspace = await findExistingOnboardingWorkspace(service, session.user.id);
  const workspaceResult = existingWorkspace
    ? {
        workspaceId: existingWorkspace.workspaceId,
        mandateId: existingWorkspace.mandateId || null,
        rfqId: existingWorkspace.rfqId || null,
        buyBox: normalizeBuyBox(body.buy_box || {}),
      }
    : await createAcquisitionWorkspace(service, {
        userId: session.user.id,
        name: workspaceName,
        description: null,
        buyBox: body.buy_box || {},
        seedSource: 'onboarding_buyer_rfq',
        workspaceKind: 'mihad_buyer_desk',
        mihad: {
          targetCountryCodes,
          purpose: body.purpose ?? null,
          mandateTimeline: body.timeline ?? null,
          liquidityClass: body.liquidity_class ?? null,
          budgetCurrency: (body.budget_currency || 'SAR') as MihadBudgetCurrency,
          preferences: {
            ...(body.preferences ?? {}),
          },
        },
      });

  const { workspaceId, mandateId, rfqId, buyBox } = workspaceResult;

  const instructionParts = [
    `Find ${buyBox.asset_type} prefab options`,
    buyBox.city ? `in ${buyBox.city}` : null,
    buyBox.districts.length ? `focused on ${buyBox.districts.join(', ')}` : null,
    buyBox.budget_max_sar ? `up to ${buyBox.budget_max_sar} SAR` : null,
    buyBox.strategy ? `for ${buyBox.strategy}` : null,
  ].filter(Boolean);
  const queryDescription = instructionParts.join(' ');
  const searchLimits = {
    max_result_pages_per_source: 1,
    max_detail_pages_per_source: 8,
    per_source_timeout_ms: 45000,
    per_run_timeout_ms: 120000,
    retry_transient_failures: true,
  };

  let searchPayload: Record<string, unknown> | null = null;
  let searchRunError: string | null = null;
  let searchRunProcessing: Record<string, unknown> | null = null;

  try {
    const headers = internalBackendHeaders();
    if (!headers) {
      throw new Error('Internal backend token is not configured.');
    }

    const landSourcingPath = rfqId
      ? `/api/mihad/v1/rfqs/${rfqId}/land-sourcing`
      : `/api/mihad/v1/activation-mandates/${mandateId}/land-sourcing`;
    const searchResponse = await fetch(zohalBackendUrl(landSourcingPath), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: session.user.id,
        workspace_id: workspaceId,
        mandate_id: mandateId,
        rfq_id: rfqId ?? null,
        trigger_kind: 'activation_land_sourcing',
        query_text: queryDescription,
        sources: ['aqar', 'bayut'],
        limits: searchLimits,
      }),
      cache: 'no-store',
    });

    searchPayload = await searchResponse.json().catch(() => ({}));
    if (!searchResponse.ok) {
      searchRunError =
        String(searchPayload?.message || searchPayload?.error || '').trim() ||
        `Source run workflow returned ${searchResponse.status}`;
    }
  } catch (error) {
    searchRunError = error instanceof Error ? error.message : 'Source run request failed';
  }

  const searchRun =
    (searchPayload?.data as { search_run?: Record<string, unknown>; queue?: { enqueued?: boolean } } | undefined)?.search_run ||
    (searchPayload?.data as { source_run?: Record<string, unknown>; queue?: { enqueued?: boolean } } | undefined)?.source_run ||
    (searchPayload?.search_run as Record<string, unknown> | undefined) ||
    (searchPayload?.source_run as Record<string, unknown> | undefined) ||
    null;
  const queue =
    (searchPayload?.data as { queue?: { enqueued?: boolean } } | undefined)?.queue ||
    (searchPayload?.queue as { enqueued?: boolean } | undefined) ||
    null;
  const searchRunId = typeof searchRun?.id === 'string' ? searchRun.id : '';

  if (searchRunId && queue?.enqueued !== true) {
    searchRunProcessing = await triggerSearchRunProcessing(searchRunId);
    if (searchRunProcessing.error) {
      searchRunError = String(searchRunProcessing.error);
    }
  }

  const now = new Date().toISOString();
  const { error: updateError } = await service
    .from('profiles')
    .update({
      display_name: normalizeText(body.display_name) || null,
      onboarding_persona: normalizeStoredPersona(body.persona),
      onboarding_completed_at: now,
      updated_at: now,
    })
    .eq('id', session.user.id);

  if (updateError) {
    return jsonError('Workspace created, but onboarding could not be marked complete.', 500, 'profile_update_failed', {
      workspace_id: workspaceId,
      mandate_id: mandateId,
      rfq_id: rfqId ?? null,
    });
  }

  return NextResponse.json({
    success: true,
    workspace_id: workspaceId,
    mandate_id: mandateId,
    rfq_id: rfqId ?? null,
    workspace_kind: 'mihad_buyer_desk',
    search_run: searchRun,
    search_run_processing: searchRunProcessing,
    search_run_error: searchRunError,
  });
}
