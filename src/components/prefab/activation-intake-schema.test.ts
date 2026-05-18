import { describe, expect, it } from 'vitest';
import {
  buildActivationRequestPayload,
  initialActivationIntakeState,
  validateActivationStep,
  type ActivationIntakeState,
} from './activation-intake-schema';

function state(patch: Partial<ActivationIntakeState>): ActivationIntakeState {
  return { ...initialActivationIntakeState, ...patch };
}

describe('activation intake schema', () => {
  it('builds tenant payload with economics and contact fields', () => {
    const payload = buildActivationRequestPayload(state({
      audienceType: 'tenant',
      business_activity: 'vehicle_showroom',
      city: 'Riyadh',
      required_land_area_sqm: '1500',
      monthly_budget: '80000',
      modular_unit_lease: '18000',
      name: 'Tenant Lead',
      phone: '+966500000000',
    }));

    expect(payload.audience_type).toBe('tenant');
    expect(payload.business_activity).toBe('vehicle_showroom');
    expect(payload.budget_range.max).toBe('80000');
    expect(payload.tenant_monthly_rent).toBe('80000');
    expect(payload.contact.phone).toBe('+966500000000');
  });

  it('validates landowner and supplier path facts independently', () => {
    expect(validateActivationStep(state({ audienceType: 'landowner', required_land_area_sqm: '2500' }), 2)).toBe(true);
    expect(validateActivationStep(state({ audienceType: 'supplier', unit_types: 'office pods' }), 2)).toBe(true);
    expect(validateActivationStep(state({ audienceType: 'tenant' }), 2)).toBe(false);
  });
});
