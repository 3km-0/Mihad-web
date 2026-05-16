import { describe, expect, it } from 'vitest';
import { intentToOnboardingDraft, type MihadScoutIntent } from './mihad-scout';

const baseIntent: MihadScoutIntent = {
  locale: 'en',
  raw_language: 'en',
  target_country_codes: ['SA'],
  city: ['Riyadh'],
  districts: [],
  property_type: 'villa',
  budget_min: null,
  budget_max: 2_500_000,
  monthly_payment_max: null,
  currency: 'SAR',
  purpose: 'family_use',
  readiness: 'ready',
  financing_posture: 'financing_ready',
  timeline: '1_to_3_months',
  must_haves: [],
  avoid: [],
  confidence: 0.8,
  missing_fields: [],
};

describe('intentToOnboardingDraft', () => {
  it('prefills the acquisition onboarding draft from a scout intent', () => {
    const draft = intentToOnboardingDraft(baseIntent);

    expect(draft.source).toBe('mihad_home_scout');
    expect(draft.data.city).toBe('Riyadh');
    expect(draft.data.targetCountries).toEqual(['SA']);
    expect(draft.data.assetType).toBe('villa');
    expect(draft.data.budgetMax).toBe('2500000');
    expect(draft.data.liquidityClass).toBe('financing_ready');
    expect(draft.data.workspaceName).toBe('Mihad Riyadh search');
  });
});
