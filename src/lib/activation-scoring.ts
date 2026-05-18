export type ActivationPartyType = 'tenant' | 'landowner' | 'supplier';

export type ActivationScoringInput = {
  partyType: ActivationPartyType;
  businessActivity?: string;
  crStatus?: string;
  city?: string;
  district?: string;
  requiredLandAreaSqm?: unknown;
  requiredStructureSizeSqm?: unknown;
  monthlyBudget?: unknown;
  leaseTermMonths?: unknown;
  depositReadiness?: string;
  timeline?: string;
  locationFlexibility?: string;
  tenantCommitment?: string;
  permitPath?: string;
  landOwnershipStatus?: string;
  accessFrontage?: string;
  utilitiesStatus?: string;
  zoningUse?: string;
  rentExpectation?: unknown;
  revenueShareOpen?: string;
  modularInstallPermission?: string;
  subleasePermission?: string;
  removalRights?: string;
  unitTypes?: string;
  leasePricingAvailable?: string;
  installationTerms?: string;
  maintenanceSla?: string;
  drawingsAvailable?: string;
  serviceAreas?: string;
  supplierFlexibleLease?: string;
  tenantMonthlyRent?: unknown;
  landRent?: unknown;
  modularUnitLease?: unknown;
  installRemovalAmortization?: unknown;
  maintenanceReserve?: unknown;
  targetCoverage?: unknown;
  reserveMonths?: unknown;
};

export type ActivationScoringResult = {
  party_type: ActivationPartyType;
  tenant_demand_score: number;
  land_fit_score: number;
  modular_fit_score: number;
  operator_worthy_score: number;
  fixed_monthly_obligations: number | null;
  tenant_rent: number | null;
  fixed_cost_coverage: number | null;
  target_coverage: number;
  route_recommendation: 'tenant_demand' | 'land_supply' | 'supplier_panel' | 'broker_manager' | 'operator_candidate' | 'needs_review';
  hard_stops: string[];
  missing_fields: string[];
  summary: string;
};

function asText(value: unknown) {
  return String(value ?? '').trim();
}

function yes(value: unknown) {
  return ['yes', 'true', 'ready', 'available', 'signed', 'explicit', 'open', 'clear', 'flexible', '2_months', '3_months'].includes(asText(value).toLowerCase());
}

function no(value: unknown) {
  return ['no', 'false', 'none', 'not_available', 'blocked'].includes(asText(value).toLowerCase());
}

