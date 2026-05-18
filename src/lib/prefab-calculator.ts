export type PrefabCalculatorInput = {
  useType: string;
  city: string;
  sizeSqm: string | number;
  categorySlug: string;
  timeline: string;
  budgetSar: string | number;
  landStatus: 'owned' | 'identified' | 'needed' | 'unknown';
  utilitiesReady: 'yes' | 'partial' | 'no' | 'unknown';
  siteAccessReady: 'yes' | 'partial' | 'no' | 'unknown';
  commercialPreference: 'lease' | 'buy' | 'not_sure';
  modelReference?: string;
  supplierReference?: string;
};

export type CalculatorProjectBrief = {
  city: string;
  useType: string;
  sizeSqm: number;
  landStatus: PrefabCalculatorInput['landStatus'];
  commercialPreference: PrefabCalculatorInput['commercialPreference'];
  needsLandHelp: boolean;
};

export type PrefabCalculatorResult = {
  brief: CalculatorProjectBrief;
  currency: 'SAR';
  prefabRange: { low: number; base: number; high: number };
  installRemovalAllowance: number;
  sitePrepAllowance: number;
  timelineRange: string;
  supplierFit: string[];
  missingInfo: string[];
  confidence: 'low' | 'medium' | 'high';
  nextSteps: Array<'compare_suppliers' | 'find_land' | 'i_have_land' | 'save_workspace'>;
  planningNote: string;
};

const CATEGORY_RATE_PER_SQM: Record<string, number> = {
  'prefab-homes': 2600,
  'prefab-villas': 2900,
  'chalets-cabins': 2350,
  majlis: 2450,
  'farmhouses-rest-houses': 2300,
  'modular-offices': 2200,
  'staff-housing': 1850,
  'clinics-classrooms': 3100,
  'retail-kiosks': 2800,
};

function numberFrom(value: string | number, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value || '').replace(/[^\d.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function roundTo(value: number, step = 1000) {
  return Math.round(value / step) * step;
}

function timelineFor(sizeSqm: number, timeline: string) {
  const text = timeline.toLowerCase();
  if (text.includes('urgent') || text.includes('month') || text.includes('شهر')) return '6-12 weeks after supplier confirmation';
  if (sizeSqm >= 500) return '14-24 weeks after scope and site readiness';
  if (sizeSqm >= 180) return '10-18 weeks after scope and site readiness';
  return '6-14 weeks after scope and site readiness';
}

export function calculatePrefabProject(input: PrefabCalculatorInput): PrefabCalculatorResult {
  const sizeSqm = Math.min(Math.max(numberFrom(input.sizeSqm, 120), 20), 2500);
  const budget = numberFrom(input.budgetSar);
  const rate = CATEGORY_RATE_PER_SQM[input.categorySlug] || 2400;
  const fabricationBase = sizeSqm * rate;
  const installRemovalAllowance = Math.max(15000, fabricationBase * 0.08);
  const utilitiesFactor = input.utilitiesReady === 'yes' ? 0.04 : input.utilitiesReady === 'partial' ? 0.08 : 0.12;
  const accessFactor = input.siteAccessReady === 'yes' ? 0.02 : input.siteAccessReady === 'partial' ? 0.04 : 0.07;
  const sitePrepAllowance = Math.max(20000, fabricationBase * (utilitiesFactor + accessFactor));
  const base = fabricationBase + installRemovalAllowance + sitePrepAllowance;
  const missingInfo: string[] = [];

  if (!input.city.trim()) missingInfo.push('city_or_delivery_location');
  if (!numberFrom(input.sizeSqm)) missingInfo.push('target_size');
  if (!budget) missingInfo.push('budget_range');
  if (input.landStatus === 'needed' || input.landStatus === 'unknown') missingInfo.push('land_or_site_fit');
  if (input.utilitiesReady !== 'yes') missingInfo.push('utilities_readiness');
  if (input.siteAccessReady !== 'yes') missingInfo.push('site_access');

  const supplierFit = [
    input.commercialPreference === 'lease' ? 'suppliers_with_clear_lease_terms' : 'suppliers_with_sale_and_install_scope',
    input.utilitiesReady === 'yes' ? 'standard_installation_scope' : 'turnkey_or_site_coordination_support',
    input.siteAccessReady === 'yes' ? 'standard_delivery_access' : 'delivery_and_crane_access_review',
  ];

  const needsLandHelp = input.landStatus === 'needed' || input.landStatus === 'unknown';
  const confidence = missingInfo.length <= 1 ? 'high' : missingInfo.length <= 3 ? 'medium' : 'low';
  const nextSteps: PrefabCalculatorResult['nextSteps'] = ['compare_suppliers'];
  if (needsLandHelp) nextSteps.push('find_land');
  if (!needsLandHelp) nextSteps.push('i_have_land');
  nextSteps.push('save_workspace');

  return {
    brief: {
      city: input.city.trim(),
      useType: input.useType.trim() || input.categorySlug,
      sizeSqm,
      landStatus: input.landStatus,
      commercialPreference: input.commercialPreference,
      needsLandHelp,
    },
    currency: 'SAR',
    prefabRange: {
      low: roundTo(base * 0.85),
      base: roundTo(base),
      high: roundTo(base * 1.25),
    },
    installRemovalAllowance: roundTo(installRemovalAllowance),
    sitePrepAllowance: roundTo(sitePrepAllowance),
    timelineRange: timelineFor(sizeSqm, input.timeline),
    supplierFit,
    missingInfo,
    confidence,
    nextSteps,
    planningNote: 'Planning range only. Supplier quote, site evidence, and authority requirements can materially change the final price.',
  };
}

export function calculatorResultToRequestQuery(input: PrefabCalculatorInput, result: PrefabCalculatorResult) {
  const params = new URLSearchParams({
    audience: 'tenant',
    project_type: input.useType || 'commercial_site',
    city: result.brief.city,
    size_sqm: String(result.brief.sizeSqm),
    land_status: result.brief.landStatus,
    use_case: input.useType || input.categorySlug,
    budget_max: String(numberFrom(input.budgetSar) || result.prefabRange.base),
    notes: `Calculator estimate: ${result.prefabRange.low}-${result.prefabRange.high} SAR. Confidence: ${result.confidence}.`,
  });
  if (input.modelReference) params.set('model', input.modelReference);
  if (input.supplierReference) params.set('supplier', input.supplierReference);
  return `/request-quote?${params.toString()}`;
}
