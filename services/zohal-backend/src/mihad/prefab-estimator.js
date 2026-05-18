function text(value) {
  return String(value || "").trim();
}

function number(value, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function categoryRate(category = "") {
  const raw = text(category).toLowerCase();
  if (/showroom|retail|cafe|مطعم|معرض|retail_pod/.test(raw)) return { low: 2100, base: 2800, high: 3800 };
  if (/office|project|site|مكتب|project_office/.test(raw)) return { low: 1600, base: 2200, high: 3000 };
  if (/yard|storage|logistics|ساحة|مستودع/.test(raw)) return { low: 900, base: 1400, high: 2100 };
  return { low: 1500, base: 2300, high: 3400 };
}

export function buildPrefabEstimate({ rfq = {}, option = {}, body = {} } = {}) {
  const request = rfq.metadata_json?.activation_request || rfq.qualification_json?.activation_request || {};
  const economics = rfq.metadata_json?.activation_economics || rfq.qualification_json?.activation_economics || {};
  const category = body.prefab_category || rfq.prefab_category || request.business_activity || request.unit_types || "commercial_pod";
  const sizeSqm = number(body.structure_size_sqm, 0)
    || number(request.structure_size_sqm, 0)
    || number(rfq.target_size_json?.structure_size_sqm, 0)
    || number(rfq.target_size_json?.label, 0)
    || 100;
  const landAreaSqm = number(request.required_land_area_sqm, 0) || number(option.area_sqm, 0);
  const rates = categoryRate(category);
  const siteComplexity = landAreaSqm >= 2000 ? 1.12 : landAreaSqm >= 1000 ? 1.06 : 1;
  const installRemoval = number(body.install_removal_estimate, 0)
    || number(economics.install_removal_amortization, 0) * 24
    || Math.round(sizeSqm * 260 * siteComplexity);
  const foundationUtilities = number(body.site_prep_estimate, 0) || Math.round(sizeSqm * 320 * siteComplexity);
  const monthlyLease = number(body.monthly_modular_lease, 0)
    || number(economics.modular_unit_lease, 0)
    || Math.round(sizeSqm * rates.base * 0.022);
  const evidence = [
    body.supplier_quote_id ? "supplier_quote" : null,
    body.rate_card_id ? "rate_card" : null,
    option.source_url ? "land_option_source" : null,
  ].filter(Boolean);
  const confidence = clamp(0.42 + (evidence.length * 0.16) + (sizeSqm ? 0.12 : 0), 0.35, 0.9);

  return {
    mode: "prefab_planning_range",
    estimate_kind: "prefab",
    pricing_status: evidence.includes("supplier_quote") ? "supplier_evidenced" : "planning_range",
    category,
    structure_size_sqm: sizeSqm,
    low_total: Math.round(sizeSqm * rates.low + installRemoval * 0.85 + foundationUtilities * 0.85),
    base_total: Math.round(sizeSqm * rates.base + installRemoval + foundationUtilities),
    high_total: Math.round(sizeSqm * rates.high + installRemoval * 1.25 + foundationUtilities * 1.3),
    monthly_lease_range: {
      low: Math.round(monthlyLease * 0.82),
      base: monthlyLease,
      high: Math.round(monthlyLease * 1.22),
    },
    install_removal_estimate: installRemoval,
    site_prep_foundation_utilities_estimate: foundationUtilities,
    maintenance_sla_assumption: text(body.maintenance_sla) || request.maintenance_sla || "supplier SLA needed before quote",
    confidence_score: Number(confidence.toFixed(2)),
    missing_evidence: [
      evidence.includes("supplier_quote") ? null : "supplier_quote_or_rate_card",
      request.permit_path ? null : "permit_path",
      request.modular_install_permission ? null : "site_install_permission",
    ].filter(Boolean),
    provenance: {
      source: "mihad_prefab_estimator_v1",
      supplier_quote_id: body.supplier_quote_id || null,
      rate_card_id: body.rate_card_id || null,
      note: "Planning range only; not a supplier quote.",
    },
    generated_at: new Date().toISOString(),
  };
}
