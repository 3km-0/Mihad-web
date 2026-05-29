#!/usr/bin/env node
/**
 * Grant or extend a subscription tier on a user profile (service-role only).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
 *     node scripts/grant-subscription-tier.mjs \\
 *       --user-id 15bcf5c2-9233-4e75-98e5-775961bd7d8c \\
 *       --tier pro \\
 *       --months 12
 *
 * Optional:
 *   --email user@example.com   (resolved to user id when --user-id omitted)
 *   --dry-run
 */

import { createClient } from '@supabase/supabase-js';

function parseArgs(argv) {
  const out = {
    userId: null,
    email: null,
    tier: 'pro',
    months: 12,
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--user-id') out.userId = argv[++i];
    else if (arg === '--email') out.email = argv[++i];
    else if (arg === '--tier') out.tier = argv[++i];
    else if (arg === '--months') out.months = Number(argv[++i]);
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function usage() {
  console.log(`Usage:
  node scripts/grant-subscription-tier.mjs --user-id <uuid> [--tier pro] [--months 12]
  node scripts/grant-subscription-tier.mjs --email user@example.com [--tier pro] [--months 12]
`);
}

const args = parseArgs(process.argv);
if (args.help || (!args.userId && !args.email)) {
  usage();
  process.exit(args.help ? 0 : 1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.INTERNAL_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or INTERNAL_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveUserId() {
  if (args.userId) return args.userId;
  const email = String(args.email || '').trim().toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, subscription_tier, subscription_status, subscription_expires_at')
    .ilike('email', email)
    .limit(2);
  if (error) throw new Error(`Profile lookup failed: ${error.message}`);
  if (!data?.length) throw new Error(`No profile found for email ${email}`);
  if (data.length > 1) throw new Error(`Multiple profiles match email ${email}`);
  return data[0];
}

async function main() {
  const existing = args.userId
    ? (
        await supabase
          .from('profiles')
          .select('id, email, subscription_tier, subscription_status, subscription_expires_at, payment_source')
          .eq('id', args.userId)
          .maybeSingle()
      ).data
    : await resolveUserId();

  if (!existing?.id) {
    throw new Error('Profile not found');
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + (Number.isFinite(args.months) ? args.months : 12));

  const patch = {
    subscription_tier: args.tier,
    subscription_status: 'active',
    subscription_expires_at: expiresAt.toISOString(),
    payment_source: 'manual',
    grace_period_ends_at: null,
    updated_at: new Date().toISOString(),
  };

  console.log('Current profile:', {
    id: existing.id,
    email: existing.email,
    subscription_tier: existing.subscription_tier,
    subscription_status: existing.subscription_status,
    subscription_expires_at: existing.subscription_expires_at,
    payment_source: existing.payment_source,
  });
  console.log('Patch:', patch);

  if (args.dryRun) {
    console.log('Dry run — no changes written.');
    return;
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', existing.id)
    .select('id, email, subscription_tier, subscription_status, subscription_expires_at, payment_source')
    .single();

  if (error) throw new Error(`Update failed: ${error.message}`);

  const effectiveTier = await supabase.rpc('get_effective_subscription_tier_for_user', {
    p_user_id: existing.id,
  });

  console.log('Updated profile:', updated);
  console.log('Effective tier RPC:', effectiveTier.data);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
