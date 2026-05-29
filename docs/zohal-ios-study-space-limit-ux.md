# Zohal iOS — study / readiness space limit banner

The web repo now centralizes user-facing copy for study-space limits in `src/lib/plan-limit-errors.ts`. Mirror the same behavior in the iOS app when blocking **Create readiness space**.

## Replace vague copy

**Avoid**

- Title only: `Plan limit reached`
- Counter only: `Active study spaces: 6 of 0` with no explanation

**Prefer**

- **Title:** `Study space limit` / `حد مساحات الدراسة`
- **Body (zero allowance):** Explain plan name, counts, and actions: upgrade to Core (Pro), restore App Store subscription, or archive/delete a space.
- **Duration:** Keep the banner **≥ 18 seconds** (or until the user dismisses). Do not auto-hide after 2–3 seconds.

## Suggested English body (6 of 0, free tier)

> Your Free plan does not include new study spaces (you have 6 active, allowance 0). Upgrade to Core (Pro) or restore your App Store subscription, then try again.

## Primary actions

1. **Upgrade** → subscription / paywall screen  
2. **Manage spaces** → list of readiness spaces (archive/delete)  
3. **Restore purchases** (when `payment_source` is Apple)

## Data to show

Load from `get_user_limits_status` / limit RPC when available:

- `current` active study spaces  
- `max` from `get_plan_limit(effective_tier, 'max_study_spaces')`  
- `effective_tier` from `get_effective_subscription_tier_for_user`

## Backend

Apply `supabase/migrations/20260529120000_pro_study_space_limits.sql` so **Pro** includes `max_study_spaces: 20` and **Free** uses `3` (not `0`).
