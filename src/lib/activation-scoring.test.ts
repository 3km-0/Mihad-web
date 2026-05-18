import { describe, expect, it } from 'vitest';
import { canRouteOperator, scoreActivationRequest } from './activation-scoring';

describe('scoreActivationRequest', () => {
  it('routes strong protected tenant economics to operator candidate', () => {
    const result = scoreActivationRequest({
      partyType: 'tenant',
      businessActivity: 'vehicle showroom',
      crStatus: 'yes',
      city: 'Riyadh',
      requiredLandAreaSqm: '1200',
      monthlyBudget: '18000',
      tenantMonthlyRent: '18000',
      leaseTermMonths: '24',
      depositReadiness: '3_months',
      timeline: 'urgent',
      locationFlexibility: 'yes',
      tenantCommitment: 'yes',
      permitPath: 'yes',
      revenueShareOpen: 'yes',
      supplierFlexibleLease: 'yes',
      modularInstallPermission: 'yes',
      subleasePermission: 'yes',
      removalRights: 'yes',
      landRent: '3000',
      modularUnitLease: '4500',
      maintenanceReserve: '1000',
      reserveMonths: '6',
    });

    expect(result.route_recommendation).toBe('operator_candidate');
    expect(result.fixed_cost_coverage).toBeGreaterThanOrEqual(1.5);
    expect(result.hard_stops).toEqual([]);
  });

  it('keeps tenant demand broker/manager when operator rights are missing', () => {
    const result = scoreActivationRequest({
      partyType: 'tenant',
      businessActivity: 'project office',
      crStatus: 'yes',
      city: 'Jeddah',
      requiredLandAreaSqm: '600',
      monthlyBudget: '12000',
      leaseTermMonths: '12',
      depositReadiness: '2_months',
      timeline: 'soon',
      tenantCommitment: 'yes',
      landRent: '4000',
      modularUnitLease: '3000',
    });

    expect(result.route_recommendation).toBe('broker_manager');
    expect(result.hard_stops).toContain('no_explicit_sublease_right');
    expect(result.hard_stops).toContain('no_removal_right');
  });

  it('routes landowners and suppliers to their operating queues', () => {
    expect(scoreActivationRequest({ partyType: 'landowner', city: 'Riyadh', requiredLandAreaSqm: '900' }).route_recommendation).toBe('land_supply');
    expect(scoreActivationRequest({ partyType: 'supplier', unitTypes: 'offices', serviceAreas: 'Riyadh' }).route_recommendation).toBe('supplier_panel');
  });

  it('blocks operator routing for every hard stop and allows cleared checklists', () => {
    const stops = [
      'no_tenant_commitment',
      'no_explicit_sublease_right',
      'no_removal_right',
      'no_clear_permit_path',
      'weak_fixed_cost_coverage',
      'operator_reserve_missing',
      'no_modular_install_permission',
    ];

    for (const stop of stops) {
      expect(canRouteOperator({ hard_stops: [stop] }).allowed).toBe(false);
    }
    expect(canRouteOperator({ hard_stops: [] }, { hard_stops: [] }).allowed).toBe(true);
  });
});
