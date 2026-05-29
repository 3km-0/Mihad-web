import { describe, expect, it } from 'vitest';
import { buildStudySpaceLimitError, mapPlanLimitError, parsePlanLimitContext } from '@/lib/plan-limit-errors';

describe('plan-limit-errors', () => {
  it('parses active study spaces copy', () => {
    const ctx = parsePlanLimitContext({ message: 'Active study spaces: 6 of 0' });
    expect(ctx).toEqual({ limitKey: 'max_study_spaces', current: 6, max: 0, tier: undefined, effectiveTier: undefined });
  });

  it('maps zero allowance to upgrade guidance', () => {
    const err = buildStudySpaceLimitError({ current: 6, max: 0, tier: 'free' }, 'en');
    expect(err.title).toBe('Study space limit');
    expect(err.message).toContain('6 active');
    expect(err.action).toBe('upgrade');
    expect(err.durationMs).toBe(18_000);
  });

  it('detects study limit from backend payload', () => {
    const err = mapPlanLimitError({
      limit_key: 'max_study_spaces',
      current: 2,
      limit: 3,
      tier: 'pro',
    });
    expect(err?.title).toBe('Study space limit');
    expect(err?.message).toContain('2 of 3');
  });
});
