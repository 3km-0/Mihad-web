import { LAND_STATUS_OPTIONS, PREFAB_PROJECT_TYPES } from '@/lib/prefab-content';
import type { ActivationPartyType } from '@/lib/activation-scoring';

export type ActivationRequestPayload = {
  audience_type: ActivationPartyType;
  project_type: string;
  city: string;
  district: string;
  land_status: string;
  business_activity: string;
  cr_status: string;
  required_land_area_sqm: string;
  size_sqm: string;
  rooms: string;
  use_case: string;
  style_reference: string;
  model_reference: string;
  budget_range: { min: string; max: string; currency: 'SAR' };
  monthly_budget: string;
  lease_term_months: string;
  timeline: string;
  deposit_readiness: string;
  location_flexibility: boolean;
  tenant_commitment: boolean;
  permit_path: boolean;
  land_ownership_status: string;
  access_frontage: string;
  utilities_status: string;
  zoning_use: string;
  rent_expectation: string;
  revenue_share_open: boolean;
  modular_install_permission: boolean;
  sublease_permission: boolean;
  removal_rights: boolean;
  unit_types: string;
  lease_pricing_available: boolean;
  installation_terms: string;
  maintenance_sla: string;
  drawings_available: boolean;
  service_areas: string;
  supplier_flexible_lease: boolean;
  tenant_monthly_rent: string;
  land_rent: string;
  modular_unit_lease: string;
  install_removal_amortization: string;
  maintenance_reserve: string;
  target_coverage: string;
  reserve_months: string;
  scope_needs: string[];
  contact: {
    name: string;
    phone: string;
    email: string;
    whatsapp_preferred: boolean;
  };
  notes: string;
};

export type ActivationIntakeState = Omit<ActivationRequestPayload, 'audience_type' | 'project_type' | 'budget_range' | 'contact' | 'scope_needs'> & {
  audienceType: ActivationPartyType;
  projectType: string;
  budgetMin: string;
  budgetMax: string;
  scopeNeeds: string[];
  name: string;
  phone: string;
  email: string;
  whatsappPreferred: boolean;
};

export const audienceOptions: Array<{
  value: ActivationPartyType;
  titleAr: string;
  title: string;
  bodyAr: string;
  body: string;
  projectType: string;
}> = [
  {
    value: 'tenant',
    titleAr: 'أحتاج موقع تجاري',
    title: 'I need a commercial site',
    bodyAr: 'شركة أو نشاط يبحث عن أرض ووحدة جاهزة وتشغيل سريع.',
    body: 'A business looking for land, a modular unit, and fast activation.',
    projectType: 'commercial_site',
  },
  {
    value: 'landowner',
    titleAr: 'عندي أرض',
    title: 'I own land',
    bodyAr: 'مالك أرض تجارية أو شبه تجارية يريد تفعيلها بدخل واضح.',
    body: 'A landowner who wants to activate an idle plot with a clear income path.',
    projectType: 'land_activation',
  },
  {
    value: 'supplier',
    titleAr: 'أنا مورد مباني جاهزة',
    title: 'I provide modular units',
    bodyAr: 'مصنع أو مورد وحدات جاهزة للتأجير أو البيع والتركيب.',
    body: 'A modular supplier offering lease, sale, delivery, or installation.',
    projectType: 'supplier_application',
  },
];

export const initialActivationIntakeState: ActivationIntakeState = {
  audienceType: 'tenant',
  projectType: 'commercial_site',
  city: '',
  district: '',
  land_status: 'needed',
  business_activity: '',
  cr_status: '',
  required_land_area_sqm: '',
  size_sqm: '',
  rooms: '',
  use_case: '',
  style_reference: '',
  model_reference: '',
  monthly_budget: '',
  budgetMin: '',
  budgetMax: '',
  lease_term_months: '',
  timeline: '',
  deposit_readiness: '',
  location_flexibility: false,
  tenant_commitment: false,
  permit_path: false,
  land_ownership_status: '',
  access_frontage: '',
  utilities_status: '',
  zoning_use: '',
  rent_expectation: '',
  revenue_share_open: false,
  modular_install_permission: false,
  sublease_permission: false,
  removal_rights: false,
  unit_types: '',
  lease_pricing_available: false,
  installation_terms: '',
  maintenance_sla: '',
  drawings_available: false,
  service_areas: '',
  supplier_flexible_lease: false,
  tenant_monthly_rent: '',
  land_rent: '',
  modular_unit_lease: '',
  install_removal_amortization: '',
  maintenance_reserve: '',
  target_coverage: '1.5',
  reserve_months: '',
  scopeNeeds: [],
  name: '',
  phone: '',
  email: '',
  whatsappPreferred: true,
  notes: '',
};

