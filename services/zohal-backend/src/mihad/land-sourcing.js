import { createHash, randomUUID } from "node:crypto";

function text(value) {
  return String(value || "").trim();
}

function firstValue(value, fallback = "") {
  return Array.isArray(value) && value.length ? text(value[0]) : fallback;
}

function cacheKeyForActivationRequest(request = {}) {
  return createHash("sha256").update(JSON.stringify({
    rfq_id: request.rfq_id || null,
    city: request.city || null,
    district: request.district || null,
    activity: request.business_activity || null,
    land_area: request.required_land_area_sqm || null,
  })).digest("hex");
}

export function buildActivationLandSourcingPayload({
  rfq,
  mandate,
  activationRequest,
  sourceRunId = randomUUID(),
  sources = ["aqar", "bayut", "partner_land"],
} = {}) {
  const request = activationRequest || rfq?.metadata_json?.activation_request || rfq?.qualification_json?.activation_request || {};
  const city = request.city || firstValue(request.city, firstValue(mandate?.target_locations_json, "Riyadh"));
  const district = request.district || firstValue(request.districts, null);
  const businessActivity = request.businessActivity || request.business_activity || null;
  const requiredLandArea = Number(request.requiredLandAreaSqm || request.required_land_area_sqm || 0) || null;
  const key = cacheKeyForActivationRequest({
    rfq_id: rfq?.id,
    city,
    district,
    business_activity: businessActivity,
    required_land_area_sqm: requiredLandArea,
  });
  return {
    search_run: {
      id: sourceRunId,
      workspace_id: rfq?.workspace_id || mandate?.workspace_id || null,
      mandate_id: rfq?.mandate_id || mandate?.id || null,
      user_id: rfq?.user_id || mandate?.user_id || null,
      trigger_kind: "activation_land_sourcing",
      sources_json: sources,
      query_json: {
        cache_key: key,
        city,
        district,
        business_activity: businessActivity,
        required_land_area_sqm: requiredLandArea,
        structure_size_sqm: Number(request.sizeSqm || request.structure_size_sqm || 0) || null,
        monthly_budget: Number(request.monthlyBudget || request.monthly_budget || 0) || null,
        operator_only: true,
      },
      limits_json: {
        max_result_pages_per_source: 2,
        max_detail_pages_per_source: 8,
        per_source_timeout_ms: 30_000,
        per_run_timeout_ms: 75_000,
      },
    },
    mandate: {
      ...(mandate || {}),
      buy_box_json: {
        ...(mandate?.buy_box_json || {}),
        activation_land_sourcing: true,
        city,
        district,
        asset_type: "commercial_land",
      },
    },
    suppressed_candidates: [],
    preview_only: false,
    operator_only: true,
  };
}
