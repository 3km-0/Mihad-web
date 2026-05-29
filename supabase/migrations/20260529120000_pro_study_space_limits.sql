-- Pro (Core) study/readiness space entitlements for Zohal app.
-- get_plan_limit(..., 'max_study_spaces') reads from subscription_plans.limits.

UPDATE public.subscription_plans
SET
  limits = COALESCE(limits, '{}'::jsonb) || jsonb_build_object('max_study_spaces', 20),
  features = COALESCE(features, '{}'::jsonb) || jsonb_build_object(
    'study_spaces', true,
    'readiness_spaces', true
  ),
  updated_at = NOW()
WHERE tier = 'pro';

-- Free tier: allow a small number so expired users see a clear upgrade path (not "6 of 0").
UPDATE public.subscription_plans
SET
  limits = COALESCE(limits, '{}'::jsonb) || jsonb_build_object('max_study_spaces', 3),
  updated_at = NOW()
WHERE tier = 'free';