export function audienceFromInitial(value?: string): ActivationPartyType {
  if (value === 'landowner' || value === 'supplier' || value === 'tenant') return value;
  if (value === 'land_activation') return 'landowner';
  if (value === 'supplier_application') return 'supplier';
  return 'tenant';
}

export function projectTypeForAudience(audience: ActivationPartyType, fallback?: string) {
  if (fallback && PREFAB_PROJECT_TYPES.some((type) => type.value === fallback)) return fallback;
  return audienceOptions.find((option) => option.value === audience)?.projectType || 'commercial_site';
}

export function validateActivationStep(form: ActivationIntakeState, step: number) {
  if (step === 0) return Boolean(form.audienceType);
  if (step === 1) return Boolean(form.city.trim() || form.district.trim() || form.service_areas.trim());
  if (step === 2) {
    if (form.audienceType === 'tenant') return Boolean(form.business_activity.trim() || form.use_case.trim());
    if (form.audienceType === 'landowner') return Boolean(form.required_land_area_sqm.trim() || form.zoning_use.trim() || form.land_ownership_status.trim());
    return Boolean(form.unit_types.trim() || form.service_areas.trim());
  }
  if (step === 3) {
    if (form.audienceType === 'supplier') return Boolean(form.lease_pricing_available || form.monthly_budget.trim() || form.budgetMax.trim());
    return Boolean(form.monthly_budget.trim() || form.budgetMax.trim() || form.rent_expectation.trim());
  }
  if (step === 5) return Boolean(form.name.trim() && form.phone.trim());
  return true;
}

export function buildActivationRequestPayload(form: ActivationIntakeState): ActivationRequestPayload {
  return {
    audience_type: form.audienceType,
    project_type: form.projectType,
    city: form.city,
    district: form.district,
    land_status: form.land_status,
    business_activity: form.business_activity,
    cr_status: form.cr_status,
    required_land_area_sqm: form.required_land_area_sqm,
    size_sqm: form.size_sqm,
    rooms: form.rooms,
    use_case: form.use_case,
    style_reference: form.style_reference,
    model_reference: form.model_reference,
    budget_range: { min: form.budgetMin, max: form.budgetMax || form.monthly_budget, currency: 'SAR' },
    monthly_budget: form.monthly_budget,
    lease_term_months: form.lease_term_months,
    timeline: form.timeline,
    deposit_readiness: form.deposit_readiness,
    location_flexibility: form.location_flexibility,
    tenant_commitment: form.tenant_commitment,
    permit_path: form.permit_path,
    land_ownership_status: form.land_ownership_status,
    access_frontage: form.access_frontage,
    utilities_status: form.utilities_status,
    zoning_use: form.zoning_use,
    rent_expectation: form.rent_expectation,
    revenue_share_open: form.revenue_share_open,
    modular_install_permission: form.modular_install_permission,
    sublease_permission: form.sublease_permission,
    removal_rights: form.removal_rights,
    unit_types: form.unit_types,
    lease_pricing_available: form.lease_pricing_available,
    installation_terms: form.installation_terms,
    maintenance_sla: form.maintenance_sla,
    drawings_available: form.drawings_available,
    service_areas: form.service_areas,
    supplier_flexible_lease: form.supplier_flexible_lease,
    tenant_monthly_rent: form.tenant_monthly_rent || form.monthly_budget,
    land_rent: form.land_rent || form.rent_expectation,
    modular_unit_lease: form.modular_unit_lease,
    install_removal_amortization: form.install_removal_amortization,
    maintenance_reserve: form.maintenance_reserve,
    target_coverage: form.target_coverage,
    reserve_months: form.reserve_months,
    scope_needs: form.scopeNeeds,
    contact: {
      name: form.name,
      phone: form.phone,
      email: form.email,
      whatsapp_preferred: form.whatsappPreferred,
    },
    notes: form.notes,
  };
}

export const defaultLandStatus = LAND_STATUS_OPTIONS[0]?.value || 'needed';
