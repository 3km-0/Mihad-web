import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type MoyasarToken = {
  id?: string;
  status?: string;
  brand?: string | null;
  month?: string | number | null;
  year?: string | number | null;
  name?: string | null;
  last_four?: string | null;
  message?: string | null;
};

const TRIAL_DAYS = 7;
const TRIAL_TIER = 'pro';
const TRIAL_PERIOD = 'monthly';

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

function normalizeTokenId(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError('Not authenticated', 401);
  }

  const body = (await request.json().catch(() => null)) as { token_id?: unknown } | null;
  const tokenId = normalizeTokenId(body?.token_id);
  if (!tokenId) {
    return jsonError('Moyasar token id is required', 400);
  }

  const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY;
  if (!moyasarSecretKey) {
    return jsonError('Moyasar is not configured', 503, 'moyasar_not_configured');
  }

  const service = await createServiceClient();
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select(
      'id, subscription_tier, subscription_status, subscription_expires_at, payment_source, subscription_trial_consumed_at'
    )
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return jsonError('Profile not found', 404);
  }

  const status = String(profile.subscription_status || '').toLowerCase();
  const hasCurrentMoyasarSubscription =
    profile.payment_source === 'moyasar' &&
    profile.subscription_tier === TRIAL_TIER &&
    (status === 'trialing' || status === 'active');

  if (profile.subscription_trial_consumed_at && !hasCurrentMoyasarSubscription) {
    return jsonError('This account has already used its free trial.', 409, 'trial_consumed');
  }

  const tokenResponse = await fetch(`https://api.moyasar.com/v1/tokens/${encodeURIComponent(tokenId)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${moyasarSecretKey}:`).toString('base64')}`,
    },
    cache: 'no-store',
  });

  if (!tokenResponse.ok) {
    return jsonError('Unable to verify card token with Moyasar.', 502, 'token_lookup_failed');
  }

  const token = (await tokenResponse.json()) as MoyasarToken;
  if (token.id !== tokenId || String(token.status || '').toLowerCase() !== 'active') {
    return jsonError(token.message || 'Card verification is not complete.', 400, 'token_not_active');
  }

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const cardMonth = parseNumber(token.month);
  const cardYear = parseNumber(token.year);

  await service
    .from('payment_methods')
    .update({ is_default: false, updated_at: now.toISOString() })
    .eq('user_id', user.id)
    .eq('is_active', true);

  const { data: existingMethod } = await service
    .from('payment_methods')
    .select('id')
    .eq('user_id', user.id)
    .eq('moyasar_token', tokenId)
    .eq('is_active', true)
    .maybeSingle();

  let paymentMethodId = existingMethod?.id as string | undefined;
  if (paymentMethodId) {
    await service
      .from('payment_methods')
      .update({
        card_last_four: token.last_four || null,
        card_brand: token.brand ? token.brand.toLowerCase() : null,
        card_holder_name: token.name || null,
        card_expiry_month: cardMonth,
        card_expiry_year: cardYear,
        is_default: true,
        updated_at: now.toISOString(),
      })
      .eq('id', paymentMethodId);
  } else {
    const { data: method, error: methodError } = await service
      .from('payment_methods')
      .insert({
        user_id: user.id,
        moyasar_token: tokenId,
        card_last_four: token.last_four || null,
        card_brand: token.brand ? token.brand.toLowerCase() : null,
        card_holder_name: token.name || null,
        card_expiry_month: cardMonth,
        card_expiry_year: cardYear,
        is_default: true,
        is_active: true,
      })
      .select('id')
      .single();

    if (methodError || !method) {
      return jsonError('Failed to save payment method.', 500);
    }
    paymentMethodId = method.id as string;
  }

  const { error: paymentError } = await service.from('subscription_payments').insert({
    user_id: user.id,
    payment_method_id: paymentMethodId,
    amount_cents: 0,
    currency: 'SAR',
    status: 'trialing',
    subscription_tier: TRIAL_TIER,
    subscription_period: TRIAL_PERIOD,
    billing_period_start: now.toISOString(),
    billing_period_end: trialEndsAt.toISOString(),
    metadata: {
      source: 'web_onboarding_trial',
      trial_days: TRIAL_DAYS,
      renewal_price_sar: 199,
      card_last_four: token.last_four || null,
      card_brand: token.brand || null,
    },
  });

  if (paymentError) {
    return jsonError('Failed to create trial billing record.', 500);
  }

  const { error: updateError } = await service
    .from('profiles')
    .update({
      subscription_tier: TRIAL_TIER,
      subscription_period: TRIAL_PERIOD,
      subscription_status: 'trialing',
      subscription_expires_at: trialEndsAt.toISOString(),
      payment_source: 'moyasar',
      subscription_auto_renew: true,
      subscription_cancelled_at: null,
      grace_period_ends_at: null,
      subscription_trial_started_at: now.toISOString(),
      subscription_trial_consumed_at: profile.subscription_trial_consumed_at || now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return jsonError('Failed to activate trial.', 500);
  }

  return NextResponse.json({
    success: true,
    subscription_status: 'trialing',
    tier: TRIAL_TIER,
    period: TRIAL_PERIOD,
    expires_at: trialEndsAt.toISOString(),
    renewal_price_sar: 199,
  });
}