export function activationNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = asText(value).replace(/[^\d.]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function positive(value: unknown) {
  const parsed = activationNumber(value);
  return parsed !== null && parsed > 0;
}

function leaseMonths(value: unknown) {
  return activationNumber(value) ?? 0;
}

function timelineIsUrgent(value: unknown) {
  const raw = asText(value).toLowerCase();
  return /urgent|soon|30|immediate|now|عاجل|قريب|شهر/.test(raw);
}

function activityLooksSimple(value: unknown) {
  const raw = asText(value).toLowerCase();
  if (!raw) return false;
  return /(showroom|display|equipment|office|project|yard|storage|kiosk|cafe|retail|معرض|معدات|مكتب|ساحة|تخزين|كشك|مقهى)/.test(raw);
}

function tenantDemandScore(input: ActivationScoringInput) {
  let score = 0;
  if (yes(input.crStatus)) score += 2;
  if (yes(input.depositReadiness) || input.depositReadiness === '2_months' || input.depositReadiness === '3_months') score += 3;
  if (positive(input.monthlyBudget) || positive(input.tenantMonthlyRent)) score += 3;
  if (activityLooksSimple(input.businessActivity)) score += 3;
  if (leaseMonths(input.leaseTermMonths) >= 12) score += 2;
  if (yes(input.locationFlexibility)) score += 1;
  if (timelineIsUrgent(input.timeline)) score += 1;
  return score;
}

function landFitScore(input: ActivationScoringInput) {
  let score = 0;
  if (asText(input.city) || asText(input.district)) score += 2;
  if (positive(input.requiredLandAreaSqm)) score += 2;
  if (yes(input.landOwnershipStatus) || /deed|صك|owned/i.test(asText(input.landOwnershipStatus))) score += 2;
  if (asText(input.accessFrontage)) score += 2;
  if (asText(input.utilitiesStatus)) score += 2;
  if (asText(input.zoningUse)) score += 2;
  if (yes(input.revenueShareOpen)) score += 1;
  if (yes(input.modularInstallPermission)) score += 2;
  if (yes(input.subleasePermission)) score += 2;
  if (yes(input.removalRights)) score += 2;
  return Math.min(score, 15);
}

function modularFitScore(input: ActivationScoringInput) {
  let score = 0;
  if (asText(input.unitTypes) || asText(input.requiredStructureSizeSqm)) score += 2;
  if (yes(input.leasePricingAvailable) || positive(input.modularUnitLease)) score += 3;
  if (asText(input.installationTerms) || positive(input.installRemovalAmortization)) score += 2;
  if (yes(input.maintenanceSla)) score += 2;
  if (yes(input.drawingsAvailable)) score += 2;
  if (asText(input.serviceAreas)) score += 1;
  return Math.min(score, 12);
}

function fixedObligations(input: ActivationScoringInput) {
  const landRent = activationNumber(input.landRent) ?? activationNumber(input.rentExpectation) ?? 0;
  const unitLease = activationNumber(input.modularUnitLease) ?? 0;
  const amortization = activationNumber(input.installRemovalAmortization) ?? 0;
  const reserve = activationNumber(input.maintenanceReserve) ?? 0;
  const total = landRent + unitLease + amortization + reserve;
  return total > 0 ? total : null;
}

function operatorScore(input: ActivationScoringInput, coverage: number | null) {
  let score = 0;
  if (coverage !== null && coverage >= 1.5) score += 5;
  if (yes(input.tenantCommitment)) score += 4;
  if (yes(input.revenueShareOpen) || ((activationNumber(input.landRent) ?? 0) > 0 && (activationNumber(input.landRent) ?? 0) < (activationNumber(input.tenantMonthlyRent) ?? Infinity) * 0.3)) score += 4;
  if (yes(input.supplierFlexibleLease)) score += 3;
  if (yes(input.permitPath)) score += 3;
  if (yes(input.subleasePermission)) score += 3;
  if (yes(input.removalRights)) score += 3;
  if (input.depositReadiness === '2_months' || input.depositReadiness === '3_months') score += 3;
  if ((activationNumber(input.reserveMonths) ?? 0) >= 6) score += 3;
  return score;
}

function hardStops(input: ActivationScoringInput, coverage: number | null, targetCoverage: number) {
  const stops: string[] = [];
  if (!yes(input.tenantCommitment)) stops.push('no_tenant_commitment');
  if (!yes(input.subleasePermission)) stops.push('no_explicit_sublease_right');
  if (!yes(input.removalRights)) stops.push('no_removal_right');
  if (!yes(input.permitPath)) stops.push('no_clear_permit_path');
  if (coverage === null || coverage < targetCoverage) stops.push('weak_fixed_cost_coverage');
  if ((activationNumber(input.reserveMonths) ?? 0) < 6) stops.push('operator_reserve_missing');
  if (no(input.modularInstallPermission)) stops.push('no_modular_install_permission');
  return stops;
}

function missingFields(input: ActivationScoringInput) {
  const missing: string[] = [];
  if (input.partyType === 'tenant') {
    if (!asText(input.businessActivity)) missing.push('business_activity');
    if (!asText(input.city) && !asText(input.district)) missing.push('target_location');
    if (!positive(input.monthlyBudget) && !positive(input.tenantMonthlyRent)) missing.push('monthly_budget');
    if (!positive(input.requiredLandAreaSqm)) missing.push('required_land_area');
    if (!asText(input.timeline)) missing.push('timeline');
  }
  if (input.partyType === 'landowner') {
    if (!asText(input.city) && !asText(input.district)) missing.push('plot_location');
    if (!positive(input.requiredLandAreaSqm)) missing.push('plot_size');
    if (!asText(input.landOwnershipStatus)) missing.push('ownership_status');
    if (!asText(input.rentExpectation) && !yes(input.revenueShareOpen)) missing.push('commercial_expectation');
  }
  if (input.partyType === 'supplier') {
    if (!asText(input.unitTypes)) missing.push('unit_types');
    if (!yes(input.leasePricingAvailable) && !positive(input.modularUnitLease)) missing.push('lease_or_price_terms');
    if (!asText(input.serviceAreas)) missing.push('service_areas');
  }
  return missing;
}

export function scoreActivationRequest(input: ActivationScoringInput): ActivationScoringResult {
  const targetCoverage = activationNumber(input.targetCoverage) ?? 1.5;
  const tenantRent = activationNumber(input.tenantMonthlyRent) ?? activationNumber(input.monthlyBudget);
  const fixed = fixedObligations(input);
  const coverage = tenantRent && fixed ? Number((tenantRent / fixed).toFixed(2)) : null;
  const tenantScore = tenantDemandScore(input);
  const landScore = landFitScore(input);
  const modularScore = modularFitScore(input);
  const operatorWorthiness = operatorScore(input, coverage);
  const stops = hardStops(input, coverage, targetCoverage);
  const missing = missingFields(input);

  let route: ActivationScoringResult['route_recommendation'] = 'needs_review';
  if (input.partyType === 'supplier') route = 'supplier_panel';
  if (input.partyType === 'landowner') route = 'land_supply';
  if (input.partyType === 'tenant') {
    route = tenantScore >= 8 ? 'broker_manager' : 'tenant_demand';
    if (operatorWorthiness >= 24 && stops.length === 0) route = 'operator_candidate';
  }

  return {
    party_type: input.partyType,
    tenant_demand_score: tenantScore,
    land_fit_score: landScore,
    modular_fit_score: modularScore,
    operator_worthy_score: operatorWorthiness,
    fixed_monthly_obligations: fixed,
    tenant_rent: tenantRent ?? null,
    fixed_cost_coverage: coverage,
    target_coverage: targetCoverage,
    route_recommendation: route,
    hard_stops: stops,
    missing_fields: missing,
    summary: route === 'operator_candidate'
      ? 'Operator candidate only if legal rights and reserves are verified.'
      : route === 'broker_manager'
        ? 'Route as broker/manager while learning from demand and supplier response.'
        : route === 'supplier_panel'
          ? 'Route to supplier onboarding and catalog review.'
          : route === 'land_supply'
            ? 'Route to land supply review against active tenant demand.'
            : 'Keep as demand intake until required facts are complete.',
  };
}
