-- One-off: grant Core (pro) to abdullah@watd.co — run in Supabase SQL Editor (service role).
-- User id: 15bcf5c2-9233-4e75-98e5-775961bd7d8c

UPDATE public.profiles
SET
  subscription_tier = 'pro',
  subscription_status = 'active',
  subscription_expires_at = NOW() + INTERVAL '12 months',
  payment_source = 'manual',
  grace_period_ends_at = NULL,
  updated_at = NOW()
WHERE id = '15bcf5c2-9233-4e75-98e5-775961bd7d8c';
