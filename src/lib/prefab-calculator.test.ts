import { describe, expect, it } from 'vitest';
import { calculatePrefabProject, calculatorResultToRequestQuery } from './prefab-calculator';

describe('calculatePrefabProject', () => {
  it('returns a high-confidence planning range when site facts are present', () => {
    const result = calculatePrefabProject({
      useType: 'retail_kiosk',
      city: 'Riyadh',
      sizeSqm: '80',
      categorySlug: 'retail-kiosks',
      timeline: 'within 3 months',
      budgetSar: '350000',
      landStatus: 'owned',
      utilitiesReady: 'yes',
      siteAccessReady: 'yes',
      commercialPreference: 'buy',
    });

    expect(result.confidence).toBe('high');
    expect(result.prefabRange.low).toBeGreaterThan(0);
    expect(result.nextSteps).toContain('compare_suppliers');
    expect(result.nextSteps).toContain('i_have_land');
    expect(result.nextSteps).not.toContain('find_land');
  });

  it('suggests land help and missing info for early concepts without land', () => {
    const result = calculatePrefabProject({
      useType: 'project office',
      city: '',
      sizeSqm: '',
      categorySlug: 'modular-offices',
      timeline: '',
      budgetSar: '',
      landStatus: 'needed',
      utilitiesReady: 'unknown',
      siteAccessReady: 'unknown',
      commercialPreference: 'lease',
    });

    expect(result.confidence).toBe('low');
    expect(result.brief.needsLandHelp).toBe(true);
    expect(result.nextSteps).toContain('find_land');
    expect(result.missingInfo).toContain('land_or_site_fit');
  });

  it('builds a compatible request handoff URL', () => {
    const input = {
      useType: 'modular_office',
      city: 'Jeddah',
      sizeSqm: '120',
      categorySlug: 'modular-offices',
      timeline: 'Q4',
      budgetSar: '500000',
      landStatus: 'needed' as const,
      utilitiesReady: 'partial' as const,
      siteAccessReady: 'partial' as const,
      commercialPreference: 'lease' as const,
      modelReference: 'model-123',
    };
    const url = calculatorResultToRequestQuery(input, calculatePrefabProject(input));
    expect(url).toContain('/request-quote?');
    expect(url).toContain('city=Jeddah');
    expect(url).toContain('model=model-123');
  });
});
