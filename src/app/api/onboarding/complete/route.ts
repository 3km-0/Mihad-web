import { createAcquisitionWorkspace, type BuyBoxInput } from '@/lib/acquisition-workspace';
import { createClient } from '@/lib/supabase/server';
import { zohalBackendUrl } from '@/lib/zohal-backend';
import { NextResponse } from 'next/server';

type CompleteOnboardingRequest = {
  persona?: string;
  display_name?: string;
  workspace_name?: string;
  buy_box?: BuyBoxInput;
};

function jsonError(message: string, status: number, code?: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, code, ...extra }, { status });
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('phone_verified_at, subscription_status, subscription_tier, subscription_expires_at, onboarding_completed_at')
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

  if (profile.subscription_status !== 'trialing' || profile.subscription_tier !== 'pro') {
    return jsonError('Start your free trial before creating a workspace.', 409, 'trial_not_active');
  }

  const { workspaceId, mandateId, buyBox } = await createAcquisitionWorkspace(supabase, {
    userId: session.user.id,
    name: workspaceName,
    description: null,
    buyBox: body.buy_box || {},
    seedSource: 'onboarding_acquisition_journey',
  });

  const instructionParts = [
    `Find ${buyBox.asset_type} acquisition candidates`,
    buyBox.city ? `in ${buyBox.city}` : null,
    buyBox.districts.length ? `focused on ${buyBox.districts.join(', ')}` : null,
    buyBox.budget_max_sar ? `up to ${buyBox.budget_max_sar} SAR` : null,
    buyBox.strategy ? `for ${buyBox.strategy}` : null,
  ].filter(Boolean);

  const searchResponse = await fetch(
    zohalBackendUrl(`/api/acquisition/v1/workspaces/${workspaceId}/search-runs`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        query_description: instructionParts.join(' '),
        sourcing_instruction: instructionParts.join(' '),
        sources: ['aqar', 'bayut'],
        limits: {
          max_result_pages_per_source: 1,
          max_detail_pages_per_source: 8,
          per_source_timeout_ms: 45000,
          per_run_timeout_ms: 120000,
          retry_transient_failures: true,
        },
      }),
      cache: 'no-store',
    }
  );

  const searchPayload = await searchResponse.json().catch(() => ({}));
  if (!searchResponse.ok) {
    return jsonError(
      searchPayload?.message || searchPayload?.error || 'Failed to start acquisition search workflow.',
      searchResponse.status,
      'search_run_failed',
      { workspace_id: workspaceId, mandate_id: mandateId }
    );
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      display_name: normalizeText(body.display_name) || null,
      onboarding_persona: normalizeText(body.persona) || null,
      onboarding_completed_at: now,
      updated_at: now,
    })
    .eq('id', session.user.id);

  if (updateError) {
    return jsonError('Workspace created, but onboarding could not be marked complete.', 500, 'profile_update_failed', {
      workspace_id: workspaceId,
      mandate_id: mandateId,
    });
  }

  return NextResponse.json({
    success: true,
    workspace_id: workspaceId,
    mandate_id: mandateId,
    search_run: searchPayload?.data?.search_run || searchPayload?.search_run || null,
  });
}
