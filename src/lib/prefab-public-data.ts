import { createServiceClient } from '@/lib/supabase/server';
import { PREFAB_CATEGORIES } from '@/lib/prefab-content';

type JsonRecord = Record<string, unknown>;

export type PublicSupplier = {
  id: string;
  slug: string;
  name: string;
  city: string;
  countryCode: string;
  languages: string[];
  status: string;
  verificationState: string;
  categories: string[];
  regionsServed: string[];
  warranty: JsonRecord;
  sla: JsonRecord;
  responseSlaMinutes: number | null;
  notes: string | null;
  modelCount: number;
  score: number | null;
  licenseSignals: string[];
  contact: JsonRecord;
};

export type PublicModel = {
  id: string;
  slug: string;
  name: string;
  modelType: string | null;
  useCase: string | null;
  sizeSqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  materialSummary: string | null;
  priceRange: JsonRecord;
  includedScope: string[];
  excludedScope: string[];
  deliveryRegions: string[];
  media: unknown[];
  status: string;
  supplier: PublicSupplier | null;
};

export type PublicFilters = {
  category?: string | null;
  region?: string | null;
  verification?: string | null;
  modelType?: string | null;
};

function arrayFrom(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function objectFrom(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

export function slugify(value: string, id?: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  const suffix = id ? `-${id.slice(-6)}` : '';
  return `${base || 'item'}${suffix}`;
}

function categoryTags(slug?: string | null) {
  if (!slug) return [];
  return PREFAB_CATEGORIES.find((category) => category.slug === slug)?.tags || [];
}

function hasServiceCredentials() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function mapSupplier(row: any, modelCountByPartner: Map<string, number>): PublicSupplier {
  const profile = Array.isArray(row.prefab_supplier_profiles)
    ? row.prefab_supplier_profiles[0]
    : row.prefab_supplier_profiles;
  const scorecard = Array.isArray(row.partner_scorecards)
    ? row.partner_scorecards[0]
    : row.partner_scorecards;
  const licensing = objectFrom(row.licensing_json);
  return {
    id: row.id,
    slug: slugify(row.display_name || 'supplier', row.id),
    name: row.display_name || 'Prefab supplier',
    city: row.city || 'Saudi Arabia',
    countryCode: row.country_code || 'SA',
    languages: arrayFrom(row.languages),
    status: row.status || 'candidate',
    verificationState: String(profile?.verification_state || 'unverified'),
    categories: arrayFrom(profile?.categories_json),
    regionsServed: arrayFrom(profile?.regions_served_json),
    warranty: objectFrom(profile?.warranty_json),
    sla: objectFrom(profile?.sla_json),
    responseSlaMinutes: typeof row.response_sla_minutes === 'number' ? row.response_sla_minutes : null,
    notes: row.notes || null,
    modelCount: modelCountByPartner.get(row.id) || 0,
    score: typeof scorecard?.composite_score === 'number' ? scorecard.composite_score : null,
    licenseSignals: arrayFrom(licensing.signals),
    contact: objectFrom(row.contact_json),
  };
}

function mapModel(row: any, supplierById: Map<string, PublicSupplier>): PublicModel {
  const included = objectFrom(row.included_scope_json);
  const excluded = objectFrom(row.excluded_scope_json);
  return {
    id: row.id,
    slug: slugify(row.model_name || 'model', row.id),
    name: row.model_name || 'Prefab model',
    modelType: row.model_type || null,
    useCase: row.use_case || null,
    sizeSqm: row.size_sqm === null || row.size_sqm === undefined ? null : Number(row.size_sqm),
    bedrooms: row.bedrooms ?? null,
    bathrooms: row.bathrooms ?? null,
    materialSummary: row.material_spec_summary || null,
    priceRange: objectFrom(row.price_range_json),
    includedScope: arrayFrom(included.included),
    excludedScope: arrayFrom(excluded.excluded),
    deliveryRegions: arrayFrom(row.delivery_regions_json),
    media: Array.isArray(row.media_refs_json) ? row.media_refs_json : [],
    status: row.status || 'draft',
    supplier: supplierById.get(row.partner_id) || null,
  };
}

export async function listPublicSuppliers(filters: PublicFilters = {}) {
  if (!hasServiceCredentials()) return [];

  const supabase = await createServiceClient();
  const [{ data: modelRows }, { data: supplierRows, error }] = await Promise.all([
    supabase.from('prefab_models').select('id, partner_id').eq('status', 'active'),
    supabase
      .from('partners')
      .select('*, prefab_supplier_profiles(*), partner_scorecards(*)')
      .eq('partner_kind', 'prefab_supplier')
      .in('status', ['candidate', 'onboarding', 'active'])
      .order('updated_at', { ascending: false }),
  ]);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const model of modelRows || []) {
    counts.set(model.partner_id, (counts.get(model.partner_id) || 0) + 1);
  }

  let suppliers = (supplierRows || []).map((row) => mapSupplier(row, counts));
  const tags = categoryTags(filters.category);
  if (tags.length) {
    suppliers = suppliers.filter((supplier) => supplier.categories.some((category) => tags.includes(category)));
  }
  if (filters.region) {
    const region = filters.region.toLowerCase();
    suppliers = suppliers.filter((supplier) => supplier.regionsServed.some((item) => item.toLowerCase().includes(region)));
  }
  if (filters.verification) {
    suppliers = suppliers.filter((supplier) => supplier.verificationState === filters.verification);
  }
  return suppliers;
}

export async function listPublicModels(filters: PublicFilters = {}) {
  const suppliers = await listPublicSuppliers({});
  if (!hasServiceCredentials()) return [];

  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('prefab_models')
    .select('*')
    .eq('status', 'active')
    .order('updated_at', { ascending: false });
  if (error) throw error;

  let models = (data || []).map((row) => mapModel(row, supplierById));
  const tags = categoryTags(filters.category);
  if (tags.length) {
    models = models.filter((model) => {
      const haystack = [model.modelType, model.useCase, ...(model.supplier?.categories || [])].filter(Boolean).join(' ');
      return tags.some((tag) => haystack.includes(tag));
    });
  }
  if (filters.modelType) {
    models = models.filter((model) => model.modelType === filters.modelType);
  }
  if (filters.region) {
    const region = filters.region.toLowerCase();
    models = models.filter((model) => model.deliveryRegions.some((item) => item.toLowerCase().includes(region)));
  }
  return models;
}

export async function getPublicSupplier(slugOrId: string) {
  const suppliers = await listPublicSuppliers({});
  return suppliers.find((supplier) => supplier.id === slugOrId || supplier.slug === slugOrId) || null;
}

export async function getPublicModel(slugOrId: string) {
  const models = await listPublicModels({});
  return models.find((model) => model.id === slugOrId || model.slug === slugOrId) || null;
}

export function formatPriceRange(priceRange: JsonRecord) {
  const currency = String(priceRange.currency || 'SAR');
  const min = typeof priceRange.min === 'number' ? priceRange.min : Number(priceRange.min || 0);
  const max = typeof priceRange.max === 'number' ? priceRange.max : Number(priceRange.max || 0);
  if (!min && !max) return 'Price depends on scope';
  const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  if (min && max) return `${formatter.format(min)}-${formatter.format(max)} ${currency}`;
  return `From ${formatter.format(min || max)} ${currency}`;
}

export function verificationLabel(state: string) {
  if (state === 'premium_verified') return 'Premium verified';
  if (state === 'verified') return 'Verified supplier';
  if (state === 'in_review') return 'Profile in review';
  return 'Listed supplier';
}
