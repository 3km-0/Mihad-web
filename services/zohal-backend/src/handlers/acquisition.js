import { createHash } from "node:crypto";
import {
  createChatCompletion,
  extractOutputText,
} from "../analysis/ai-provider.js";
import { createHttpTask } from "../runtime/gcp.js";
import {
  getExpectedInternalToken,
  isInternalCaller,
  requireInternalCaller,
  verifySupabaseJwt,
} from "../runtime/internal-auth.js";
import { sendJson } from "../runtime/http.js";
import { createServiceClient } from "../runtime/supabase.js";
import { runRenovationCapexAgent } from "../renovation/agent.js";
import { assertWorkspaceWriteAccess } from "../renovation/catalog.js";
import { runAndPersistUnderwriting } from "../underwriting/persistence.js";
import { computeInvestmentScore } from "../market/investment-scorer.js";
import { planMihadBrokerAgentTurn } from "../mihad/agent.js";
import { executeMihadToolCall, mihadToolDefinitions } from "../mihad/agent-tools.js";

const SEARCH_TASK_QUEUE = String(
  process.env.GCP_ACQUISITION_SEARCH_TASK_QUEUE || "acquisition-search-runs",
).trim();
const REPORT_TASK_QUEUE = String(
  process.env.GCP_ACQUISITION_REPORT_TASK_QUEUE || "acquisition-report-runs",
).trim();
const TASKS_LOCATION = String(
  process.env.GCP_TASKS_LOCATION || process.env.GCP_WORKFLOWS_LOCATION || "",
).trim();
const BROWSER_WORKER_URL = String(
  process.env.ACQUISITION_BROWSER_WORKER_URL || "",
).trim().replace(/\/+$/, "");

const ALLOWED_SOURCES = new Set([
  "aqar",
  "bayut",
  "haraj",
  "developer_page",
  "broker_page",
  "idealista",
  "fotocasa",
  "property_finder",
]);
const MVP_SOURCES = ["aqar", "bayut"];
const OPPORTUNITY_SOURCE_CHANNELS = new Set([
  "whatsapp",
  "aqar",
  "bayut",
  "haraj",
  "user_provided_listing",
  "developer_page",
  "broker_page",
  "broker_whatsapp",
  "manual_operator",
  "operator",
  "api",
  "fotocasa",
  "idealista",
  "property_finder",
]);
const CANDIDATE_STATUSES = new Set([
  "submitted",
  "screening",
  "needs_info",
  "watch",
  "pursue",
  "pass",
  "promoted",
  "archived",
]);
const OPPORTUNITY_STAGES = new Set([
  "submitted",
  "screening",
  "needs_info",
  "workspace_created",
  "watch",
  "pursue",
  "intro_in_progress",
  "broker_introduced",
  "visit_requested",
  "quote_requested",
  "negotiation",
  "offer",
  "offer_drafted",
  "offer_submitted",
  "formal_diligence",
  "passed",
  "closed",
  "archived",
]);

const SUPPORTED_TARGET_COUNTRIES = new Set(["SA", "AE", "TR", "GR", "ES"]);
const SUPPORTED_BUDGET_CURRENCIES = new Set(["SAR", "AED", "TRY", "EUR", "USD", "GBP"]);
const MANDATE_PURPOSES = new Set([
  "investment",
  "family_use",
  "residency",
  "education",
  "relocation",
  "wealth_preservation",
]);
const MANDATE_TIMELINES = new Set([
  "immediate",
  "1_to_3_months",
  "3_to_6_months",
  "6_to_12_months",
  "exploratory",
]);
const MANDATE_LIQUIDITY_CLASSES = new Set([
  "cash_ready",
  "financing_ready",
  "mixed",
  "needs_financing_guidance",
]);
const BROKER_PARTNER_STATUSES = new Set([
  "candidate",
  "onboarding",
  "active",
  "suspended",
  "removed",
]);
const BROKER_EVENT_TYPES = new Set([
  "intro_sent",
  "first_response",
  "shortlist_provided",
  "shortlist_accepted",
  "shortlist_rejected",
  "visit_scheduled",
  "offer_drafted",
  "offer_submitted",
  "closing_completed",
  "buyer_complaint",
  "compliance_incident",
  "consent_revoked",
]);
const BUYER_PACKET_TTL_DAYS = 90;
const READINESS_LEVEL_MIN = 0;
const READINESS_LEVEL_MAX = 5;
const REQUIRED_BROKERAGE_READINESS_LEVEL = 4;
const FREE_ACTIVE_MANDATE_LIMIT = 1;
const FREE_WEEKLY_REPORT_LIMIT = 2;
const KYC_STATES = new Set(["not_started", "basic_verified", "buyer_verified", "brokerage_ready", "restricted", "escalated"]);
const BUYER_TYPES = new Set(["individual", "company", "family_office", "other"]);
const EVIDENCE_STATUSES = new Set(["pending", "self_declared", "verified", "rejected", "expired", "revoked"]);
const ACTION_TYPES_REQUIRING_BROKERAGE = new Set(["send_outreach", "send_offer", "send_negotiation_message"]);
const ACTION_TYPES_REQUIRING_BUYER_QUALIFICATION = new Set([
  "send_outreach",
  "share_readiness_signal",
  "share_document",
  "share_financing_packet",
  "send_offer",
  "send_negotiation_message",
]);
const STAGES_REQUIRING_BUYER_QUALIFICATION = new Set([
  "pursue",
  "visit_requested",
  "quote_requested",
  "negotiation",
  "offer",
  "offer_drafted",
  "offer_submitted",
  "formal_diligence",
  "closed",
]);
const ENTITLED_SUBSCRIPTION_STATUSES = new Set(["", "active", "past_due", "trialing", "canceled", "cancelled"]);
const PAID_ENTITLEMENT_TIERS = new Set(["pro", "premium", "team"]);
const EXTERNAL_ACTION_TYPES = new Set([
  "send_outreach",
  "share_readiness_signal",
  "share_document",
  "schedule_visit",
  "request_contractor_evaluation",
  "activate_buyer_broker",
  "share_financing_packet",
  "upload_property_document",
  "upload_financing_document",
  "add_listing_evidence",
  "pass_property",
  "close_property",
  "send_offer",
  "send_negotiation_message",
]);

function safeHeaderCookie(value) {
  return String(value || "").split(";")[0] || "";
}

async function verifyRedeemAccessUrl(redeemUrl, fallbackLiveUrl) {
  const normalizedRedeemUrl = String(redeemUrl || "").trim();
  const normalizedLiveUrl = String(fallbackLiveUrl || "").trim();
  if (!normalizedRedeemUrl) return false;
  const redeemResponse = await fetch(normalizedRedeemUrl, {
    method: "GET",
    redirect: "manual",
  }).catch(() => null);
  if (!redeemResponse || ![301, 302, 303, 307, 308].includes(redeemResponse.status)) {
    return false;
  }
  const cookie = safeHeaderCookie(redeemResponse.headers.get("set-cookie"));
  if (!cookie) return false;
  const redirectLocation = redeemResponse.headers.get("location");
  const probeUrl = redirectLocation
    ? new URL(redirectLocation, normalizedRedeemUrl).toString()
    : normalizedLiveUrl;
  if (!probeUrl) return false;
  const probeResponse = await fetch(probeUrl, {
    method: "GET",
    headers: { cookie, "user-agent": "zohal-deal-desk-backend-smoke/1.0" },
  }).catch(() => null);
  return Boolean(probeResponse?.ok);
}
const ACQUISITION_ACTION_DEFINITIONS = {
  add_listing_evidence: {
    stage: "submitted",
    label: "Add listing evidence",
    adapter: "files",
    result: "Creates a property folder and starts property analysis.",
  },
  request_missing_documents: {
    stage: "needs_info",
    label: "Request missing documents",
    adapter: "whatsapp",
    result: "Records broker outreach and marks diligence items as requested.",
  },
  schedule_visit: {
    stage: "visit_requested",
    label: "Schedule visit",
    adapter: "calendar",
    result: "Creates a calendar event and advances the visit stage.",
  },
  request_contractor_evaluation: {
    stage: "quote_requested",
    label: "Request contractor evaluation",
    adapter: "contractor",
    result: "Creates a contractor coordination thread and awaits a report.",
  },
  upload_property_document: {
    stage: "formal_diligence",
    label: "Upload diligence document",
    adapter: "files",
    result: "Triggers property corpus analysis and discrepancy checks.",
  },
  upload_financing_document: {
    stage: "buyer_readiness",
    label: "Upload financing document",
    adapter: "readiness",
    result: "Stores financing evidence privately without underwriting creditworthiness.",
  },
  share_financing_packet: {
    stage: "buyer_readiness",
    label: "Grant financing consent",
    adapter: "readiness",
    result: "Records consent before any financing status or document share.",
  },
  activate_buyer_broker: {
    stage: "brokerage",
    label: "Activate buyer broker",
    adapter: "brokerage",
    result: "Records buyer-side authority before negotiation actions.",
  },
  prepare_offer: {
    stage: "offer",
    label: "Prepare offer",
    adapter: "offer",
    result: "Drafts approval-gated offer support.",
  },
  send_offer: {
    stage: "offer",
    label: "Send offer",
    adapter: "offer",
    result: "Queues approval-gated offer delivery.",
  },
  pass_property: {
    stage: "passed",
    label: "Pass",
    adapter: "decision",
    result: "Records the terminal pass decision.",
  },
  close_property: {
    stage: "closed",
    label: "Close",
    adapter: "decision",
    result: "Records the completed acquisition decision.",
  },
};
const HIGH_RISK_SEVERITIES = new Set(["high", "critical"]);
const RESOLVED_FLAG_STATUSES = new Set(["resolved", "waived"]);

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeUuid(value) {
  return normalizeText(value).toLowerCase() || null;
}

function normalizeEntitlementTier(rawTier) {
  const value = normalizeText(rawTier).toLowerCase();
  if (["premium", "ultra"].includes(value)) return "premium";
  if (["team", "institutional"].includes(value)) return "team";
  if (["pro", "pro_plus", "student_monthly", "student_semester", "exam_prep", "educator"].includes(value)) return "pro";
  return "free";
}

function parseIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function profileHasActivePaidPlan(profile) {
  const tier = normalizeEntitlementTier(profile?.subscription_tier);
  if (!PAID_ENTITLEMENT_TIERS.has(tier)) return false;
  const now = Date.now();
  const graceEndsAt = parseIsoDate(profile?.grace_period_ends_at);
  if (graceEndsAt && graceEndsAt.getTime() > now) return true;
  const expiresAt = parseIsoDate(profile?.subscription_expires_at);
  if (expiresAt && expiresAt.getTime() <= now) return false;
  const status = normalizeText(profile?.subscription_status || "active").toLowerCase();
  return ENTITLED_SUBSCRIPTION_STATUSES.has(status);
}

function bearerToken(headers) {
  const raw = String(headers?.authorization || "").trim();
  return raw.toLowerCase().startsWith("bearer ") ? raw.slice("bearer ".length).trim() : raw;
}

function normalizeMissingItems(value) {
  if (Array.isArray(value)) return value.map((item) => normalizeText(item)).filter(Boolean);
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) => normalizeText(item) || normalizeText(key)).filter(Boolean);
  }
  return [];
}

function activeGrantCount(grants = []) {
  const now = Date.now();
  return grants.filter((grant) => {
    if (grant.revoked_at) return false;
    if (!grant.expires_at) return true;
    const expires = Date.parse(grant.expires_at);
    return !Number.isFinite(expires) || expires > now;
  }).length;
}

function resolvePrimaryAcquisitionAction({ opportunity, readinessProfile, brokerageActive, sharingGrants = [] }) {
  const stage = opportunity?.stage || "submitted";
  const missing = normalizeMissingItems(opportunity?.missing_info_json);
  if (!opportunity?.id) return { action_id: "add_listing_evidence", ...ACQUISITION_ACTION_DEFINITIONS.add_listing_evidence, blocked: false };
  if (!readinessProfile?.id) return { action_id: "upload_financing_document", ...ACQUISITION_ACTION_DEFINITIONS.upload_financing_document, blocked: false, secondary_action_id: "add_listing_evidence" };
  if (missing.length || ["needs_info", "screening", "pursue", "workspace_created"].includes(stage)) {
    return { action_id: "request_missing_documents", ...ACQUISITION_ACTION_DEFINITIONS.request_missing_documents, blocked: false, secondary_action_id: "upload_property_document" };
  }
  if (stage === "visit_requested") return { action_id: "request_contractor_evaluation", ...ACQUISITION_ACTION_DEFINITIONS.request_contractor_evaluation, blocked: false };
  if (stage === "quote_requested" || stage === "formal_diligence") return { action_id: "upload_property_document", ...ACQUISITION_ACTION_DEFINITIONS.upload_property_document, blocked: false };
  if (!brokerageActive) return { action_id: "activate_buyer_broker", ...ACQUISITION_ACTION_DEFINITIONS.activate_buyer_broker, blocked: false };
  if (activeGrantCount(sharingGrants) < 1) return { action_id: "share_financing_packet", ...ACQUISITION_ACTION_DEFINITIONS.share_financing_packet, blocked: false };
  if (["negotiation", "offer", "offer_drafted", "offer_submitted"].includes(stage)) return { action_id: "send_offer", ...ACQUISITION_ACTION_DEFINITIONS.send_offer, blocked: false, secondary_action_id: "pass_property" };
  if (stage === "closed") return { action_id: "close_property", ...ACQUISITION_ACTION_DEFINITIONS.close_property, blocked: false };
  return { action_id: "schedule_visit", ...ACQUISITION_ACTION_DEFINITIONS.schedule_visit, blocked: false, secondary_action_id: "pass_property" };
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function buildSourceFingerprint(candidate = {}) {
  const source = normalizeText(candidate.source).toLowerCase();
  const url = normalizeText(candidate.source_url || candidate.sourceUrl).toLowerCase().replace(/\/+$/, "");
  const title = normalizeText(candidate.title).toLowerCase();
  const district = normalizeText(candidate.district).toLowerCase();
  const price = normalizeText(candidate.asking_price || candidate.askingPrice);
  const seed = [source, url || title, district, price].join("|");
  return createHash("sha256").update(seed).digest("hex");
}

export function normalizeSources(value) {
  const input = Array.isArray(value) ? value : MVP_SOURCES;
  const normalized = input
    .map((source) => normalizeText(source).toLowerCase())
    .filter((source) => ALLOWED_SOURCES.has(source));
  const unique = [...new Set(normalized)];
  return unique.length ? unique : MVP_SOURCES;
}

export function normalizeSearchLimits(value = {}) {
  const input = value && typeof value === "object" ? value : {};
  return {
    max_result_pages_per_source: clampNumber(input.max_result_pages_per_source, 1, 1, 3),
    max_detail_pages_per_source: clampNumber(input.max_detail_pages_per_source, 8, 1, 20),
    per_source_timeout_ms: clampNumber(input.per_source_timeout_ms, 45_000, 10_000, 120_000),
    per_run_timeout_ms: clampNumber(input.per_run_timeout_ms, 120_000, 30_000, 300_000),
    retry_transient_failures: input.retry_transient_failures === false ? false : true,
  };
}

export function normalizeConfidence(value) {
  if (typeof value === "number") {
    if (value >= 0.75) return "high";
    if (value >= 0.45) return "medium";
    return "low";
  }
  const normalized = normalizeText(value).toLowerCase();
  return ["low", "medium", "high"].includes(normalized) ? normalized : "medium";
}

function numericConfidence(value) {
  const confidence = normalizeConfidence(value);
  if (confidence === "high") return 0.82;
  if (confidence === "low") return 0.32;
  return 0.58;
}

function mapDecisionToCandidateStatus(decision) {
  if (decision === "insufficient_info") return "needs_info";
  return CANDIDATE_STATUSES.has(decision) ? decision : "screening";
}

function opportunitySourceChannelForCandidate(candidate = {}) {
  const source = normalizeText(candidate.source).toLowerCase();
  return OPPORTUNITY_SOURCE_CHANNELS.has(source) ? source : "whatsapp";
}

function candidateNeedsContactAccess(candidate = {}) {
  const snapshot = candidate.limited_evidence_snapshot_json && typeof candidate.limited_evidence_snapshot_json === "object"
    ? candidate.limited_evidence_snapshot_json
    : {};
  const contact = snapshot.contact_access && typeof snapshot.contact_access === "object" ? snapshot.contact_access : {};
  return contact.status === "requires_sign_in" || contact.reason === "broker_contact_gated";
}

function normalizePhotoRefs(value) {
  const refs = Array.isArray(value) ? value : [];
  return [...new Set(refs
    .map((item) => normalizeText(item))
    .filter((item) => /^https?:\/\//i.test(item))
    .filter((item) => !/\.(svg|gif)(?:$|[?#])/i.test(item))
  )].slice(0, 12);
}

function normalizeCoordinate(value, min, max) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return Math.round(parsed * 1_000_000) / 1_000_000;
}

function normalizeLocationPrecision(value, hasCoordinates = false) {
  const normalized = normalizeText(value).toLowerCase();
  if (hasCoordinates) return "exact";
  return ["address_geocoded", "district", "city", "unknown"].includes(normalized) ? normalized : "unknown";
}

function normalizeLocationMetadata(...sources) {
  const merged = Object.assign({}, ...sources
    .filter((item) => item && typeof item === "object")
    .map((item) => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined && value !== null && value !== ""))));
  const latitude = normalizeCoordinate(merged.latitude ?? merged.lat, -90, 90);
  const longitude = normalizeCoordinate(merged.longitude ?? merged.lng ?? merged.lon, -180, 180);
  const hasCoordinates = latitude !== null && longitude !== null;
  const precision = normalizeLocationPrecision(merged.location_precision || merged.precision, hasCoordinates);
  const location = {
    ...(hasCoordinates ? { latitude, longitude } : {}),
    location_precision: precision,
    location_source: normalizeText(merged.location_source || merged.source) || (hasCoordinates ? "listing_json" : "fallback"),
    address: normalizeText(merged.address || merged.address_text || merged.location_text) || null,
    map_query: normalizeText(merged.map_query || merged.query) || (hasCoordinates ? `${latitude},${longitude}` : null),
  };
  if (!hasCoordinates && location.location_precision === "unknown" && location.address) {
    location.location_precision = "address_geocoded";
    location.location_source = location.location_source === "fallback" ? "address_text" : location.location_source;
  }
  return Object.fromEntries(Object.entries(location).filter(([, item]) => item !== null && item !== ""));
}

function locationMetadataFromDraft(draft = {}) {
  return normalizeLocationMetadata(
    draft.limited_evidence_snapshot_json?.location,
    draft.sourceSnapshot?.location,
    draft.location,
    {
      latitude: draft.latitude ?? draft.lat,
      longitude: draft.longitude ?? draft.lng ?? draft.lon,
      location_precision: draft.location_precision,
      location_source: draft.location_source,
      address: draft.address || draft.location_text,
      map_query: draft.map_query,
    },
  );
}

function locationMetadataFromCandidate(candidate = {}) {
  return normalizeLocationMetadata(
    candidate.limited_evidence_snapshot_json?.location,
    candidate.location,
    {
      latitude: candidate.latitude ?? candidate.lat,
      longitude: candidate.longitude ?? candidate.lng ?? candidate.lon,
      location_precision: candidate.location_precision,
      location_source: candidate.location_source,
      address: candidate.address || candidate.location_text,
      map_query: candidate.map_query,
    },
  );
}

function locationMetadataFromOpportunity(opportunity = {}) {
  return normalizeLocationMetadata(
    opportunity.metadata_json?.location,
    opportunity.result_json?.location,
    {
      latitude: opportunity.metadata_json?.latitude ?? opportunity.metadata_json?.lat ?? opportunity.result_json?.latitude ?? opportunity.result_json?.lat,
      longitude: opportunity.metadata_json?.longitude ?? opportunity.metadata_json?.lng ?? opportunity.metadata_json?.lon ?? opportunity.result_json?.longitude ?? opportunity.result_json?.lng ?? opportunity.result_json?.lon,
      location_precision: opportunity.metadata_json?.location_precision ?? opportunity.result_json?.location_precision,
      location_source: opportunity.metadata_json?.location_source ?? opportunity.result_json?.location_source,
      address: opportunity.address || opportunity.metadata_json?.address || opportunity.result_json?.address,
      map_query: opportunity.metadata_json?.map_query || opportunity.result_json?.map_query,
    },
  );
}

function normalizeComparable(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

function aliasesFor(value) {
  const normalized = normalizeComparable(value);
  const aliases = new Set([normalized]);
  if (normalized.includes("riyadh")) aliases.add("الرياض");
  if (normalized.includes("jeddah")) aliases.add("جده");
  if (normalized.includes("al arid") || normalized.includes("alarid") || normalized.includes("العرض") || normalized.includes("العارض")) aliases.add("العارض");
  if (normalized.includes("al narjis")) aliases.add("النرجس");
  if (normalized.includes("al malqa")) aliases.add("الملقا");
  if (normalized.includes("villa")) {
    aliases.add("فيلا");
    aliases.add("فلل");
  }
  if (normalized.includes("apartment")) {
    aliases.add("شقه");
    aliases.add("شقق");
  }
  return [...aliases].filter(Boolean);
}

function textMatchesAny(text, values) {
  const normalizedText = normalizeComparable(text);
  return values.some((value) => aliasesFor(value).some((alias) => alias && normalizedText.includes(alias)));
}

export function buildMandateFit(candidate = {}, mandate = null) {
  const buyBox = mandate?.buy_box_json && typeof mandate.buy_box_json === "object" ? mandate.buy_box_json : {};
  const targetLocations = Array.isArray(mandate?.target_locations_json) ? mandate.target_locations_json : [];
  const budget = mandate?.budget_range_json && typeof mandate.budget_range_json === "object" ? mandate.budget_range_json : {};
  const candidateText = [
    candidate.title,
    candidate.short_description,
    candidate.city,
    candidate.district,
    candidate.property_type,
  ].filter(Boolean).join(" ");
  const targetCity = buyBox.city || targetLocations.find((item) => /riyadh|jeddah|الرياض|جدة/i.test(String(item)));
  const targetDistricts = buyBox.district
    ? [buyBox.district]
    : targetLocations.filter((item) => !textMatchesAny(item, [targetCity].filter(Boolean)));
  const targetType = buyBox.property_type || buyBox.asset_type;
  const price = Number(candidate.asking_price || candidate.askingPrice || 0);
  const budgetMin = Number(budget.min || budget.minimum || 0);
  const budgetMax = Number(budget.max || budget.maximum || 0);

  const cityMatch = targetCity ? textMatchesAny([candidate.city, candidateText].filter(Boolean).join(" "), [targetCity]) : true;
  const districtText = [
    candidate.district,
    candidate.title,
    candidate.source_url,
  ].filter(Boolean).join(" ");
  const districtMatch = targetDistricts.length ? textMatchesAny(districtText, targetDistricts) : true;
  const typeMatch = targetType ? textMatchesAny([candidate.property_type, candidateText].filter(Boolean).join(" "), [targetType]) : true;
  const budgetMatch = price > 0 && (!budgetMax || price <= budgetMax) && (!budgetMin || price >= budgetMin);
  const overBudget = price > 0 && budgetMax > 0 && price > budgetMax;

  let score = 0;
  if (cityMatch) score += 30;
  if (districtMatch) score += 30;
  if (typeMatch) score += 25;
  if (budgetMatch) score += 15;
  if (overBudget) score -= 10;

  const hardMismatches = [
    targetCity && !cityMatch ? "city" : null,
    targetType && !typeMatch ? "property_type" : null,
  ].filter(Boolean);

  return {
    score: Math.max(0, Math.min(100, score)),
    city_match: Boolean(cityMatch),
    district_match: Boolean(districtMatch),
    property_type_match: Boolean(typeMatch),
    budget_match: Boolean(budgetMatch),
    over_budget: Boolean(overBudget),
    hard_mismatches: hardMismatches,
  };
}

export function buildScreeningOutput(candidate = {}, mandate = null) {
  const missing = [];
  if (!candidate.city && !candidate.district) missing.push("location");
  if (!candidate.asking_price && !candidate.askingPrice) missing.push("asking_price");
  if (!candidate.property_type && !candidate.propertyType) missing.push("property_type");
  if (!candidate.area_sqm && !candidate.areaSqm) missing.push("area");
  const hasPhotos = Array.isArray(candidate.photo_refs_json || candidate.photoRefs) &&
    (candidate.photo_refs_json || candidate.photoRefs).length > 0;
  if (!hasPhotos) missing.push("photos");
  if (candidateNeedsContactAccess(candidate)) missing.push("broker_contact_access");

  const fit = buildMandateFit(candidate, mandate);
  const mandateBudget = mandate?.budget_range_json && typeof mandate.budget_range_json === "object"
    ? mandate.budget_range_json
    : {};
  const price = Number(candidate.asking_price || candidate.askingPrice || 0);
  const budgetMax = Number(mandateBudget.max || mandateBudget.maximum || 0);
  const overBudget = budgetMax > 0 && price > budgetMax;
  const decision = fit.hard_mismatches.length
    ? "pass"
    : missing.length >= 3
    ? "insufficient_info"
    : overBudget || fit.score < 70
      ? "watch"
      : "pursue";
  const confidence = fit.score >= 80 && missing.length === 0 ? "high" : fit.score >= 45 ? "medium" : "low";

  const evidenceBackedFacts = [
    candidate.title ? { field: "title", value: candidate.title, basis: "source_visible" } : null,
    price ? { field: "asking_price", value: price, basis: "source_visible" } : null,
    candidate.district || candidate.city
      ? { field: "location", value: [candidate.city, candidate.district].filter(Boolean).join(" / "), basis: "source_visible" }
      : null,
    candidate.property_type || candidate.propertyType
      ? { field: "property_type", value: candidate.property_type || candidate.propertyType, basis: "source_visible" }
      : null,
  ].filter(Boolean);

  return {
    decision,
    confidence,
    reasons: [
      fit.hard_mismatches.length
        ? `Candidate conflicts with the saved mandate on: ${fit.hard_mismatches.join(", ")}.`
        : overBudget
          ? "Asking price appears above the saved mandate budget."
          : "Candidate can be compared against the saved mandate.",
      `Mandate fit score: ${fit.score}/100.`,
      missing.length ? "Some diligence inputs are still missing." : "Core visible facts are available for a first screen.",
    ],
    fit,
    evidenceBackedFacts,
    assumptions: missing.length ? [{
      field: "screening_assumption",
      value: "Recommendation is preliminary until missing information is resolved.",
      basis: "user_assumption",
    }] : [],
    missingInformation: missing.map((item) => ({
      type: item === "photos" ? "missing_document" : item === "broker_contact_access" ? "needs_contact_access" : "missing_fact",
      title: item === "broker_contact_access" ? "Broker contact requires marketplace access" : item.replace(/_/g, " "),
      priority: item === "asking_price" ? "high" : "medium",
      status: "open",
    })),
    nextAction: {
      type: decision === "pursue" ? "create_workspace" : decision === "watch" ? "monitor" : decision === "pass" ? "pass" : "request_info",
      label: decision === "pursue" ? "Create workspace" : decision === "watch" ? "Monitor candidate" : decision === "pass" ? "Pass" : "Request missing information",
      payload: {},
    },
  };
}

function enforceMandateFit(screeningOutput, candidate, mandate) {
  const fit = buildMandateFit(candidate, mandate);
  const output = {
    ...screeningOutput,
    fit: screeningOutput.fit || fit,
    reasons: Array.isArray(screeningOutput.reasons) ? [...screeningOutput.reasons] : [],
  };
  if (!output.reasons.some((reason) => /mandate fit score/i.test(String(reason)))) {
    output.reasons.push(`Mandate fit score: ${fit.score}/100.`);
  }
  if (fit.hard_mismatches.length) {
    output.decision = "pass";
    output.confidence = "high";
    output.reasons.unshift(`Candidate conflicts with the saved mandate on: ${fit.hard_mismatches.join(", ")}.`);
    output.nextAction = { type: "pass", label: "Pass", payload: {} };
  }
  return output;
}

function parseModelScreening(text) {
  const raw = normalizeText(text);
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  try {
    const parsed = JSON.parse(candidate);
    if (!["pursue", "watch", "pass", "insufficient_info"].includes(parsed.decision)) return null;
    return {
      decision: parsed.decision,
      confidence: normalizeConfidence(parsed.confidence),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 6).map(String) : [],
      evidenceBackedFacts: Array.isArray(parsed.evidenceBackedFacts) ? parsed.evidenceBackedFacts.slice(0, 10) : [],
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.slice(0, 10) : [],
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation.slice(0, 10) : [],
      nextAction: parsed.nextAction && typeof parsed.nextAction === "object"
        ? parsed.nextAction
        : { type: parsed.decision === "pursue" ? "create_workspace" : "request_info", label: "Review next action", payload: {} },
    };
  } catch {
    return null;
  }
}

async function buildModelScreeningOutput(candidate, mandate, { requestId } = {}) {
  const providerOverride = normalizeText(process.env.ACQUISITION_SCREENING_PROVIDER || "vertex");
  const model = normalizeText(process.env.ACQUISITION_SCREENING_MODEL || "google/gemini-2.0-flash-001");
  const response = await createChatCompletion({
    model,
    temperature: 0.1,
    max_tokens: 900,
    messages: [
      {
        role: "system",
        content: [
          "You screen Saudi real estate acquisition candidates.",
          "Return only compact JSON with decision, confidence, reasons, evidenceBackedFacts, assumptions, missingInformation, and nextAction.",
          "Allowed decisions: pursue, watch, pass, insufficient_info.",
          "Keep facts, assumptions, and missing information separate.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({ candidate, mandate }),
      },
    ],
  }, {
    providerOverride: providerOverride === "openai" ? "openai" : "vertex",
    workspaceId: candidate.workspace_id,
    requestId,
  });
  return parseModelScreening(extractOutputText(response));
}

function buildEnvelope(requestId, body = {}) {
  return {
    ...body,
    request_id: requestId,
    execution_plane: "gcp",
  };
}

function getInternalTaskHeaders(requestId) {
  const token = getExpectedInternalToken();
  if (!token) throw new Error("Missing internal token for Cloud Tasks / worker calls");
  return {
    authorization: `Bearer ${token}`,
    apikey: token,
    "x-internal-function-jwt": token,
    "x-request-id": requestId,
    "content-type": "application/json",
  };
}

function buildServiceBaseUrl(req) {
  const configured = String(process.env.ACQUISITION_SERVICE_BASE_URL || process.env.ANALYSIS_SERVICE_BASE_URL || "").trim();
  if (configured) return configured.replace(/\/+$/, "");
  const host = String(req.headers.host || "").trim();
  if (!host) throw new Error("ACQUISITION_SERVICE_BASE_URL not configured");
  const proto = String(req.headers["x-forwarded-proto"] || "").trim() || "https";
  return `${proto}://${host}`;
}

async function scheduleSearchRunTask({ req, requestId, searchRunId }) {
  if (!TASKS_LOCATION) {
    return { enqueued: false, reason: "GCP_TASKS_LOCATION not configured" };
  }
  const task = await createHttpTask({
    queueName: SEARCH_TASK_QUEUE,
    location: TASKS_LOCATION,
    url: `${buildServiceBaseUrl(req)}/internal/acquisition/search-run`,
    payload: { search_run_id: searchRunId, request_id: requestId },
    headers: getInternalTaskHeaders(requestId),
  });
  return { enqueued: true, task_name: task.name || null };
}

async function fetchMandate(supabase, mandateId) {
  if (!mandateId) return null;
  const { data, error } = await supabase
    .from("acquisition_mandates")
    .select("*")
    .eq("id", mandateId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load mandate: ${error.message}`);
  return data || null;
}

async function fetchCandidate(supabase, candidateId) {
  const { data, error } = await supabase
    .from("acquisition_candidate_opportunities")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load candidate: ${error.message}`);
  if (!data) {
    const notFound = new Error("Candidate not found");
    notFound.statusCode = 404;
    throw notFound;
  }
  return data;
}

async function fetchReadinessProfile(supabase, profileId) {
  const { data, error } = await supabase
    .from("buyer_readiness_profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load buyer readiness profile: ${error.message}`);
  if (!data) {
    const notFound = new Error("Buyer readiness profile not found");
    notFound.statusCode = 404;
    throw notFound;
  }
  return data;
}

function normalizeBuyerType(value) {
  const normalized = normalizeText(value).toLowerCase();
  return BUYER_TYPES.has(normalized) ? normalized : "individual";
}

function isActiveTimestampWindow(row = {}) {
  if (row.revoked_at) return false;
  if (!row.expires_at) return true;
  return new Date(row.expires_at).getTime() > Date.now();
}

function isVerifiedEvidence(evidence = {}) {
  return evidence.status === "verified" && isActiveTimestampWindow(evidence);
}

function hasEvidenceType(evidenceRows, types) {
  const wanted = new Set(types);
  return evidenceRows.some((evidence) => isVerifiedEvidence(evidence) && wanted.has(evidence.evidence_type));
}

function hasActiveBrokerageAgreement(agreements = []) {
  return agreements.some((agreement) =>
    agreement.status === "active" &&
    (!agreement.effective_at || new Date(agreement.effective_at).getTime() <= Date.now()) &&
    isActiveTimestampWindow(agreement)
  );
}

function hasHighUnresolvedRiskFlag(flags = []) {
  return flags.some((flag) => HIGH_RISK_SEVERITIES.has(flag.severity) && !RESOLVED_FLAG_STATUSES.has(flag.status));
}

function deriveReadinessState({ profile, evidence = [], brokerageAgreements = [], kycCases = [], riskFlags = [] }) {
  const buyerType = normalizeBuyerType(profile?.buyer_type);
  const hasMandate = Boolean(normalizeText(profile?.mandate_summary) || profile?.mandate_id ||
    hasEvidenceType(evidence, ["mandate_defined", "mandate"]));
  const hasIndividualIdentity = hasEvidenceType(evidence, ["identity", "national_id", "id", "passport"]);
  const hasCompanyIdentity = hasEvidenceType(evidence, ["commercial_registration", "company_registration"]);
  const hasAuthority = hasEvidenceType(evidence, ["authority_letter", "company_authorization", "authorized_signatory"]);
  const hasBeneficialOwner = hasEvidenceType(evidence, ["beneficial_owner", "beneficial_owner_capture"]);
  const hasFunding = hasEvidenceType(evidence, [
    "proof_of_funds",
    "mortgage_preapproval",
    "bank_relationship_letter",
    "funding_path_attestation",
    "buyer_self_attestation",
  ]);
  const hasOfferTerms = hasEvidenceType(evidence, ["decision_maker", "max_budget_terms", "preferred_terms", "offer_readiness"]);
  const identityReady = buyerType === "individual"
    ? hasIndividualIdentity
    : hasCompanyIdentity && hasAuthority && hasBeneficialOwner;
  const latestKyc = [...kycCases].sort((left, right) =>
    new Date(right.updated_at || right.created_at || 0).getTime() - new Date(left.updated_at || left.created_at || 0).getTime()
  )[0] || null;
  const riskBlocked = hasHighUnresolvedRiskFlag(riskFlags);
  let level = READINESS_LEVEL_MIN;
  if (hasMandate) level = 1;
  if (level >= 1 && identityReady) level = 2;
  if (level >= 2 && hasFunding) level = 3;
  if (level >= 3 && normalizeText(profile?.visit_readiness) && hasOfferTerms) level = 4;
  if (level >= 4 && hasActiveBrokerageAgreement(brokerageAgreements) && latestKyc?.state === "brokerage_ready") level = 5;
  if (riskBlocked) level = Math.min(level, 2);

  const verifiedEvidence = evidence.filter(isVerifiedEvidence).length;
  const expiredEvidence = evidence.some((item) => item.status === "expired" || (item.expires_at && !isActiveTimestampWindow(item)));
  const rejectedEvidence = evidence.some((item) => item.status === "rejected");
  const evidenceStatus = rejectedEvidence
    ? "rejected"
    : expiredEvidence && verifiedEvidence === 0
      ? "expired"
      : verifiedEvidence >= 2
        ? "verified"
        : verifiedEvidence === 1
          ? "partially_verified"
          : "self_declared";
  const kycState = riskBlocked
    ? "escalated"
    : KYC_STATES.has(latestKyc?.state)
      ? latestKyc.state
      : profile?.kyc_state || "not_started";
  const brokerageStatus = hasActiveBrokerageAgreement(brokerageAgreements)
    ? "signed"
    : profile?.brokerage_status || "not_started";
  return {
    readiness_level: Math.max(READINESS_LEVEL_MIN, Math.min(READINESS_LEVEL_MAX, level)),
    evidence_status: evidenceStatus,
    kyc_state: kycState,
    brokerage_status: brokerageStatus,
  };
}

async function loadReadinessContext(supabase, profileId) {
  const profile = await fetchReadinessProfile(supabase, profileId);
  const [evidenceResult, brokerageResult, kycResult] = await Promise.all([
    supabase.from("buyer_readiness_evidence").select("*").eq("profile_id", profile.id),
    supabase.from("brokerage_agreements").select("*").eq("buyer_profile_id", profile.id),
    supabase.from("kyc_cases").select("*").eq("buyer_profile_id", profile.id),
  ]);
  if (evidenceResult.error) throw new Error(`Failed to load readiness evidence: ${evidenceResult.error.message}`);
  if (brokerageResult.error) throw new Error(`Failed to load brokerage agreements: ${brokerageResult.error.message}`);
  if (kycResult.error) throw new Error(`Failed to load KYC cases: ${kycResult.error.message}`);
  const kycCaseIds = (kycResult.data || []).map((item) => item.id);
  let riskFlags = [];
  if (kycCaseIds.length) {
    const flagRows = await Promise.all(kycCaseIds.map((caseId) =>
      supabase.from("kyc_risk_flags").select("*").eq("kyc_case_id", caseId)
    ));
    for (const result of flagRows) {
      if (result.error) throw new Error(`Failed to load KYC risk flags: ${result.error.message}`);
      riskFlags.push(...(result.data || []));
    }
  }
  return {
    profile,
    evidence: evidenceResult.data || [],
    brokerageAgreements: brokerageResult.data || [],
    kycCases: kycResult.data || [],
    riskFlags,
  };
}

async function recomputeReadinessProfile(supabase, profileId) {
  const context = await loadReadinessContext(supabase, profileId);
  const derived = deriveReadinessState(context);
  const { data, error } = await supabase
    .from("buyer_readiness_profiles")
    .update(derived)
    .eq("id", profileId)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to update buyer readiness profile: ${error?.message || "unknown"}`);
  return { ...context, profile: data, derived };
}

function normalizeShareMode(value, documentKind = "") {
  const normalized = normalizeText(value).toLowerCase();
  if (["status_only", "redacted_copy", "full_document"].includes(normalized)) return normalized;
  return /financial|funding|bank|proof|mortgage/i.test(documentKind) ? "status_only" : "status_only";
}

async function assertActiveDocumentGrant(supabase, { documentId, buyerProfileId, opportunityId }) {
  if (!documentId) {
    const error = new Error("share_document approval requires draft_payload_json.document_id");
    error.statusCode = 400;
    throw error;
  }
  const { data, error } = await supabase
    .from("document_sharing_grants")
    .select("*")
    .eq("document_id", documentId);
  if (error) throw new Error(`Failed to load document sharing grants: ${error.message}`);
  const activeGrant = (data || []).find((grant) =>
    isActiveTimestampWindow(grant) &&
    (!buyerProfileId || grant.buyer_profile_id === buyerProfileId) &&
    (!opportunityId || !grant.opportunity_id || grant.opportunity_id === opportunityId)
  );
  if (!activeGrant) {
    const denied = new Error("Active document sharing grant required before sharing this document");
    denied.statusCode = 409;
    throw denied;
  }
  return activeGrant;
}

async function assertActiveBrokerageAuthority(supabase, buyerProfileId) {
  if (!buyerProfileId) {
    const error = new Error("Brokerage-gated action requires buyer_profile_id");
    error.statusCode = 400;
    throw error;
  }
  const { data, error } = await supabase
    .from("brokerage_agreements")
    .select("*")
    .eq("buyer_profile_id", buyerProfileId);
  if (error) throw new Error(`Failed to load brokerage agreements: ${error.message}`);
  if (!hasActiveBrokerageAgreement(data || [])) {
    const denied = new Error("Active brokerage agreement required before executing this action");
    denied.statusCode = 409;
    throw denied;
  }
}

async function insertEvent(supabase, payload) {
  const { data, error } = await supabase
    .from("acquisition_events")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(`Failed to insert acquisition event: ${error.message}`);
  return data;
}

async function createCandidateClaimRows(supabase, candidate, screeningOutput) {
  const confidence = numericConfidence(screeningOutput.confidence);
  const { data: existingClaims } = await supabase
    .from("acquisition_claims")
    .select("*")
    .eq("candidate_id", candidate.id);
  const existingKeys = new Set((existingClaims || []).map((claim) =>
    [claim.fact_key, JSON.stringify(claim.value_json || {}), claim.basis_label, claim.source_channel].join("|")
  ));
  const rows = [
    ...(screeningOutput.evidenceBackedFacts || []).map((fact) => ({
      candidate_id: candidate.id,
      workspace_id: candidate.workspace_id,
      fact_key: fact.field || "fact",
      value_json: { value: fact.value ?? null },
      basis_label: fact.basis === "source_visible" ? "counterparty_provided" : "uncertain",
      confidence,
      source_channel: candidate.source,
      evidence_refs_json: [{ source_url: candidate.source_url, captured_at: candidate.captured_at }],
    })),
    ...(screeningOutput.assumptions || []).map((fact) => ({
      candidate_id: candidate.id,
      workspace_id: candidate.workspace_id,
      fact_key: fact.field || "assumption",
      value_json: { value: fact.value ?? null },
      basis_label: "user_assumption",
      confidence,
      source_channel: "screening",
      evidence_refs_json: [],
    })),
  ].filter((row) => !existingKeys.has([
    row.fact_key,
    JSON.stringify(row.value_json || {}),
    row.basis_label,
    row.source_channel,
  ].join("|")));
  if (!rows.length) return [];
  const { data, error } = await supabase
    .from("acquisition_claims")
    .insert(rows)
    .select("*");
  if (error) throw new Error(`Failed to insert candidate claims: ${error.message}`);
  return data || [];
}

async function createCandidateDiligenceRows(supabase, candidate, screeningOutput) {
  const { data: existingItems } = await supabase
    .from("acquisition_diligence_items")
    .select("*")
    .eq("candidate_id", candidate.id);
  const existingKeys = new Set((existingItems || []).map((item) =>
    [item.title, item.item_type, item.status].join("|")
  ));
  const rows = (screeningOutput.missingInformation || []).map((item) => ({
    candidate_id: candidate.id,
    workspace_id: candidate.workspace_id,
    title: item.title || "Missing information",
    item_type: item.type || "missing_info",
    priority: item.priority || "medium",
    status: item.status || "open",
    owner_kind: "broker",
    evidence_refs_json: [{ source_url: candidate.source_url, captured_at: candidate.captured_at }],
  })).filter((row) => !existingKeys.has([row.title, row.item_type, row.status].join("|")));
  if (!rows.length) return [];
  const { data, error } = await supabase
    .from("acquisition_diligence_items")
    .insert(rows)
    .select("*");
  if (error) throw new Error(`Failed to insert candidate diligence: ${error.message}`);
  return data || [];
}

async function upsertCandidateSource(supabase, candidate, sourceDraft, searchRunId) {
  const location = locationMetadataFromDraft(sourceDraft);
  await supabase.from("acquisition_candidate_sources").upsert({
    candidate_id: candidate.id,
    search_run_id: searchRunId || candidate.search_run_id || null,
    workspace_id: candidate.workspace_id,
    source: candidate.source,
    source_url: candidate.source_url,
    source_fingerprint: candidate.source_fingerprint,
    limited_evidence_snapshot_json: sourceDraft.limited_evidence_snapshot_json || sourceDraft.sourceSnapshot || {},
    metadata_json: {
      title: candidate.title,
      source: candidate.source,
      contact_access: (sourceDraft.limited_evidence_snapshot_json || sourceDraft.sourceSnapshot || {}).contact_access || null,
      location: Object.keys(location).length ? location : null,
    },
  }, { onConflict: "candidate_id,source,source_fingerprint" });
}

export async function upsertCandidateDraft(supabase, draft, context = {}) {
  const source = normalizeText(draft.source).toLowerCase();
  if (!source) throw new Error("Candidate source is required");
  const fingerprint = normalizeText(draft.source_fingerprint) || buildSourceFingerprint(draft);
  const workspaceId = context.workspaceId || draft.workspace_id || null;
  const location = locationMetadataFromDraft(draft);
  const evidenceSnapshot = {
    ...(draft.limited_evidence_snapshot_json || draft.sourceSnapshot || {}),
    ...(Object.keys(location).length ? { location } : {}),
  };
  if (workspaceId && fingerprint) {
    const { data: existing, error: existingError } = await supabase
      .from("acquisition_candidate_opportunities")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("source_fingerprint", fingerprint)
      .maybeSingle();
    if (existingError) throw new Error(`Failed to inspect candidate suppression: ${existingError.message}`);
    if (existing && ["archived", "pass"].includes(existing.status)) {
      return {
        ...existing,
        suppressed_by_workspace: true,
      };
    }
  }
  const payload = {
    workspace_id: workspaceId,
    search_run_id: context.searchRunId || draft.search_run_id || null,
    mandate_id: context.mandateId || draft.mandate_id || null,
    investor_id: context.investorId || draft.investor_id || null,
    source,
    source_url: draft.source_url || draft.sourceUrl || null,
    source_fingerprint: fingerprint,
    limited_evidence_snapshot_json: evidenceSnapshot,
    captured_at: draft.captured_at || draft.capturedAt || new Date().toISOString(),
    title: draft.title || null,
    asking_price: draft.asking_price ?? draft.askingPrice ?? null,
    city: draft.city || null,
    district: draft.district || null,
    property_type: draft.property_type || draft.propertyType || null,
    area_sqm: draft.area_sqm ?? draft.areaSqm ?? null,
    bedroom_count: draft.bedroom_count ?? draft.bedroomCount ?? null,
    bathroom_count: draft.bathroom_count ?? draft.bathroomCount ?? null,
    photo_refs_json: draft.photo_refs_json || draft.photoRefs || [],
    short_description: draft.short_description || draft.shortDescription || null,
    terms_policy: ["allowed", "restricted", "unknown"].includes(draft.terms_policy || draft.termsPolicy)
      ? draft.terms_policy || draft.termsPolicy
      : "unknown",
    status: CANDIDATE_STATUSES.has(draft.status) ? draft.status : "submitted",
  };
  const { data, error } = await supabase
    .from("acquisition_candidate_opportunities")
    .upsert(payload, { onConflict: "workspace_id,source_fingerprint" })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to upsert candidate: ${error?.message || "unknown"}`);
  await upsertCandidateSource(supabase, data, draft, context.searchRunId);
  return data;
}

async function screenCandidate(supabase, candidateId, options = {}) {
  const candidate = await fetchCandidate(supabase, candidateId);
  const mandate = await fetchMandate(supabase, candidate.mandate_id);
  let output = null;
  try {
    output = await buildModelScreeningOutput(candidate, mandate, options);
  } catch {
    output = null;
  }
  output ||= buildScreeningOutput(candidate, mandate);
  output = enforceMandateFit(output, candidate, mandate);
  const status = mapDecisionToCandidateStatus(output.decision);
  const { data, error } = await supabase
    .from("acquisition_candidate_opportunities")
    .update({
      screening_decision: output.decision,
      screening_output_json: output,
      status,
    })
    .eq("id", candidate.id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to update candidate screening: ${error?.message || "unknown"}`);
  await createCandidateClaimRows(supabase, data, output);
  await createCandidateDiligenceRows(supabase, data, output);
  return { candidate: data, screening: output };
}

// Bucket helpers for the cross-listing signature. We want listings within
// a small price/area band to collide on the same key so an "identical
// floorplan, different broker" duplicate gets caught.
//   - Price bucket: 500k of native currency. Wide enough to absorb the
//     usual broker price drift on a re-listed unit (1-2%) and narrow
//     enough that a 38M apartment never collides with a 39M one.
//   - Area bucket: 5 sqm. Real floorplans within the same tower drift
//     by 1-3 sqm because of how brokers report gross vs net.
function priceBucket(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric / 500000);
}
function areaBucket(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric / 5);
}

// Normalises a free-form city/district string so "Jumeirah Bay Island"
// and "jumeirah bay island" collide. The same normaliser must be used
// on both sides of the comparison.
function dedupNormalise(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildCrossListingSignature(record) {
  const parts = [
    dedupNormalise(record.city),
    dedupNormalise(record.district),
    priceBucket(record.asking_price),
    areaBucket(record.area_sqm),
    record.bedroom_count != null ? Number(record.bedroom_count) : null,
    dedupNormalise(record.property_type),
  ];
  // Reject signatures that are too sparse to be meaningful (e.g. no
  // district + no area). One soft field missing is fine; two is not.
  const populated = parts.filter((value) => value !== null && value !== "").length;
  if (populated < 4) return null;
  return parts.map((value) => (value == null ? "" : String(value))).join("|");
}

// Look for an existing active opportunity in this workspace whose dedup
// signature matches the candidate. If one is found, append the candidate
// as a cross-listing entry on the canonical opportunity and return the
// existing opportunity row. Returns null if no duplicate exists.
async function tryAttachAsCrossListing(supabase, candidate) {
  const incomingSig = buildCrossListingSignature(candidate);
  if (!incomingSig) return null;

  const { data: existingRows, error: existingError } = await supabase
    .from("acquisition_opportunities")
    .select("id, title, metadata_json, stage")
    .eq("workspace_id", candidate.workspace_id)
    .neq("stage", "archived")
    .order("created_at", { ascending: true });
  if (existingError || !existingRows?.length) return null;

  for (const row of existingRows) {
    const meta = row.metadata_json || {};
    // Skip if this candidate is already the canonical record for this
    // opportunity (idempotent re-promotion should refresh, not duplicate).
    if (meta.candidate_id === candidate.id) return null;

    const candidateLike = {
      city: meta.city,
      district: meta.district,
      asking_price: meta.asking_price ?? meta.price,
      area_sqm: meta.area_sqm,
      bedroom_count: meta.bedroom_count,
      property_type: meta.property_type,
    };
    const existingSig = buildCrossListingSignature(candidateLike);
    if (!existingSig || existingSig !== incomingSig) continue;

    const priorCrossListings = Array.isArray(meta.cross_listings) ? meta.cross_listings : [];
    const alreadyTracked = priorCrossListings.some(
      (entry) =>
        entry?.candidate_id === candidate.id ||
        (candidate.source_url && entry?.source_url === candidate.source_url),
    );
    let nextOpportunity = row;
    if (!alreadyTracked) {
      const newEntry = {
        candidate_id: candidate.id,
        source: candidate.source,
        source_url: candidate.source_url,
        asking_price: candidate.asking_price,
        area_sqm: candidate.area_sqm,
        attached_at: new Date().toISOString(),
        reason: "signature_match",
        signature: incomingSig,
      };
      const nextMeta = {
        ...meta,
        cross_listings: [...priorCrossListings, newEntry],
      };
      await supabase
        .from("acquisition_opportunities")
        .update({ metadata_json: nextMeta, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      nextOpportunity = { ...row, metadata_json: nextMeta };
    }

    // Mark the candidate as promoted and point it at the canonical
    // opportunity so the candidate inbox doesn't surface it again.
    const { data: promotedCandidate } = await supabase
      .from("acquisition_candidate_opportunities")
      .update({
        status: "promoted",
        promoted_opportunity_id: row.id,
      })
      .eq("id", candidate.id)
      .select("*")
      .single();

    return {
      candidate: promotedCandidate || candidate,
      opportunity: nextOpportunity,
      cross_listing_attached: true,
      cross_listing_of: row.id,
      cross_listing_already_tracked: alreadyTracked,
    };
  }
  return null;
}

async function promoteCandidate(supabase, candidateId) {
  const candidate = await fetchCandidate(supabase, candidateId);
  const mandate = await fetchMandate(supabase, candidate.mandate_id).catch(() => null);
  const location = locationMetadataFromCandidate(candidate);
  const screening = candidate.screening_output_json && Object.keys(candidate.screening_output_json).length
    ? candidate.screening_output_json
    : buildScreeningOutput(candidate, mandate);
  const title = candidate.title || "Acquisition opportunity";

  // Cross-listing dedup: portals (especially Property Finder) host the same
  // unit under multiple listing IDs because different brokers re-list the
  // same inventory to chase commission. From the buyer's point of view
  // those cards represent one shopping decision, not many. Before we
  // create a new opportunity row, look for an active opportunity in the
  // same workspace whose (city, district, price-bucket, area-bucket,
  // bedroom-count, property-type) signature matches this candidate; if
  // we find one, attach this candidate as an alternate broker entry
  // and short-circuit.
  const dedupResult = await tryAttachAsCrossListing(supabase, candidate);
  if (dedupResult) {
    return dedupResult;
  }

  // Compute Investment Quality Score (non-fatal: falls back to null on error)
  let investmentScore = null;
  let investmentScoreBreakdown = null;
  try {
    const iqs = await computeInvestmentScore({ candidate, mandate, supabase });
    investmentScore = iqs.total;
    investmentScoreBreakdown = iqs;
  } catch (scoringErr) {
    // Score computation is best-effort; never block promotion
    console.warn(`[promoteCandidate] investment score failed for ${candidateId}: ${scoringErr?.message}`);
  }

  const { data: opportunity, error: opportunityError } = await supabase
    .from("acquisition_opportunities")
    .insert({
      workspace_id: candidate.workspace_id,
      phone_number: "api",
      source_channel: opportunitySourceChannelForCandidate(candidate),
      stage: "workspace_created",
      title,
      summary: screening.reasons?.join(" ") || null,
      opportunity_kind: "property_submission",
      acquisition_focus: "screening",
      screening_readiness: screening.decision === "insufficient_info" ? "needs_info" : "screened",
      missing_info_json: (screening.missingInformation || []).map((item) => item.title || item.type || "missing_information"),
      metadata_json: {
        candidate_id: candidate.id,
        source_fingerprint: candidate.source_fingerprint,
        screening,
        source_url: candidate.source_url,
        source: candidate.source,
        original_source_channel: candidate.source,
        photo_refs: normalizePhotoRefs(candidate.photo_refs_json),
        photoRefs: normalizePhotoRefs(candidate.photo_refs_json),
        asking_price: candidate.asking_price,
        price: candidate.asking_price,
        area_sqm: candidate.area_sqm,
        property_type: candidate.property_type,
        bedroom_count: candidate.bedroom_count ?? candidate.bedrooms ?? null,
        bathroom_count: candidate.bathroom_count ?? candidate.bathrooms ?? null,
        city: candidate.city,
        district: candidate.district,
        location: Object.keys(location).length ? location : null,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        location_precision: location.location_precision || null,
        location_source: location.location_source || null,
        address: location.address || null,
        map_query: location.map_query || null,
        confidence: screening.confidence,
        decision: screening.decision,
        contact_access: candidate.limited_evidence_snapshot_json?.contact_access || null,
        investment_score: investmentScore,
        investment_score_breakdown: investmentScoreBreakdown,
      },
    })
    .select("*")
    .single();
  if (opportunityError || !opportunity) throw new Error(`Failed to promote candidate: ${opportunityError?.message || "unknown"}`);

  const { data: candidateClaims } = await supabase
    .from("acquisition_claims")
    .select("*")
    .eq("candidate_id", candidate.id);
  if (candidateClaims?.length) {
    const uniqueClaims = [];
    const seenClaims = new Set();
    for (const claim of candidateClaims) {
      const key = [claim.fact_key, JSON.stringify(claim.value_json || {}), claim.basis_label, claim.source_channel].join("|");
      if (seenClaims.has(key)) continue;
      seenClaims.add(key);
      uniqueClaims.push(claim);
    }
    await supabase.from("acquisition_claims").insert(uniqueClaims.map((claim) => ({
      opportunity_id: opportunity.id,
      workspace_id: opportunity.workspace_id,
      fact_key: claim.fact_key,
      value_json: claim.value_json,
      basis_label: claim.basis_label,
      confidence: claim.confidence,
      source_channel: claim.source_channel,
      evidence_refs_json: claim.evidence_refs_json,
      created_by: claim.created_by,
    })));
  }

  const { data: candidateDiligence } = await supabase
    .from("acquisition_diligence_items")
    .select("*")
    .eq("candidate_id", candidate.id);
  if (candidateDiligence?.length) {
    const uniqueItems = [];
    const seenItems = new Set();
    for (const item of candidateDiligence) {
      const key = [item.title, item.item_type, item.status].join("|");
      if (seenItems.has(key)) continue;
      seenItems.add(key);
      uniqueItems.push(item);
    }
    await supabase.from("acquisition_diligence_items").insert(uniqueItems.map((item) => ({
      opportunity_id: opportunity.id,
      workspace_id: opportunity.workspace_id,
      title: item.title,
      item_type: item.item_type,
      priority: item.priority,
      status: item.status,
      owner_kind: item.owner_kind,
      due_at: item.due_at,
      evidence_refs_json: item.evidence_refs_json,
    })));
  }

  await supabase.from("acquisition_scenarios").insert({
    opportunity_id: opportunity.id,
    workspace_id: opportunity.workspace_id,
    scenario_kind: "base",
    title: "Base scenario",
    assumptions_json: {
      asking_price: candidate.asking_price,
      area_sqm: candidate.area_sqm,
      candidate_id: candidate.id,
    },
    outputs_json: {
      screening_decision: screening.decision,
      confidence: screening.confidence,
    },
    editable: true,
  });

  await insertEvent(supabase, {
    opportunity_id: opportunity.id,
    workspace_id: opportunity.workspace_id,
    event_type: "candidate_promoted",
    event_direction: "system",
    body_text: `Candidate promoted: ${title}`,
    event_payload: { candidate_id: candidate.id, screening },
  });
  await insertEvent(supabase, {
    opportunity_id: opportunity.id,
    workspace_id: opportunity.workspace_id,
    event_type: "workspace_created",
    event_direction: "system",
    body_text: "Acquisition workspace created from candidate.",
    event_payload: { candidate_id: candidate.id },
  });

  const { data: promoted, error: promotedError } = await supabase
    .from("acquisition_candidate_opportunities")
    .update({
      status: "promoted",
      promoted_opportunity_id: opportunity.id,
    })
    .eq("id", candidate.id)
    .select("*")
    .single();
  if (promotedError) throw new Error(`Failed to link promoted candidate: ${promotedError.message}`);
  return { candidate: promoted, opportunity };
}

async function fetchSuppressedCandidateSources(supabase, workspaceId) {
  if (!workspaceId) return [];
  const { data, error } = await supabase
    .from("acquisition_candidate_opportunities")
    .select("id, workspace_id, source, source_url, source_fingerprint, status, title, district, asking_price")
    .eq("workspace_id", workspaceId)
    .limit(250);
  if (error) throw new Error(`Failed to load suppressed candidate sources: ${error.message}`);
  return (data || []).filter((candidate) => ["archived", "pass"].includes(candidate.status));
}

async function callBrowserWorker({ requestId, searchRun, mandate, suppressedCandidates = [] }) {
  if (!BROWSER_WORKER_URL) {
    return { candidates: [], adapter_runs: [], skipped: true, reason: "ACQUISITION_BROWSER_WORKER_URL not configured" };
  }
  // Bound the worker call to a hard ceiling instead of letting it ride
  // the Cloud Run request timeout (300s). Anything past ~4 minutes is
  // either a cold-start gone wrong or a stuck DNS/keep-alive socket;
  // failing fast preserves the rest of the backend handler (so we can
  // record an `adapter_run` and surface a useful error to the cockpit
  // instead of returning a generic "fetch failed").
  const perSourceTimeout = Number(searchRun?.limits_json?.per_source_timeout_ms || 60_000);
  const perRunTimeout = Number(searchRun?.limits_json?.per_run_timeout_ms || 240_000);
  const sourcesLength = Array.isArray(searchRun?.sources_json) && searchRun.sources_json.length
    ? searchRun.sources_json.length
    : 2;
  const budgetMs = Math.min(
    Math.max(perRunTimeout, perSourceTimeout * sourcesLength + 60_000),
    240_000,
  );
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(new Error(`worker_call_timeout_${budgetMs}ms`)), budgetMs);
  let response;
  try {
    response = await fetch(`${BROWSER_WORKER_URL}/internal/search-run`, {
      method: "POST",
      headers: getInternalTaskHeaders(requestId),
      body: JSON.stringify({
        search_run: searchRun,
        mandate,
        suppressed_candidates: suppressedCandidates,
        request_id: requestId,
      }),
      signal: controller.signal,
      // Disable connection reuse for this call. We hit a transient
      // backend-to-worker hang where node:fetch kept selecting a stale
      // pooled socket after a worker redeploy; forcing a fresh
      // connection per call neutralises that path. The per-call setup
      // cost is negligible against the worker's 10-30s render budget.
      keepalive: false,
    });
  } catch (fetchError) {
    clearTimeout(abortTimer);
    const message = controller.signal.aborted
      ? `Browser worker call aborted after ${budgetMs}ms (${fetchError?.message || "timeout"})`
      : `Browser worker fetch failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`;
    throw new Error(message);
  }
  clearTimeout(abortTimer);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || `Browser worker failed (${response.status})`);
  }
  return json;
}

async function processSearchRun({ supabase, requestId, searchRunId }) {
  const { data: searchRun, error } = await supabase
    .from("acquisition_search_runs")
    .select("*")
    .eq("id", searchRunId)
    .maybeSingle();
  if (error || !searchRun) {
    const wrapped = new Error(error?.message || "Search run not found");
    wrapped.statusCode = 404;
    throw wrapped;
  }
  await supabase.from("acquisition_search_runs").update({
    status: "running",
    started_at: new Date().toISOString(),
  }).eq("id", searchRun.id);

  try {
    const mandate = await fetchMandate(supabase, searchRun.mandate_id);
    const suppressedCandidates = await fetchSuppressedCandidateSources(supabase, searchRun.workspace_id);
    const browserResult = await callBrowserWorker({ requestId, searchRun, mandate, suppressedCandidates });
    const candidates = [];
    const adapterRuns = [];
    for (const draft of browserResult.candidates || []) {
      const candidate = await upsertCandidateDraft(supabase, draft, {
        workspaceId: searchRun.workspace_id,
        searchRunId: searchRun.id,
        mandateId: searchRun.mandate_id,
        investorId: searchRun.user_id,
      });
      if (candidate.suppressed_by_workspace || ["archived", "pass"].includes(candidate.status)) continue;
      const screened = await screenCandidate(supabase, candidate.id, { requestId });
      candidates.push(screened.candidate);
    }
    for (const adapterRun of browserResult.adapter_runs || []) {
      const adapterStatus = ["running", "completed", "failed", "cancelled"].includes(adapterRun.status)
        ? adapterRun.status
        : "completed";
      const { data: savedAdapterRun, error: adapterRunError } = await supabase.from("acquisition_adapter_runs").insert({
        search_run_id: searchRun.id,
        workspace_id: searchRun.workspace_id,
        source: adapterRun.source,
        status: adapterStatus,
        cards_seen: adapterRun.cards_seen || 0,
        detail_pages_fetched: adapterRun.detail_pages_fetched || 0,
        candidates_created: adapterRun.candidates_created || 0,
        failure_count: adapterRun.failure_count || 0,
        screenshot_refs_json: adapterRun.screenshot_refs_json || [],
        limited_snapshot_refs_json: adapterRun.limited_snapshot_refs_json || [],
        error_json: {
          ...(adapterRun.error_json || {}),
          worker_status: adapterRun.status || null,
        },
        completed_at: new Date().toISOString(),
      }).select("*").single();
      if (adapterRunError) throw new Error(`Failed to insert acquisition adapter run: ${adapterRunError.message}`);
      adapterRuns.push(savedAdapterRun || adapterRun);
    }
    const completedAt = new Date().toISOString();
    candidates.sort((left, right) =>
      Number(right.screening_output_json?.fit?.score || 0) - Number(left.screening_output_json?.fit?.score || 0)
    );

    // Auto-promote candidates that cleared screening to opportunities
    // so they appear in the workspace cockpit's deal pipeline. The
    // cockpit reads `acquisition_opportunities` (not raw candidates),
    // so without this step a successful search returns "8 candidates
    // found" in the action dock but an empty pipeline. We promote any
    // `pass` decision plus `pursue` decisions whose only missing item
    // is contact-access gating — the latter is the norm on cross-
    // border portals (Property Finder, Idealista, etc.) which require
    // sign-in to expose broker phone numbers; refusing to promote
    // those would mean the Mihad cockpit shows zero deals even when
    // mandate-fit is 100/100. `watch` / `pass_on` / `needs_info` for
    // other reasons remain in `acquisition_candidate_opportunities`
    // for ops to triage.
    const promoted = [];
    for (const candidate of candidates) {
      const decision = candidate.screening_decision;
      let shouldPromote = decision === "pass";
      if (!shouldPromote && decision === "pursue") {
        const missing = candidate.screening_output_json?.missingInformation || [];
        const onlyContactGating = missing.length > 0 && missing.every(
          (item) => item?.type === "needs_contact_access",
        );
        const noMissing = missing.length === 0;
        const fitScore = Number(candidate.screening_output_json?.fit?.score || 0);
        shouldPromote = (onlyContactGating || noMissing) && fitScore >= 70;
      }
      if (!shouldPromote) continue;
      try {
        const result = await promoteCandidate(supabase, candidate.id);
        if (result?.opportunity?.id) promoted.push(result.opportunity);
      } catch (promoteError) {
        console.warn(
          `[processSearchRun] failed to auto-promote candidate ${candidate.id}: ${promoteError instanceof Error ? promoteError.message : String(promoteError)}`,
        );
      }
    }

    const { data: updated } = await supabase.from("acquisition_search_runs").update({
      status: "completed",
      completed_at: completedAt,
      candidate_count: candidates.length,
      error_summary: browserResult.skipped ? browserResult.reason : null,
    }).eq("id", searchRun.id).select("*").single();
    return { search_run: updated, candidates, adapter_runs: adapterRuns, opportunities: promoted };
  } catch (runError) {
    await supabase.from("acquisition_search_runs").update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_summary: runError instanceof Error ? runError.message : String(runError),
    }).eq("id", searchRun.id);
    throw runError;
  }
}

function normalizeTargetCountryCodes(value) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  const set = new Set();
  for (const entry of raw) {
    const code = String(entry || "").trim().toUpperCase();
    if (!code) continue;
    if (!SUPPORTED_TARGET_COUNTRIES.has(code)) continue;
    set.add(code);
  }
  if (set.size === 0) set.add("SA");
  return [...set];
}

function normalizeEnum(value, allowed, fallback = null) {
  const v = normalizeText(value);
  if (!v) return fallback;
  return allowed.has(v) ? v : fallback;
}

function normalizeBudgetCurrency(value) {
  const v = String(value || "").trim().toUpperCase();
  if (!v) return "SAR";
  return SUPPORTED_BUDGET_CURRENCIES.has(v) ? v : "SAR";
}

async function createMandate(supabase, body) {
  await assertMandateCreationAllowed(supabase, body);
  const payload = {
    workspace_id: normalizeUuid(body.workspace_id),
    organization_id: normalizeUuid(body.organization_id),
    user_id: normalizeUuid(body.user_id),
    status: normalizeText(body.status) || "active",
    title: normalizeText(body.title) || "Acquisition mandate",
    buy_box_json: body.buy_box || body.buy_box_json || {},
    target_locations_json: body.target_locations || body.target_locations_json || [],
    budget_range_json: body.budget_range || body.budget_range_json || {},
    risk_appetite: body.risk_appetite || null,
    excluded_criteria_json: body.excluded_criteria || body.excluded_criteria_json || [],
    confidence_json: body.confidence || body.confidence_json || {},
    target_country_codes: normalizeTargetCountryCodes(body.target_country_codes ?? body.target_countries),
    purpose: normalizeEnum(body.purpose, MANDATE_PURPOSES),
    timeline: normalizeEnum(body.timeline, MANDATE_TIMELINES),
    liquidity_class: normalizeEnum(body.liquidity_class, MANDATE_LIQUIDITY_CLASSES),
    budget_currency: normalizeBudgetCurrency(body.budget_currency),
  };
  const { data, error } = await supabase
    .from("acquisition_mandates")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(`Failed to create mandate: ${error.message}`);
  return data;
}

async function createSearchRun(supabase, mandateId, body) {
  const mandate = await fetchMandate(supabase, mandateId);
  if (!mandate) {
    const error = new Error("Mandate not found");
    error.statusCode = 404;
    throw error;
  }
  const sources = normalizeSources(body.sources);
  const limits = normalizeSearchLimits(body.limits);
  const { data, error } = await supabase
    .from("acquisition_search_runs")
    .insert({
      workspace_id: mandate.workspace_id || normalizeUuid(body.workspace_id),
      mandate_id: mandate.id,
      user_id: mandate.user_id || normalizeUuid(body.user_id),
      status: "queued",
      trigger_kind: "manual",
      sources_json: sources,
      query_description: normalizeText(body.query_description) || normalizeText(mandate.title),
      limits_json: limits,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Failed to create search run: ${error.message}`);
  return data;
}

async function createWorkspaceSearchRun({ supabase, req, requestId, workspaceId, userId, body = {} }) {
  await assertWorkspaceWriteAccess(supabase, workspaceId, userId);
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, description, analysis_brief, org_id, owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (workspaceError) throw workspaceError;
  if (!workspace) {
    const error = new Error("workspace_not_found");
    error.statusCode = 404;
    throw error;
  }
  let mandate = await loadLatestMandateForWorkspace(supabase, workspaceId);
  if (!mandate) {
    const brief = normalizeText(body.mandate || workspace.analysis_brief || workspace.description || workspace.name);
    mandate = await createMandate(supabase, {
      workspace_id: workspaceId,
      organization_id: workspace.org_id,
      user_id: userId,
      title: brief || "Acquisition mandate",
      buy_box_json: brief ? { summary: brief } : {},
      confidence_json: { source: "workspace_search_run" },
    });
  }
  const instruction = normalizeText(body.instruction || body.sourcing_instruction || body.query_description);
  const searchRun = await createSearchRun(supabase, mandate.id, {
    ...body,
    user_id: userId,
    sources: body.sources,
    limits: body.limits,
    query_description: instruction || normalizeText(mandate.title),
  });
  const queue = await scheduleSearchRunTask({ req, requestId, searchRunId: searchRun.id });
  return { search_run: searchRun, queue };
}

async function createListingCandidate(supabase, body) {
  const submittedAt = new Date().toISOString();
  const candidate = await upsertCandidateDraft(supabase, {
    ...body,
    source: body.source || "user_provided_listing",
    source_url: body.source_url || body.url || null,
    limited_evidence_snapshot_json: body.limited_evidence_snapshot || {
      text: normalizeText(body.text || body.description).slice(0, 1200),
      submitted_at: submittedAt,
      submitted_by_user: Boolean(body.submitted_by_user || body.manual_entry || body.source === "manual_operator"),
      intake_mode: body.source === "manual_operator" || body.manual_entry ? "manual_user_entry" : "listing_intake",
    },
    captured_at: submittedAt,
  }, {
    workspaceId: normalizeUuid(body.workspace_id),
    mandateId: normalizeUuid(body.mandate_id),
    investorId: normalizeUuid(body.user_id || body.investor_id),
  });
  return await screenCandidate(supabase, candidate.id);
}

async function enrichOpportunity(supabase, opportunityId, body = {}) {
  const { data: opportunity, error } = await supabase
    .from("acquisition_opportunities")
    .select("*")
    .eq("id", opportunityId)
    .maybeSingle();
  if (error || !opportunity) {
    const wrapped = new Error(error?.message || "Opportunity not found");
    wrapped.statusCode = 404;
    throw wrapped;
  }
  const kind = normalizeText(body.kind) || "market";
  if (!["market", "condition"].includes(kind)) {
    return { opportunity, skipped: true, reason: "unsupported_enrichment_kind" };
  }
  if (kind === "condition") {
    const photoRefs = opportunity.metadata_json?.photo_refs || opportunity.metadata_json?.photoRefs || [];
    const capexMatters = Boolean(opportunity.metadata_json?.renovation_matters || body.capex_matters);
    if (!Array.isArray(photoRefs) || !photoRefs.length || !capexMatters) {
      return { opportunity, skipped: true, reason: "condition_enrichment_requires_photos_and_capex_relevance" };
    }
  }
  const basis = kind === "market" ? "market_signal" : "modeled_output";
  const { data: claim, error: claimError } = await supabase.from("acquisition_claims").insert({
    opportunity_id: opportunity.id,
    workspace_id: opportunity.workspace_id,
    fact_key: kind === "market" ? "valuation_context" : "condition_context",
    value_json: {
      status: "placeholder",
      note: kind === "market"
        ? "Market CSV enrichment hook is ready; upload/import is handled as a separate source snapshot."
        : "Restb.ai enrichment hook is ready; external call is intentionally not executed in this MVP pass.",
    },
    basis_label: basis,
    confidence: 0.5,
    source_channel: kind === "market" ? "market_csv" : "restb_ai",
    evidence_refs_json: [],
  }).select("*").single();
  if (claimError) throw new Error(`Failed to write enrichment claim: ${claimError.message}`);
  return { opportunity, claim, skipped: false };
}

async function addOpportunityNote(supabase, opportunityId, body = {}) {
  const { data: opportunity, error } = await supabase
    .from("acquisition_opportunities")
    .select("*")
    .eq("id", opportunityId)
    .maybeSingle();
  if (error || !opportunity) {
    const wrapped = new Error(error?.message || "Opportunity not found");
    wrapped.statusCode = 404;
    throw wrapped;
  }
  const event = await insertEvent(supabase, {
    opportunity_id: opportunity.id,
    workspace_id: opportunity.workspace_id,
    created_by: normalizeUuid(body.user_id),
    event_type: "operator_note",
    event_direction: "operator",
    body_text: normalizeText(body.note || body.body_text),
    event_payload: body.payload || {},
  });
  return { opportunity, event };
}

async function updateOpportunityStage(supabase, opportunityId, body = {}) {
  const stage = normalizeText(body.stage);
  if (!OPPORTUNITY_STAGES.has(stage)) {
    const error = new Error("Invalid opportunity stage");
    error.statusCode = 400;
    throw error;
  }
  const { data: existing, error: loadError } = await supabase
    .from("acquisition_opportunities")
    .select("*")
    .eq("id", opportunityId)
    .maybeSingle();
  if (loadError || !existing) {
    const error = new Error(loadError?.message || "Opportunity not found");
    error.statusCode = 404;
    throw error;
  }
  const shouldSuppress = body.suppress_source !== false && ["archived", "passed"].includes(stage);
  const metadata = existing.metadata_json && typeof existing.metadata_json === "object"
    ? { ...existing.metadata_json }
    : {};
  if (STAGES_REQUIRING_BUYER_QUALIFICATION.has(stage)) {
    if (hasStageAdminOverride(body)) {
      metadata.pipeline_gate = {
        ...(metadata.pipeline_gate || {}),
        admin_override: true,
        override_reason: normalizeText(body.override_reason) || "manual_admin_override",
        overridden_at: new Date().toISOString(),
        stage,
      };
    } else {
      await assertBuyerQualificationForOpportunity(supabase, existing, `advancing to ${stage}`, {
        ...body,
        admin_override: false,
        manual_override: false,
      });
    }
  }
  if (shouldSuppress) {
    metadata.suppression = {
      ...(metadata.suppression || {}),
      suppressed_by_user: true,
      suppressed_at: new Date().toISOString(),
      rejection_reason: normalizeText(body.rejection_reason) || "operator_rejected",
      candidate_id: metadata.candidate_id || null,
      source: metadata.source || existing.source_channel || null,
      source_url: metadata.source_url || null,
      source_fingerprint: metadata.source_fingerprint || null,
    };
  }
  const { data, error } = await supabase
    .from("acquisition_opportunities")
    .update({ stage, metadata_json: metadata })
    .eq("id", opportunityId)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to update opportunity stage: ${error?.message || "unknown"}`);
  if (shouldSuppress && metadata.candidate_id) {
    await supabase
      .from("acquisition_candidate_opportunities")
      .update({
        status: "archived",
        screening_decision: "pass",
      })
      .eq("id", metadata.candidate_id);
  }
  await insertEvent(supabase, {
    opportunity_id: data.id,
    workspace_id: data.workspace_id,
    created_by: normalizeUuid(body.user_id),
    event_type: shouldSuppress ? "opportunity_rejected" : "stage_updated",
    event_direction: "operator",
    body_text: shouldSuppress
      ? "Property rejected and suppressed for this workspace."
      : `Stage updated to ${stage}`,
    event_payload: { stage, suppress_source: shouldSuppress },
  });
  return data;
}

async function createReadinessProfile(supabase, body = {}) {
  const payload = {
    workspace_id: normalizeUuid(body.workspace_id),
    mandate_id: normalizeUuid(body.mandate_id),
    buyer_user_id: normalizeUuid(body.buyer_user_id || body.user_id),
    organization_id: normalizeUuid(body.organization_id),
    buyer_type: normalizeBuyerType(body.buyer_type),
    mandate_summary: normalizeText(body.mandate_summary),
    funding_path: normalizeText(body.funding_path),
    readiness_level: 0,
    evidence_status: "self_declared",
    sharing_mode: ["private", "anonymous_mandate", "named_buyer", "selected_documents"].includes(body.sharing_mode)
      ? body.sharing_mode
      : "private",
    visit_readiness: normalizeText(body.visit_readiness),
    brokerage_status: "not_started",
    kyc_state: "not_started",
    metadata_json: body.metadata_json || body.metadata || {},
    created_by: normalizeUuid(body.created_by || body.user_id),
  };
  const { data, error } = await supabase
    .from("buyer_readiness_profiles")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create buyer readiness profile: ${error?.message || "unknown"}`);
  const context = await recomputeReadinessProfile(supabase, data.id);
  return context.profile;
}

async function updateReadinessProfile(supabase, profileId, body = {}) {
  const patch = {};
  if (body.buyer_type !== undefined) patch.buyer_type = normalizeBuyerType(body.buyer_type);
  if (body.mandate_summary !== undefined) patch.mandate_summary = normalizeText(body.mandate_summary);
  if (body.funding_path !== undefined) patch.funding_path = normalizeText(body.funding_path);
  if (body.sharing_mode !== undefined) patch.sharing_mode = body.sharing_mode;
  if (body.visit_readiness !== undefined) patch.visit_readiness = normalizeText(body.visit_readiness);
  if (body.metadata_json !== undefined || body.metadata !== undefined) patch.metadata_json = body.metadata_json || body.metadata || {};
  const { data, error } = await supabase
    .from("buyer_readiness_profiles")
    .update(patch)
    .eq("id", profileId)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to update buyer readiness profile: ${error?.message || "unknown"}`);
  const context = await recomputeReadinessProfile(supabase, data.id);
  return context.profile;
}

async function attachReadinessEvidence(supabase, profileId, body = {}) {
  const profile = await fetchReadinessProfile(supabase, profileId);
  const status = EVIDENCE_STATUSES.has(body.status) ? body.status : "pending";
  const payload = {
    profile_id: profile.id,
    workspace_id: profile.workspace_id,
    document_id: normalizeUuid(body.document_id),
    evidence_type: normalizeText(body.evidence_type || body.type),
    attestation_json: body.attestation_json || body.attestation || {},
    status,
    sensitivity_level: ["low", "medium", "high", "financial", "identity"].includes(body.sensitivity_level)
      ? body.sensitivity_level
      : "medium",
    verified_by: status === "verified" ? normalizeUuid(body.verified_by || body.user_id) : null,
    verified_at: status === "verified" ? (body.verified_at || new Date().toISOString()) : null,
    expires_at: body.expires_at || null,
    created_by: normalizeUuid(body.created_by || body.user_id),
  };
  if (!payload.evidence_type) {
    const error = new Error("Evidence type is required");
    error.statusCode = 400;
    throw error;
  }
  const { data, error } = await supabase
    .from("buyer_readiness_evidence")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to attach buyer readiness evidence: ${error?.message || "unknown"}`);
  await recomputeReadinessProfile(supabase, profile.id);
  return data;
}

async function verifyReadinessEvidence(supabase, evidenceId, body = {}) {
  const result = ["verified", "rejected", "needs_review", "expired"].includes(body.result) ? body.result : "verified";
  const status = result === "needs_review" ? "pending" : result;
  const { data: evidence, error: loadError } = await supabase
    .from("buyer_readiness_evidence")
    .select("*")
    .eq("id", evidenceId)
    .maybeSingle();
  if (loadError) throw new Error(`Failed to load buyer readiness evidence: ${loadError.message}`);
  if (!evidence) {
    const notFound = new Error("Buyer readiness evidence not found");
    notFound.statusCode = 404;
    throw notFound;
  }
  const reviewerId = normalizeUuid(body.reviewer_id || body.user_id);
  const { data, error } = await supabase
    .from("buyer_readiness_evidence")
    .update({
      status,
      verified_by: result === "verified" ? reviewerId : evidence.verified_by,
      verified_at: result === "verified" ? new Date().toISOString() : evidence.verified_at,
    })
    .eq("id", evidence.id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to verify buyer readiness evidence: ${error?.message || "unknown"}`);
  await supabase.from("buyer_readiness_verifications").insert({
    profile_id: evidence.profile_id,
    evidence_id: evidence.id,
    workspace_id: evidence.workspace_id,
    verification_type: normalizeText(body.verification_type) || "manual_review",
    result,
    reviewer_id: reviewerId,
    notes: normalizeText(body.notes),
  });
  const context = await recomputeReadinessProfile(supabase, evidence.profile_id);
  return { evidence: data, profile: context.profile };
}

async function createDocumentSharingGrant(supabase, body = {}) {
  const documentId = normalizeUuid(body.document_id);
  if (!documentId) {
    const error = new Error("document_id is required");
    error.statusCode = 400;
    throw error;
  }
  const purpose = normalizeText(body.purpose);
  if (!purpose) {
    const error = new Error("purpose is required");
    error.statusCode = 400;
    throw error;
  }
  const payload = {
    document_id: documentId,
    workspace_id: normalizeUuid(body.workspace_id),
    opportunity_id: normalizeUuid(body.opportunity_id),
    buyer_profile_id: normalizeUuid(body.buyer_profile_id),
    granted_by: normalizeUuid(body.granted_by || body.user_id),
    granted_to_kind: normalizeText(body.granted_to_kind) || "counterparty",
    granted_to_identifier: normalizeText(body.granted_to_identifier),
    purpose,
    allowed_action: ["share_status", "share_document", "view", "download"].includes(body.allowed_action)
      ? body.allowed_action
      : "share_status",
    share_mode: normalizeShareMode(body.share_mode, `${body.document_kind || ""} ${purpose}`),
    token_hash: normalizeText(body.token_hash),
    expires_at: body.expires_at || null,
  };
  const { data, error } = await supabase
    .from("document_sharing_grants")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create document sharing grant: ${error?.message || "unknown"}`);
  return data;
}

async function createBrokerageAgreement(supabase, body = {}) {
  const profile = await fetchReadinessProfile(supabase, normalizeUuid(body.buyer_profile_id));
  const payload = {
    buyer_profile_id: profile.id,
    workspace_id: profile.workspace_id || normalizeUuid(body.workspace_id),
    agreement_type: ["buyer_representation", "limited_authority", "offer_support", "closing_coordination"].includes(body.agreement_type)
      ? body.agreement_type
      : "buyer_representation",
    scope: normalizeText(body.scope),
    authority_json: body.authority_json || body.authority || {},
    commission_terms_json: body.commission_terms_json || body.commission_terms || {},
    signed_document_id: normalizeUuid(body.signed_document_id),
    status: ["draft", "active", "expired", "revoked", "terminated"].includes(body.status) ? body.status : "draft",
    effective_at: body.effective_at || null,
    expires_at: body.expires_at || null,
    created_by: normalizeUuid(body.created_by || body.user_id),
  };
  const { data, error } = await supabase
    .from("brokerage_agreements")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create brokerage agreement: ${error?.message || "unknown"}`);
  const context = await recomputeReadinessProfile(supabase, profile.id);
  return { agreement: data, profile: context.profile };
}

async function createKycCase(supabase, body = {}) {
  const profile = await fetchReadinessProfile(supabase, normalizeUuid(body.buyer_profile_id));
  const state = KYC_STATES.has(body.state) ? body.state : "not_started";
  const payload = {
    buyer_profile_id: profile.id,
    workspace_id: profile.workspace_id || normalizeUuid(body.workspace_id),
    state,
    risk_level: ["low", "medium", "high", "critical"].includes(body.risk_level) ? body.risk_level : "low",
    customer_type: normalizeBuyerType(body.customer_type || profile.buyer_type),
    assigned_reviewer_id: normalizeUuid(body.assigned_reviewer_id),
    started_at: body.started_at || (state === "not_started" ? null : new Date().toISOString()),
    completed_at: body.completed_at || null,
    escalated_at: body.escalated_at || (state === "escalated" ? new Date().toISOString() : null),
    metadata_json: body.metadata_json || body.metadata || {},
  };
  const { data, error } = await supabase
    .from("kyc_cases")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create KYC case: ${error?.message || "unknown"}`);
  const context = await recomputeReadinessProfile(supabase, profile.id);
  return { kyc_case: data, profile: context.profile };
}

async function createKycRiskFlag(supabase, kycCaseId, body = {}) {
  const { data: kycCase, error: loadError } = await supabase
    .from("kyc_cases")
    .select("*")
    .eq("id", kycCaseId)
    .maybeSingle();
  if (loadError) throw new Error(`Failed to load KYC case: ${loadError.message}`);
  if (!kycCase) {
    const notFound = new Error("KYC case not found");
    notFound.statusCode = 404;
    throw notFound;
  }
  const payload = {
    kyc_case_id: kycCase.id,
    buyer_profile_id: kycCase.buyer_profile_id,
    workspace_id: kycCase.workspace_id,
    flag_type: normalizeText(body.flag_type),
    severity: ["low", "medium", "high", "critical"].includes(body.severity) ? body.severity : "medium",
    source: normalizeText(body.source),
    status: ["open", "reviewing", "resolved", "waived"].includes(body.status) ? body.status : "open",
    resolution_note: normalizeText(body.resolution_note),
  };
  if (!payload.flag_type) {
    const error = new Error("flag_type is required");
    error.statusCode = 400;
    throw error;
  }
  const { data, error } = await supabase
    .from("kyc_risk_flags")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create KYC risk flag: ${error?.message || "unknown"}`);
  if (HIGH_RISK_SEVERITIES.has(payload.severity) && !RESOLVED_FLAG_STATUSES.has(payload.status)) {
    await supabase
      .from("kyc_cases")
      .update({
        state: "escalated",
        risk_level: payload.severity === "critical" ? "critical" : "high",
        escalated_at: new Date().toISOString(),
      })
      .eq("id", kycCase.id);
  }
  const context = await recomputeReadinessProfile(supabase, kycCase.buyer_profile_id);
  return { risk_flag: data, profile: context.profile };
}

async function createExternalActionApproval(supabase, body = {}) {
  const actionType = normalizeText(body.action_type);
  if (!EXTERNAL_ACTION_TYPES.has(actionType)) {
    const error = new Error("Invalid external action type");
    error.statusCode = 400;
    throw error;
  }
  const payload = {
    workspace_id: normalizeUuid(body.workspace_id),
    opportunity_id: normalizeUuid(body.opportunity_id),
    buyer_profile_id: normalizeUuid(body.buyer_profile_id),
    action_type: actionType,
    acquisition_action_id: normalizeText(body.acquisition_action_id || body.draft_payload_json?.acquisition_action_id || body.draft_payload?.acquisition_action_id),
    resolved_stage: normalizeText(body.resolved_stage),
    result_status: normalizeText(body.result_status) || "pending",
    blocker_reason: normalizeText(body.blocker_reason),
    draft_payload_json: body.draft_payload_json || body.draft_payload || {},
    approval_status: ["draft", "pending", "approved", "rejected", "executed", "cancelled"].includes(body.approval_status)
      ? body.approval_status
      : "pending",
    requested_by: normalizeUuid(body.requested_by || body.user_id),
  };
  const { data, error } = await supabase
    .from("external_action_approvals")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create external action approval: ${error?.message || "unknown"}`);
  return data;
}

async function approveExternalAction(supabase, approvalId, body = {}) {
  const { data: approval, error: loadError } = await supabase
    .from("external_action_approvals")
    .select("*")
    .eq("id", approvalId)
    .maybeSingle();
  if (loadError) throw new Error(`Failed to load external action approval: ${loadError.message}`);
  if (!approval) {
    const notFound = new Error("External action approval not found");
    notFound.statusCode = 404;
    throw notFound;
  }
  const overrideBody = { ...body, allow_admin_override: true };
  if (ACTION_TYPES_REQUIRING_BUYER_QUALIFICATION.has(approval.action_type) && !hasStageAdminOverride(overrideBody)) {
    if (approval.buyer_profile_id) {
      const profile = await fetchReadinessProfile(supabase, approval.buyer_profile_id);
      if (!readinessQualifiesForBrokerage(profile)) {
        const denied = new Error(`Buyer readiness verification required before ${approval.action_type}`);
        denied.statusCode = 409;
        denied.code = "buyer_qualification_required";
        denied.readiness_level = profile?.readiness_level ?? null;
        denied.evidence_status = profile?.evidence_status ?? null;
        denied.kyc_state = profile?.kyc_state ?? null;
        throw denied;
      }
    } else if (approval.opportunity_id) {
      const { data: opportunity, error: opportunityError } = await supabase
        .from("acquisition_opportunities")
        .select("*")
        .eq("id", approval.opportunity_id)
        .maybeSingle();
      if (opportunityError || !opportunity) {
        const denied = new Error(opportunityError?.message || "Opportunity not found for buyer qualification gate");
        denied.statusCode = 404;
        throw denied;
      }
      await assertBuyerQualificationForOpportunity(supabase, opportunity, approval.action_type, overrideBody);
    } else {
      const denied = new Error(`Buyer readiness verification required before ${approval.action_type}`);
      denied.statusCode = 409;
      denied.code = "buyer_qualification_required";
      throw denied;
    }
  }
  if (ACTION_TYPES_REQUIRING_BROKERAGE.has(approval.action_type)) {
    await assertActiveBrokerageAuthority(supabase, approval.buyer_profile_id);
  }
  if (approval.action_type === "share_document") {
    await assertActiveDocumentGrant(supabase, {
      documentId: approval.draft_payload_json?.document_id,
      buyerProfileId: approval.buyer_profile_id,
      opportunityId: approval.opportunity_id,
    });
  }
  const status = body.approval_status === "rejected" ? "rejected" : "approved";
  const { data, error } = await supabase
    .from("external_action_approvals")
    .update({
      approval_status: status,
      approved_by: normalizeUuid(body.approved_by || body.user_id),
      approved_at: new Date().toISOString(),
    })
    .eq("id", approval.id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to approve external action: ${error?.message || "unknown"}`);
  return data;
}

async function executeExternalAction(supabase, approvalId, body = {}) {
  const { data: approval, error: loadError } = await supabase
    .from("external_action_approvals")
    .select("*")
    .eq("id", approvalId)
    .maybeSingle();
  if (loadError) throw new Error(`Failed to load external action approval: ${loadError.message}`);
  if (!approval) {
    const notFound = new Error("External action approval not found");
    notFound.statusCode = 404;
    throw notFound;
  }
  if (approval.approval_status !== "approved") {
    const denied = new Error("External action must be approved before execution");
    denied.statusCode = 409;
    throw denied;
  }
  if (ACTION_TYPES_REQUIRING_BROKERAGE.has(approval.action_type)) {
    await assertActiveBrokerageAuthority(supabase, approval.buyer_profile_id);
  }
  if (approval.action_type === "share_document") {
    await assertActiveDocumentGrant(supabase, {
      documentId: approval.draft_payload_json?.document_id,
      buyerProfileId: approval.buyer_profile_id,
      opportunityId: approval.opportunity_id,
    });
  }
  const executionResult = body.execution_result_json || body.execution_result || {
    status: "recorded",
    note: "External execution is recorded for MVP; delivery happens through approved operator workflow.",
  };
  const { data, error } = await supabase
    .from("external_action_approvals")
    .update({
      approval_status: "executed",
      executed_by: normalizeUuid(body.executed_by || body.user_id),
      executed_at: new Date().toISOString(),
      execution_result_json: executionResult,
    })
    .eq("id", approval.id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to execute external action: ${error?.message || "unknown"}`);
  if (approval.opportunity_id) {
    await insertEvent(supabase, {
      opportunity_id: approval.opportunity_id,
      workspace_id: approval.workspace_id,
      created_by: normalizeUuid(body.executed_by || body.user_id),
      event_type: "external_action_executed",
      event_direction: "operator",
      body_text: `Approved action executed: ${approval.action_type}`,
      event_payload: {
        approval_id: approval.id,
        action_type: approval.action_type,
        result: executionResult,
      },
    });
  }
  return data;
}

async function ensureWorkspaceFolder(supabase, { workspaceId, parentId = null, name, folderKind, opportunityId = null, buyerEntityId = null, readinessProfileId = null, sensitivityLevel = "standard", analysisPolicy = "manual" }) {
  const query = supabase
    .from("workspace_folders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("name", name)
    .is("deleted_at", null)
    .limit(1);
  const scoped = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
  const { data: existing, error: loadError } = await scoped.maybeSingle();
  if (loadError) throw new Error(`Failed to load workspace folder: ${loadError.message}`);
  if (existing?.id) return existing;
  const payload = {
    workspace_id: workspaceId,
    parent_id: parentId,
    name,
    folder_kind: folderKind,
    related_opportunity_id: opportunityId,
    buyer_entity_id: buyerEntityId,
    buyer_readiness_profile_id: readinessProfileId,
    sensitivity_level: sensitivityLevel,
    analysis_policy: analysisPolicy,
  };
  const { data, error } = await supabase.from("workspace_folders").insert(payload).select("*").single();
  if (error || !data) throw new Error(`Failed to create workspace folder: ${error?.message || "unknown"}`);
  return data;
}

async function ensureAcquisitionFolders(supabase, { opportunity, readinessProfile = null }) {
  if (!opportunity?.workspace_id) return {};
  const propertiesRoot = await ensureWorkspaceFolder(supabase, {
    workspaceId: opportunity.workspace_id,
    name: "Properties",
    folderKind: "acquisition_property_root",
    analysisPolicy: "none",
  });
  const propertyFolder = await ensureWorkspaceFolder(supabase, {
    workspaceId: opportunity.workspace_id,
    parentId: propertiesRoot.id,
    name: normalizeText(opportunity.title || opportunity.summary || `Opportunity ${String(opportunity.id).slice(0, 8)}`).slice(0, 96),
    folderKind: "acquisition_property",
    opportunityId: opportunity.id,
    analysisPolicy: "acquisition_property",
  });
  const buyerRoot = await ensureWorkspaceFolder(supabase, {
    workspaceId: opportunity.workspace_id,
    name: "Buyer",
    folderKind: "buyer_root",
    analysisPolicy: "none",
  });
  const financingFolder = await ensureWorkspaceFolder(supabase, {
    workspaceId: opportunity.workspace_id,
    parentId: buyerRoot.id,
    name: "Secure Financing",
    folderKind: "buyer_secure_financing",
    buyerEntityId: readinessProfile?.buyer_entity_id || null,
    readinessProfileId: readinessProfile?.id || null,
    sensitivityLevel: "financial",
    analysisPolicy: "buyer_readiness_financing",
  });
  return { properties_root: propertiesRoot, property_folder: propertyFolder, buyer_root: buyerRoot, financing_folder: financingFolder };
}

async function loadOpportunityActionState(supabase, opportunityId) {
  const { data: opportunity, error } = await supabase
    .from("acquisition_opportunities")
    .select("*")
    .eq("id", opportunityId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load acquisition opportunity: ${error.message}`);
  if (!opportunity) {
    const notFound = new Error("Acquisition opportunity not found");
    notFound.statusCode = 404;
    throw notFound;
  }
  const [{ data: profiles }, { data: grants }, { data: agreements }] = await Promise.all([
    supabase.from("buyer_readiness_profiles").select("*").eq("workspace_id", opportunity.workspace_id).order("updated_at", { ascending: false }).limit(1),
    supabase.from("document_sharing_grants").select("*").eq("workspace_id", opportunity.workspace_id).order("created_at", { ascending: false }).limit(20),
    supabase.from("brokerage_agreements").select("*").eq("workspace_id", opportunity.workspace_id).order("created_at", { ascending: false }).limit(20),
  ]);
  const readinessProfile = (profiles || [])[0] || null;
  const brokerageActive = hasActiveBrokerageAgreement(agreements || []);
  const action = resolvePrimaryAcquisitionAction({ opportunity, readinessProfile, brokerageActive, sharingGrants: grants || [] });
  return {
    opportunity,
    readiness_profile: readinessProfile,
    sharing_grants: grants || [],
    brokerage_active: brokerageActive,
    primary_action: action,
    actions: [action],
  };
}

async function listOpportunityActions(supabase, opportunityId) {
  const state = await loadOpportunityActionState(supabase, opportunityId);
  const folders = await ensureAcquisitionFolders(supabase, { opportunity: state.opportunity, readinessProfile: state.readiness_profile });
  return { ...state, folders };
}

async function prepareOpportunityAction(supabase, opportunityId, actionId, body = {}) {
  const state = await loadOpportunityActionState(supabase, opportunityId);
  const definition = ACQUISITION_ACTION_DEFINITIONS[actionId];
  if (!definition) {
    const error = new Error("Unknown acquisition action");
    error.statusCode = 400;
    throw error;
  }
  const folders = await ensureAcquisitionFolders(supabase, { opportunity: state.opportunity, readinessProfile: state.readiness_profile });
  return {
    action: { action_id: actionId, ...definition, blocked: false },
    primary_action: state.primary_action,
    folders,
    manual_whatsapp_url: state.opportunity.phone_number ? `https://wa.me/${String(state.opportunity.phone_number).replace(/[^0-9]/g, "")}` : null,
    consent_disclaimer: actionId === "share_financing_packet" || actionId === "upload_financing_document"
      ? "Zohal records readiness evidence and consent only. Zohal does not perform underwriting or determine creditworthiness."
      : null,
  };
}

async function executeOpportunityAction(supabase, opportunityId, actionId, body = {}) {
  const state = await loadOpportunityActionState(supabase, opportunityId);
  const definition = ACQUISITION_ACTION_DEFINITIONS[actionId];
  if (!definition) {
    const error = new Error("Unknown acquisition action");
    error.statusCode = 400;
    throw error;
  }
  const folders = await ensureAcquisitionFolders(supabase, { opportunity: state.opportunity, readinessProfile: state.readiness_profile });
  const event = await insertEvent(supabase, {
    opportunity_id: state.opportunity.id,
    workspace_id: state.opportunity.workspace_id,
    created_by: normalizeUuid(body.user_id || body.executed_by),
    event_type: actionId,
    event_direction: "operator",
    body_text: definition.result,
    event_payload: {
      action_id: actionId,
      adapter: definition.adapter,
      result_status: "recorded",
      folders,
      payload: body.payload || {},
    },
  });
  if (actionId === "schedule_visit") {
    await supabase.from("acquisition_opportunities").update({ stage: "visit_requested" }).eq("id", state.opportunity.id);
  }
  if (actionId === "request_contractor_evaluation") {
    await supabase.from("acquisition_threads").insert({
      opportunity_id: state.opportunity.id,
      workspace_id: state.opportunity.workspace_id,
      thread_kind: "contractor",
      status: "active",
      title: "Contractor evaluation",
      summary: "In-person contractor evaluation requested.",
      metadata_json: { action_id: actionId },
    });
  }
  if (actionId === "request_missing_documents") {
    await supabase
      .from("acquisition_diligence_items")
      .update({ status: "requested" })
      .eq("opportunity_id", state.opportunity.id)
      .eq("status", "open");
  }
  if (actionId === "pass_property") {
    await supabase.from("acquisition_opportunities").update({ stage: "passed" }).eq("id", state.opportunity.id);
  }
  if (actionId === "close_property") {
    await supabase.from("acquisition_opportunities").update({ stage: "closed" }).eq("id", state.opportunity.id);
  }
  return { action: { action_id: actionId, ...definition }, event, folders };
}

const DEAL_DESK_RECOMMENDATION_STATES = new Set([
  "strong_pursue",
  "pursue_after_verification",
  "watch",
  "pass",
  "needs_info",
]);

const DEAL_DESK_BASIS_LABELS = new Set([
  "verified_source",
  "market_signal",
  "modeled_output",
  "counterparty_provided",
  "third_party_input",
  "uncertain_needs_diligence",
]);
const DEAL_DESK_NOTE_KINDS = new Set([
  "general",
  "preference",
  "assumption",
  "remove_candidate",
  "request_info",
  "correction",
  "approval_signal",
]);
const ACQUISITION_REPORT_HIDDEN_SECTIONS = new Set([
  "ai_analysis",
  "scenario_lab",
  "renovation",
  "proof",
  "notes",
  "methodology",
]);

function currentIsoWeekPeriod(date = new Date()) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function normalizeReportPresentation(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const presentation = source.presentation && typeof source.presentation === "object"
    ? source.presentation
    : {};
  const hiddenSections = [
    ...(Array.isArray(source.hidden_sections) ? source.hidden_sections : []),
    ...(Array.isArray(presentation.hidden_sections) ? presentation.hidden_sections : []),
  ]
    .map((item) => normalizeText(item).toLowerCase())
    .filter((item) => ACQUISITION_REPORT_HIDDEN_SECTIONS.has(item));
  const includeAiAnalysis = source.include_ai_analysis ?? presentation.include_ai_analysis;
  const topN = clampNumber(source.top_n ?? presentation.top_n, 5, 1, 20);
  return {
    top_n: topN,
    density: ["compact", "standard", "expanded"].includes(normalizeText(source.density || presentation.density).toLowerCase())
      ? normalizeText(source.density || presentation.density).toLowerCase()
      : "standard",
    include_ai_analysis: includeAiAnalysis === false ? false : true,
    hidden_sections: [...new Set(hiddenSections)],
  };
}

function investmentScoreFor(row = {}) {
  const candidates = [
    row.investment_score,
    row.investment_quality_score,
    row.metadata_json?.investment_score,
    row.metadata_json?.investment_score?.total,
    row.metadata_json?.investment_score_breakdown?.total,
    row.result_json?.investment_score,
    row.screening_output_json?.investment_score,
    row.screening_output_json?.investment_score?.total,
  ];
  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

function normalizeDealDeskBasis(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (DEAL_DESK_BASIS_LABELS.has(normalized)) return normalized;
  if (normalized === "inferred" || normalized === "uncertain") return "uncertain_needs_diligence";
  if (normalized === "owner_provided" || normalized === "broker_provided") return "counterparty_provided";
  return "uncertain_needs_diligence";
}

function normalizeDealDeskRecommendation(value, row = {}) {
  const normalized = normalizeText(value).toLowerCase();
  if (DEAL_DESK_RECOMMENDATION_STATES.has(normalized)) return normalized;
  if (normalized === "insufficient_info" || normalized === "needs_info") return "needs_info";
  if (normalized === "pursue") {
    const score = Number(row.fit_score ?? row.screening_output_json?.fit?.score ?? row.score);
    return Number.isFinite(score) && score >= 85 ? "strong_pursue" : "pursue_after_verification";
  }
  if (normalized === "promoted" || normalized === "workspace_created") return "pursue_after_verification";
  if (normalized === "passed" || normalized === "archived") return "pass";
  if (normalized === "watch") return "watch";
  return "needs_info";
}

function reportPeriodFromBody(body = {}) {
  return normalizeText(body.report_period) ||
    normalizeText(body.period) ||
    currentIsoWeekPeriod();
}

function buildDealDeskSurfaceKey(workspaceId, reportPeriod) {
  const hash = createHash("sha256")
    .update(`${workspaceId}:${reportPeriod}:${Date.now()}:${Math.random()}`)
    .digest("base64url")
    .slice(0, 16)
    .toLowerCase();
  return `dd_${hash}`;
}

function compactJson(value, fallback = {}) {
  return value && typeof value === "object" ? value : fallback;
}

function finiteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function roundedNumber(value, digits = 0) {
  const numeric = finiteNumber(value);
  if (numeric === null) return null;
  const factor = 10 ** digits;
  return Math.round(numeric * factor) / factor;
}

function ratioToPct(value) {
  const numeric = finiteNumber(value);
  return numeric === null ? null : roundedNumber(numeric * 100, 1);
}

function scenarioMetrics(underwriting = {}, key) {
  const scenarios = Array.isArray(underwriting.scenarios) ? underwriting.scenarios : [];
  return compactJson(scenarios.find((scenario) => normalizeText(scenario?.key).toLowerCase() === key)?.metrics, {});
}

function buildEconomicsSnapshot(underwriting = {}) {
  const status = normalizeText(underwriting.status || underwriting.summary?.status);
  const summary = compactJson(underwriting.summary, {});
  const assumptions = compactJson(underwriting.assumptions, {});
  const base = scenarioMetrics(underwriting, "base");
  const downside = scenarioMetrics(underwriting, "downside");
  const upside = scenarioMetrics(underwriting, "upside");
  const baseIrr = finiteNumber(base.irr ?? summary.median_irr);

  if (status !== "complete" || !Object.keys(base).length) {
    const missing = Array.isArray(assumptions.missing_assumptions)
      ? assumptions.missing_assumptions.map(normalizeText).filter(Boolean)
      : [];
    return {
      status: status || "not_modeled",
      basis: "not_modeled",
      generated_at: underwriting.generated_at || null,
      missing_assumptions: missing,
      message: missing.length
        ? `Needs ${missing.join(", ")} before economics can be modeled.`
        : "Economics are not modeled yet.",
    };
  }

  const exitPrice = finiteNumber(base.exit_price);
  const terminalEquity = finiteNumber(base.net_sale_proceeds);
  const debtPayoffEstimate = exitPrice !== null && terminalEquity !== null
    ? Math.max(0, exitPrice - terminalEquity)
    : null;
  const cashFlows = Array.isArray(base.cash_flows) ? base.cash_flows : [];
  const annualCashFlows = cashFlows.slice(1).map((amount, index, all) => {
    const isExitYear = index === all.length - 1;
    const operatingAmount = isExitYear && terminalEquity !== null
      ? Number(amount) - terminalEquity
      : amount;
    return {
      year: index + 1,
      amount: roundedNumber(operatingAmount, 0),
    };
  }).filter((item) => item.amount !== null);

  return {
    status: "complete",
    basis: "modeled_output",
    generated_at: underwriting.generated_at || null,
    headline_metrics: {
      equity_required: roundedNumber(base.equity_required, 0),
      annual_cash_flow: roundedNumber(base.annual_cash_flow, 0),
      cash_on_cash_pct: ratioToPct(base.cash_on_cash),
      base_irr_pct: ratioToPct(baseIrr),
    },
    cash_flow: {
      hold_period_years: annualCashFlows.length || finiteNumber(assumptions.exit?.hold_period_years),
      annual: annualCashFlows,
    },
    capital_stack: {
      total_project_cost: roundedNumber(base.total_project_cost, 0),
      debt: roundedNumber(base.loan_amount, 0),
      equity: roundedNumber(base.equity_required, 0),
      ltv_pct: roundedNumber(underwriting.financing?.ltv_pct ?? assumptions.financing?.ltv_pct, 1),
    },
    exit_waterfall: {
      net_sale: roundedNumber(exitPrice, 0),
      debt_payoff: roundedNumber(debtPayoffEstimate, 0),
      terminal_equity: roundedNumber(terminalEquity, 0),
    },
    return_sensitivity: [
      { key: "downside", label: "Downside", irr_pct: ratioToPct(downside.irr ?? summary.p10_irr) },
      { key: "base", label: "Base", irr_pct: ratioToPct(baseIrr) },
      { key: "upside", label: "Upside", irr_pct: ratioToPct(upside.irr ?? summary.p90_irr) },
    ],
    confidence: {
      target_irr_pct: ratioToPct(summary.target_irr),
      probability_target_irr_pct: ratioToPct(summary.probability_target_irr),
      probability_capital_loss_pct: ratioToPct(summary.probability_capital_loss),
      median_equity_multiple: roundedNumber(summary.median_equity_multiple, 2),
    },
    assumptions: {
      annual_rent: roundedNumber(assumptions.operations?.gross_annual_rent, 0),
      vacancy_pct: roundedNumber(assumptions.operations?.vacancy_pct, 1),
      financing_rate_pct: roundedNumber(assumptions.financing?.financing_rate_pct, 2),
      hold_period_years: roundedNumber(assumptions.exit?.hold_period_years, 0),
    },
    summary: {
      recommendation: summary.recommendation || null,
      main_risk: summary.main_risk || null,
      next_action: summary.next_action || null,
    },
  };
}

function compactReportRow(row = {}) {
  return {
    opportunity_id: row.opportunity_id || null,
    candidate_id: row.candidate_id || null,
    title: row.title || null,
    recommendation_state: row.recommendation_state || null,
    investment_score: row.investment_score ?? null,
    fit_score: row.fit_score ?? null,
    asking_price: row.asking_price ?? null,
    capex_base: row.capex_base ?? null,
    modeled_yield_pct: row.modeled_yield_pct ?? null,
    basis: row.basis || null,
    evidence_id: row.evidence_id || null,
  };
}

async function selectRows(query, tableName) {
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load ${tableName}: ${error.message}`);
  return Array.isArray(data) ? data : [];
}

function metadataAccessFlag(metadata, keys) {
  if (!metadata || typeof metadata !== "object") return false;
  return keys.some((key) => metadata[key] === true);
}

function hasAdminAccessOverride(value, keys) {
  if (!value || typeof value !== "object") return false;
  if (metadataAccessFlag(value, keys)) return true;
  return [
    value.access,
    value.access_model,
    value.report_access,
    value.mandate_access,
    value.admin_approval,
    value.manual_approval,
  ].some((nested) => metadataAccessFlag(nested, keys));
}

function hasMandateAdminApproval(body = {}) {
  return hasAdminAccessOverride(body, [
    "admin_approved",
    "manual_approved",
    "additional_mandates_approved",
    "additional_mandate_approved",
  ]) || hasAdminAccessOverride(body.confidence_json || body.confidence || {}, [
    "admin_approved",
    "manual_approved",
    "additional_mandates_approved",
    "additional_mandate_approved",
  ]);
}

function hasReportAdminApproval({ mandate, body = {}, allowManualOverride = false }) {
  if (allowManualOverride && hasAdminAccessOverride(body, ["admin_approved", "manual_approved", "reports_approved", "continue_reports"])) {
    return true;
  }
  return hasAdminAccessOverride(mandate?.confidence_json || {}, [
    "admin_approved",
    "manual_approved",
    "reports_approved",
    "continue_reports",
  ]);
}

function hasStageAdminOverride(body = {}) {
  return body.allow_admin_override === true && (
    body.admin_override === true ||
    body.manual_override === true ||
    body.admin_approved === true ||
    body.manual_approved === true
  );
}

async function fetchProfileForUser(supabase, userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, subscription_tier, subscription_status, subscription_expires_at, grace_period_ends_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load profile entitlement: ${error.message}`);
  return data || null;
}

async function activeMandateCountForUser(supabase, userId) {
  if (!userId) return 0;
  const rows = await selectRows(
    supabase
      .from("acquisition_mandates")
      .select("id, status")
      .eq("user_id", userId),
    "acquisition_mandates",
  );
  return rows.filter((row) => row.status === "active").length;
}

async function assertMandateCreationAllowed(supabase, body = {}) {
  const userId = normalizeUuid(body.user_id);
  if (!userId) return { allowed: true, reason: "no_user_scope" };
  const activeCount = await activeMandateCountForUser(supabase, userId);
  if (activeCount < FREE_ACTIVE_MANDATE_LIMIT) {
    return { allowed: true, reason: "first_active_mandate_free", active_mandate_count: activeCount };
  }
  const profile = await fetchProfileForUser(supabase, userId);
  if (profileHasActivePaidPlan(profile)) {
    return { allowed: true, reason: "paid_plan", active_mandate_count: activeCount };
  }
  if (hasMandateAdminApproval(body)) {
    return { allowed: true, reason: "admin_approved", active_mandate_count: activeCount };
  }
  const error = new Error("Additional active mandates require a paid plan or admin approval");
  error.statusCode = 402;
  error.code = "additional_mandate_requires_upgrade";
  error.active_mandate_count = activeCount;
  throw error;
}

async function loadBestReadinessProfileForMandate(supabase, { workspaceId, mandateId }) {
  const byMandate = mandateId
    ? await selectRows(
      supabase
        .from("buyer_readiness_profiles")
        .select("*")
        .eq("mandate_id", mandateId)
        .order("updated_at", { ascending: false })
        .limit(1),
      "buyer_readiness_profiles",
    )
    : [];
  if (byMandate[0]) return byMandate[0];
  if (!workspaceId) return null;
  const byWorkspace = await selectRows(
    supabase
      .from("buyer_readiness_profiles")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(1),
    "buyer_readiness_profiles",
  );
  return byWorkspace[0] || null;
}

function readinessQualifiesForBrokerage(profile) {
  if (!profile) return false;
  if (["rejected", "expired"].includes(profile.evidence_status)) return false;
  if (Number(profile.readiness_level || 0) >= REQUIRED_BROKERAGE_READINESS_LEVEL) return true;
  return profile.evidence_status === "verified" && ["buyer_verified", "brokerage_ready"].includes(profile.kyc_state);
}

async function assertBuyerQualificationForOpportunity(supabase, opportunity, stageOrAction, body = {}) {
  if (hasStageAdminOverride(body)) {
    return { allowed: true, reason: "admin_override", profile: null };
  }
  const profile = await loadBestReadinessProfileForMandate(supabase, {
    workspaceId: opportunity?.workspace_id,
    mandateId: opportunity?.mandate_id,
  });
  if (readinessQualifiesForBrokerage(profile)) {
    return { allowed: true, reason: "buyer_qualified", profile };
  }
  const error = new Error(`Buyer readiness verification required before ${stageOrAction}`);
  error.statusCode = 409;
  error.code = "buyer_qualification_required";
  error.readiness_level = profile?.readiness_level ?? null;
  error.evidence_status = profile?.evidence_status ?? null;
  error.kyc_state = profile?.kyc_state ?? null;
  throw error;
}

async function resolveWeeklyReportAccess(supabase, { mandate, workspaceId, body = {}, allowManualOverride = false }) {
  if (!mandate?.id) {
    return { allowed: true, reason: "missing_mandate_scope", free_report_count: 0, free_report_limit: FREE_WEEKLY_REPORT_LIMIT };
  }
  const reports = await selectRows(
    supabase
      .from("acquisition_deal_desk_reports")
      .select("id, status, artifact_kind, schedule_kind")
      .eq("mandate_id", mandate.id)
      .eq("schedule_kind", "weekly"),
    "acquisition_deal_desk_reports",
  );
  const freeReportCount = reports.filter((row) =>
    row.status !== "archived" &&
    (row.artifact_kind || "acquisition_report") === "acquisition_report"
  ).length;
  if (freeReportCount < FREE_WEEKLY_REPORT_LIMIT) {
    return { allowed: true, reason: "within_free_weekly_report_limit", free_report_count: freeReportCount, free_report_limit: FREE_WEEKLY_REPORT_LIMIT };
  }
  const profile = await fetchProfileForUser(supabase, mandate.user_id);
  if (profileHasActivePaidPlan(profile)) {
    return { allowed: true, reason: "paid_plan", free_report_count: freeReportCount, free_report_limit: FREE_WEEKLY_REPORT_LIMIT };
  }
  const readinessProfile = await loadBestReadinessProfileForMandate(supabase, {
    workspaceId: workspaceId || mandate.workspace_id,
    mandateId: mandate.id,
  });
  if (readinessQualifiesForBrokerage(readinessProfile)) {
    return { allowed: true, reason: "buyer_qualified", free_report_count: freeReportCount, free_report_limit: FREE_WEEKLY_REPORT_LIMIT };
  }
  if (hasReportAdminApproval({ mandate, body, allowManualOverride })) {
    return { allowed: true, reason: "admin_approved", free_report_count: freeReportCount, free_report_limit: FREE_WEEKLY_REPORT_LIMIT };
  }
  return {
    allowed: false,
    reason: "free_weekly_report_limit_exhausted",
    free_report_count: freeReportCount,
    free_report_limit: FREE_WEEKLY_REPORT_LIMIT,
    requires_upgrade: true,
    reports_paused_reason: "verify_buying_capacity_or_upgrade",
  };
}

async function loadLatestMandateForWorkspace(supabase, workspaceId) {
  const { data, error } = await supabase
    .from("acquisition_mandates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load mandate: ${error.message}`);
  return data || null;
}

async function buildDealDeskPayload(supabase, workspaceId, body = {}) {
  const mandateId = normalizeUuid(body.mandate_id);
  const mandate = mandateId
    ? await fetchMandate(supabase, mandateId)
    : await loadLatestMandateForWorkspace(supabase, workspaceId);
  if (!mandate) {
    const error = new Error("Mandate not found for workspace");
    error.statusCode = 404;
    throw error;
  }

  const searchRunIds = Array.isArray(body.search_run_ids)
    ? body.search_run_ids.map(normalizeUuid).filter(Boolean)
    : [];
  let searchRunsQuery = supabase
    .from("acquisition_search_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(5);
  if (searchRunIds.length) searchRunsQuery = searchRunsQuery.in("id", searchRunIds);
  else if (mandate.id) searchRunsQuery = searchRunsQuery.eq("mandate_id", mandate.id);
  const searchRuns = await selectRows(searchRunsQuery, "acquisition_search_runs");

  const opportunityIds = Array.isArray(body.opportunity_ids)
    ? body.opportunity_ids.map(normalizeUuid).filter(Boolean)
    : [];
  let opportunitiesQuery = supabase
    .from("acquisition_opportunities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (opportunityIds.length) opportunitiesQuery = opportunitiesQuery.in("id", opportunityIds);
  const opportunities = await selectRows(opportunitiesQuery, "acquisition_opportunities");

  let candidatesQuery = supabase
    .from("acquisition_candidate_opportunities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (searchRunIds.length) candidatesQuery = candidatesQuery.in("search_run_id", searchRunIds);
  else if (mandate.id) candidatesQuery = candidatesQuery.eq("mandate_id", mandate.id);
  const candidates = await selectRows(candidatesQuery, "acquisition_candidate_opportunities");

  const loadedOpportunityIds = opportunities.map((row) => row.id).filter(Boolean);
  const [claims, diligenceItems, scenarios, capexEvents, priorNotes] = await Promise.all([
    loadedOpportunityIds.length
      ? selectRows(
        supabase.from("acquisition_claims").select("*").in("opportunity_id", loadedOpportunityIds),
        "acquisition_claims",
      )
      : [],
    loadedOpportunityIds.length
      ? selectRows(
        supabase.from("acquisition_diligence_items").select("*").in("opportunity_id", loadedOpportunityIds),
        "acquisition_diligence_items",
      )
      : [],
    loadedOpportunityIds.length
      ? selectRows(
        supabase.from("acquisition_scenarios").select("*").in("opportunity_id", loadedOpportunityIds),
        "acquisition_scenarios",
      )
      : [],
    loadedOpportunityIds.length
      ? selectRows(
        supabase.from("renovation_estimate_events").select("*").in("acquisition_opportunity_id", loadedOpportunityIds),
        "renovation_estimate_events",
      ).catch(() => [])
      : [],
    selectRows(
      supabase
        .from("acquisition_deal_desk_notes")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("mandate_id", mandate.id)
        .order("created_at", { ascending: false })
        .limit(20),
      "acquisition_deal_desk_notes",
    ).catch(() => []),
  ]);

  const claimsByOpportunity = new Map();
  for (const claim of claims) {
    const rows = claimsByOpportunity.get(claim.opportunity_id) || [];
    rows.push(claim);
    claimsByOpportunity.set(claim.opportunity_id, rows);
  }
  const capexByOpportunity = new Map();
  for (const event of capexEvents) {
    if (!capexByOpportunity.has(event.acquisition_opportunity_id)) {
      capexByOpportunity.set(event.acquisition_opportunity_id, event);
    }
  }
  const underwritingByOpportunity = new Map();
  for (const scenario of scenarios) {
    const underwriting = scenario.outputs_json?.underwriting;
    if (underwriting && !underwritingByOpportunity.has(scenario.opportunity_id)) {
      underwritingByOpportunity.set(scenario.opportunity_id, {
        ...underwriting,
        scenario_id: scenario.id,
        status: underwriting.status || null,
        summary: underwriting.summary || null,
        risk_flags: underwriting.risk_flags || [],
        generated_at: underwriting.generated_at || scenario.updated_at || null,
        basis: "modeled_output",
      });
    }
  }

  const presentation = normalizeReportPresentation(body);
  const candidateRows = candidates.map((candidate) => {
    const fit = compactJson(candidate.screening_output_json?.fit, {});
    const recommendationState = normalizeDealDeskRecommendation(
      candidate.screening_decision || candidate.status,
      { ...candidate, fit_score: fit.score },
    );
    const investmentScore = investmentScoreFor(candidate);
    const location = locationMetadataFromCandidate(candidate);
    return {
      candidate_id: candidate.id,
      opportunity_id: candidate.promoted_opportunity_id || null,
      title: normalizeText(candidate.title) || normalizeText(candidate.source_url) || "Candidate opportunity",
      source_channel: candidate.source || null,
      source_url: candidate.source_url || null,
      address: normalizeText(location.address || candidate.address || candidate.location_text || candidate.title) || null,
      city: candidate.city || null,
      district: candidate.district || null,
      region: candidate.region || candidate.province || null,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      location_precision: location.location_precision || null,
      location_source: location.location_source || null,
      property_type: candidate.property_type || null,
      asking_price: candidate.asking_price ?? null,
      area_sqm: candidate.area_sqm ?? null,
      photo_refs: normalizePhotoRefs(candidate.photo_refs_json),
      fit_score: fit.score ?? candidate.screening_output_json?.score ?? null,
      investment_score: investmentScore,
      confidence: normalizeText(candidate.screening_output_json?.confidence) || null,
      recommendation_state: recommendationState,
      basis: candidate.terms_policy === "allowed" ? "market_signal" : "uncertain_needs_diligence",
      evidence_id: candidate.source_fingerprint || candidate.id,
      map_query: [
        normalizeText(location.map_query || location.address || candidate.address || candidate.location_text || candidate.title),
        location.location_precision === "exact" ? "" : normalizeText(candidate.district),
        location.location_precision === "exact" ? "" : normalizeText(candidate.city),
        location.location_precision === "exact" ? "" : normalizeText(candidate.region || candidate.province),
      ].filter(Boolean).join(", "),
      summary: normalizeText(candidate.short_description) ||
        normalizeText(candidate.screening_output_json?.summary) ||
        normalizeText(fit.reason),
    };
  });

  const opportunityRows = opportunities.map((opportunity) => {
    const claimRows = claimsByOpportunity.get(opportunity.id) || [];
    const capexEvent = capexByOpportunity.get(opportunity.id);
    const underwriting = underwritingByOpportunity.get(opportunity.id) || null;
    const capexJson = compactJson(opportunity.renovation_capex_json || capexEvent?.estimate_json, {});
    const underwritingMedianIrr = Number(underwriting?.summary?.median_irr);
    const economicsSnapshot = buildEconomicsSnapshot(underwriting || {});
    const publicUnderwriting = underwriting
      ? {
        scenario_id: underwriting.scenario_id || null,
        status: underwriting.status || null,
        summary: underwriting.summary || null,
        risk_flags: underwriting.risk_flags || [],
        generated_at: underwriting.generated_at || null,
        basis: underwriting.basis || "modeled_output",
      }
      : null;
    const modeledYield = Number(
      opportunity.metadata_json?.modeled_yield_pct ??
        opportunity.result_json?.modeled_yield_pct ??
        (Number.isFinite(underwritingMedianIrr) ? underwritingMedianIrr * 100 : null),
    );
    const askingPrice = Number(opportunity.asking_price || opportunity.metadata_json?.asking_price || opportunity.result_json?.asking_price);
    const capexBase = Number(capexJson.base || capexJson.base_total || capexJson.total_base);
    const photoRefs = normalizePhotoRefs(opportunity.metadata_json?.photo_refs || opportunity.metadata_json?.photoRefs || []);
    const investmentScore = investmentScoreFor(opportunity);
    const location = locationMetadataFromOpportunity(opportunity);
    const evidenceId =
      claimRows.flatMap((claim) => Array.isArray(claim.evidence_refs_json) ? claim.evidence_refs_json : [])[0] ||
      opportunity.id;
    return {
      opportunity_id: opportunity.id,
      title: normalizeText(opportunity.title || opportunity.name || opportunity.address) || "Opportunity",
      source_channel: opportunity.source_channel || null,
      source_url: opportunity.metadata_json?.source_url || opportunity.result_json?.source_url || null,
      address: normalizeText(location.address || opportunity.address || opportunity.metadata_json?.address || opportunity.result_json?.address || opportunity.title) || null,
      city: opportunity.metadata_json?.city || opportunity.result_json?.city || null,
      district: opportunity.metadata_json?.district || opportunity.result_json?.district || null,
      region: opportunity.metadata_json?.region || opportunity.result_json?.region || null,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      location_precision: location.location_precision || null,
      location_source: location.location_source || null,
      stage: opportunity.stage || null,
      recommendation_state: normalizeDealDeskRecommendation(opportunity.stage, {
        fit_score: opportunity.metadata_json?.fit_score || opportunity.result_json?.fit_score,
      }),
      basis: normalizeDealDeskBasis(claimRows[0]?.basis_label || opportunity.metadata_json?.basis_label),
      asking_price: Number.isFinite(askingPrice) ? askingPrice : null,
      capex_base: Number.isFinite(capexBase) ? capexBase : null,
      modeled_yield_pct: Number.isFinite(modeledYield) ? modeledYield : null,
      economics_snapshot: economicsSnapshot,
      investment_score: investmentScore,
      area_sqm: opportunity.metadata_json?.area_sqm || opportunity.result_json?.area_sqm || null,
      property_type: opportunity.metadata_json?.property_type || opportunity.result_json?.property_type || null,
      photo_refs: photoRefs,
      confidence: normalizeText(opportunity.metadata_json?.confidence || opportunity.result_json?.confidence) || null,
      summary: normalizeText(opportunity.summary || opportunity.description || opportunity.result_json?.summary),
      underwriting: publicUnderwriting,
      evidence_id: typeof evidenceId === "string" ? evidenceId : evidenceId?.evidence_id || opportunity.id,
      claim_count: claimRows.length,
      map_query: [
        normalizeText(location.map_query || location.address || opportunity.address || opportunity.metadata_json?.address || opportunity.result_json?.address || opportunity.title),
        location.location_precision === "exact" ? "" : normalizeText(opportunity.metadata_json?.district || opportunity.result_json?.district),
        location.location_precision === "exact" ? "" : normalizeText(opportunity.metadata_json?.city || opportunity.result_json?.city),
        location.location_precision === "exact" ? "" : normalizeText(opportunity.metadata_json?.region || opportunity.result_json?.region),
      ].filter(Boolean).join(", "),
    };
  });

  const ranked = [...opportunityRows, ...candidateRows]
    .sort((left, right) => {
      const leftInvestmentScore = Number(left.investment_score);
      const rightInvestmentScore = Number(right.investment_score);
      if (Number.isFinite(leftInvestmentScore) || Number.isFinite(rightInvestmentScore)) {
        const investmentDecision =
          (Number.isFinite(rightInvestmentScore) ? rightInvestmentScore : -1) -
          (Number.isFinite(leftInvestmentScore) ? leftInvestmentScore : -1);
        if (investmentDecision) return investmentDecision;
      }
      const stateRank = { strong_pursue: 5, pursue_after_verification: 4, watch: 3, needs_info: 2, pass: 1 };
      const decision = (stateRank[right.recommendation_state] || 0) - (stateRank[left.recommendation_state] || 0);
      if (decision) return decision;
      return Number(right.fit_score || 0) - Number(left.fit_score || 0);
    })
    .slice(0, presentation.top_n);

  const reportPeriod = reportPeriodFromBody(body);
  return {
    payload_schema_version: "deal_desk_payload/v1",
    artifact_kind: "acquisition_report",
    report: {
      id: null,
      artifact_kind: "acquisition_report",
      title: normalizeText(body.title) || `${mandate.title || "Acquisition mandate"} Acquisition Report`,
      report_period: reportPeriod,
      summary: normalizeText(body.presentation_instruction) ||
        "Weekly ranked acquisition report with deal highlights, ratings, AI analysis, simple comparison charts, and source traceability.",
      language: normalizeText(body.language) || "en",
      currency: normalizeText(body.currency) || "SAR",
      presentation,
    },
    mandate: {
      id: mandate.id,
      title: mandate.title || "Acquisition mandate",
      status: mandate.status || null,
      risk_appetite: mandate.risk_appetite || null,
      constraints: [
        { label: "Buy box", value: mandate.buy_box_json, basis: "verified_source" },
        { label: "Locations", value: mandate.target_locations_json, basis: "verified_source" },
        { label: "Budget", value: mandate.budget_range_json, basis: "verified_source" },
      ],
      buy_box: mandate.buy_box_json || {},
      target_locations: mandate.target_locations_json || [],
      budget_range: mandate.budget_range_json || {},
      excluded_criteria: mandate.excluded_criteria_json || [],
    },
    search_runs: searchRuns.map((run) => ({
      id: run.id,
      status: run.status,
      trigger_kind: run.trigger_kind,
      candidate_count: run.candidate_count,
      query_description: run.query_description,
      sources: run.sources_json || [],
      completed_at: run.completed_at || null,
    })),
    ranked_candidates: ranked,
    opportunities: opportunityRows,
    recommendation_states: ["strong_pursue", "pursue_after_verification", "watch", "pass", "needs_info"],
    comparison_matrix: { rows: ranked.map(compactReportRow) },
    presentation,
    scenario_defaults: {
      rent_growth_pct: body.scenario_defaults?.rent_growth_pct ?? 4,
      vacancy_pct: body.scenario_defaults?.vacancy_pct ?? 7,
      financing_rate_pct: body.scenario_defaults?.financing_rate_pct ?? 6,
      exit_cap_rate_pct: body.scenario_defaults?.exit_cap_rate_pct ?? 8,
      basis: "modeled_output",
    },
    renovation: {
      opportunities: opportunityRows.map((row) => ({
        ...compactReportRow(row),
        capex: {
          low: row.capex_base ? Math.round(row.capex_base * 0.75) : null,
          base: row.capex_base,
          high: row.capex_base ? Math.round(row.capex_base * 1.35) : null,
          basis: row.capex_base ? "modeled_output" : "uncertain_needs_diligence",
        },
      })),
    },
    underwriting: {
      opportunities: opportunityRows
        .filter((row) => row.underwriting)
        .map((row) => ({
          opportunity_id: row.opportunity_id,
          title: row.title,
          ...row.underwriting,
        })),
    },
    diligence_gaps: diligenceItems.map((item) => ({
      id: item.id,
      opportunity_id: item.opportunity_id,
      title: item.title,
      status: item.status,
      severity: item.priority,
      basis: normalizeDealDeskBasis(item.evidence_refs_json?.length ? "verified_source" : "uncertain_needs_diligence"),
      evidence_id: Array.isArray(item.evidence_refs_json) ? item.evidence_refs_json[0] : null,
    })),
    source_manifest: {
      basis_labels: [...DEAL_DESK_BASIS_LABELS],
      sources: [
        ...candidateRows.map((row) => ({
          source_id: row.evidence_id,
          title: row.title,
          source_type: row.source_channel || "candidate",
          url: row.source_url || null,
          basis: row.basis,
        })),
        ...claims.map((claim) => ({
          source_id: Array.isArray(claim.evidence_refs_json) ? claim.evidence_refs_json[0] || claim.id : claim.id,
          title: claim.fact_key,
          source_type: claim.source_channel || "claim",
          basis: normalizeDealDeskBasis(claim.basis_label),
        })),
      ].filter((row) => row.source_id),
    },
    prior_notes: priorNotes.map((note) => ({
      id: note.id,
      opportunity_id: note.opportunity_id,
      note_kind: note.note_kind,
      body: note.body,
      created_at: note.created_at,
    })),
    access: {
      visibility: "public_unlisted",
      delivery_hint: normalizeText(body.delivery_hint) || null,
      notes_endpoint: null,
    },
    _internal: {
      scenario_count: scenarios.length,
    },
  };
}

async function refreshReportComputedOutputs(supabase, payload, body = {}) {
  if (body.refresh_computed_outputs === false) {
    return { skipped: true, reason: "disabled_by_request" };
  }
  const opportunityIds = [...new Set((Array.isArray(payload?.ranked_candidates) ? payload.ranked_candidates : [])
    .map((row) => normalizeUuid(row.opportunity_id))
    .filter(Boolean))];
  if (!opportunityIds.length) {
    return { skipped: true, reason: "no_ranked_opportunities" };
  }
  const opportunities = await selectRows(
    supabase.from("acquisition_opportunities").select("*").in("id", opportunityIds),
    "acquisition_opportunities",
  );
  const mandate = payload?.mandate?.id ? await fetchMandate(supabase, payload.mandate.id).catch(() => null) : null;
  let underwritingRuns = 0;
  let locationScores = 0;
  const errors = [];
  for (const opportunity of opportunities) {
    const metadata = compactJson(opportunity.metadata_json, {});
    const result = compactJson(opportunity.result_json, {});
    const nextMetadata = { ...metadata };
    const underwritingInput = {
      mode: "quick",
      ...(body.underwriting_assumptions && typeof body.underwriting_assumptions === "object" ? body.underwriting_assumptions : {}),
    };
    const hasRentAssumption = [
      underwritingInput.monthly_rent,
      underwritingInput.rent,
      underwritingInput.expected_monthly_rent,
      underwritingInput.gross_annual_rent,
      underwritingInput.annual_rent,
      metadata.monthly_rent,
      metadata.rent,
      metadata.expected_monthly_rent,
      metadata.gross_annual_rent,
      metadata.annual_rent,
      result.monthly_rent,
      result.rent,
      result.expected_monthly_rent,
      result.gross_annual_rent,
      result.annual_rent,
    ].some((value) => finiteNumber(value) !== null && finiteNumber(value) > 0);
    const priceForRentProxy = finiteNumber(
      underwritingInput.purchase_price ??
        underwritingInput.acquisition_price ??
        metadata.acquisition_price ??
        metadata.asking_price ??
        metadata.price ??
        result.acquisition_price ??
        result.asking_price ??
        result.price ??
        opportunity.asking_price,
    );
    if (!hasRentAssumption && priceForRentProxy !== null && priceForRentProxy > 0) {
      const monthlyRent = Math.round(priceForRentProxy * 0.0036);
      underwritingInput.monthly_rent = monthlyRent;
      underwritingInput.gross_annual_rent = monthlyRent * 12;
      underwritingInput.rent_assumption_source = "report_default_price_rent_proxy";
    }

    try {
      const underwritingResult = await runAndPersistUnderwriting({
        supabase,
        opportunityId: opportunity.id,
        input: underwritingInput,
        allowInternal: true,
        userId: normalizeUuid(body.user_id || body.created_by),
      });
      underwritingRuns += 1;
      const summary = underwritingResult?.underwriting?.summary || {};
      const medianIrr = Number(summary.median_irr);
      if (Number.isFinite(medianIrr)) {
        nextMetadata.modeled_yield_pct = Math.round(medianIrr * 1000) / 10;
      }
      nextMetadata.underwriting_status = underwritingResult?.underwriting?.status || null;
      nextMetadata.underwriting_summary = summary;
    } catch (error) {
      errors.push({ opportunity_id: opportunity.id, stage: "underwriting", message: error instanceof Error ? error.message : String(error) });
    }

    try {
      const scoreInput = {
        ...opportunity,
        ...metadata,
        asking_price: opportunity.asking_price || metadata.asking_price || metadata.price,
        area_sqm: metadata.area_sqm || metadata.land_area_sqm || metadata.built_up_area_sqm,
        property_type: metadata.property_type,
        city: metadata.city,
        district: metadata.district,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        location_precision: metadata.location_precision,
        location_source: metadata.location_source,
        map_query: metadata.map_query,
        photo_refs_json: metadata.photo_refs || metadata.photoRefs || [],
        metadata_json: nextMetadata,
      };
      const investmentScore = await computeInvestmentScore({ candidate: scoreInput, mandate, supabase });
      if (Number.isFinite(Number(investmentScore?.total))) {
        nextMetadata.investment_score = investmentScore.total;
        nextMetadata.investment_score_breakdown = investmentScore;
        nextMetadata.location_analysis = investmentScore.breakdown?.p6_location_quality || null;
        if (investmentScore.breakdown?.p6_location_quality) locationScores += 1;
      }
    } catch (error) {
      errors.push({ opportunity_id: opportunity.id, stage: "investment_score", message: error instanceof Error ? error.message : String(error) });
    }

    if (JSON.stringify(nextMetadata) !== JSON.stringify(metadata)) {
      await supabase
        .from("acquisition_opportunities")
        .update({ metadata_json: nextMetadata })
        .eq("id", opportunity.id);
    }
  }
  return {
    skipped: false,
    opportunities_seen: opportunities.length,
    underwriting_runs: underwritingRuns,
    location_scores: locationScores,
    errors,
  };
}

function buildDealDeskSourceOverride(payload) {
  const sources = payload.source_manifest?.sources || [];
  return {
    schema_version: "3.0",
    template_id: "acquisition_workspace",
    analyzed_at: new Date().toISOString(),
    source_manifest: {
      documents: sources.slice(0, 20).map((source) => ({
        document_id: source.source_id,
        chunk_count: 1,
        page_numbers: [1],
      })),
      document_count: sources.length,
    },
    proof_manifest: {
      proof_paths: { extracted: "source_anchor", derived: "lineage" },
      counts: {
        total_items: payload.ranked_candidates.length,
        extracted_items: sources.length,
        derived_items: payload.ranked_candidates.length,
        anchor_verified_items: sources.length,
        anchor_failed_items: 0,
        derived_with_lineage: payload.ranked_candidates.length,
      },
    },
    items: payload.ranked_candidates.slice(0, 20).map((row, index) => ({
      id: row.opportunity_id || row.candidate_id || `deal_desk_item_${index + 1}`,
      structural_facet: "annotation",
      provenance_class: "derived",
      display_name: row.title || `Candidate ${index + 1}`,
      confidence: row.basis === "uncertain_needs_diligence" ? "low" : "medium",
      verification_state: row.basis === "uncertain_needs_diligence" ? "needs_review" : "verified",
      payload: {
        annotation_kind: "deal_desk_candidate",
        summary: row.summary || null,
        recommendation_state: row.recommendation_state,
        basis_label: row.basis,
      },
      source_anchors: row.evidence_id ? [{ document_id: row.evidence_id, page_number: 1 }] : [],
      created_at: new Date().toISOString(),
    })),
    links: [],
    stage_trace: { execution_plane: "gcp", entries: [] },
  };
}

async function publishDealDeskReport({ report, payload, requestId }) {
  const publicationBaseUrl = normalizeText(
    process.env.EXPERIENCES_PUBLICATION_API_URL ||
      process.env.EXPERIENCES_PUBLICATION_URL ||
      process.env.PUBLICATION_API_BASE_URL,
  ).replace(/\/+$/, "");
  if (!publicationBaseUrl) {
    return {
      attempted: false,
      status: "assembled",
      experience_id: report.experience_id,
      live_url: report.live_url,
      redeem_url: report.redeem_url,
      reason: "publication_api_not_configured",
    };
  }
  const actorId = report.created_by || "acquisition-report";
  const headers = getInternalTaskHeaders(requestId);
  const post = async (path, body) => {
    const response = await fetch(`${publicationBaseUrl}${path}`, {
      method: "POST",
      headers: { ...headers, "x-zohal-user-id": actorId },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(json?.error?.message || json?.message || `Publication request failed: ${response.status}`);
      error.statusCode = response.status;
      error.response = json;
      throw error;
    }
    return json;
  };
  const get = async (path) => {
    const response = await fetch(`${publicationBaseUrl}${path}`, {
      method: "GET",
      headers: { ...headers, "x-zohal-user-id": actorId },
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(json?.error?.message || json?.message || `Publication request failed: ${response.status}`);
      error.statusCode = response.status;
      error.response = json;
      throw error;
    }
    return json;
  };
  const requestBody = {
    request_id: requestId,
    workspace_id: report.workspace_id,
    document_id: report.id,
    verification_object_id: `deal_desk_${report.id}`,
    verification_object_version_id: `deal_desk_payload_${report.id}`,
    experience_id: report.experience_id,
    analysis_template_id: "acquisition_workspace",
    surface_family: "deal_desk",
    path_family: "deal-desk",
    host: process.env.DEAL_DESK_LIVE_HOST || "live.mihad.properties",
    visibility: "public_unlisted",
    publication_lane: "trusted_runtime",
    org_restricted: false,
    title: payload.report.title,
    summary: payload.report.summary,
    source_override: buildDealDeskSourceOverride(payload),
    operations_workspace_state: {
      workspace: { id: report.workspace_id },
      analysis_space: {
        scope_entity_type: "mandate",
        scope_entity_id: report.mandate_id,
      },
      summary: {
        property_count: payload.ranked_candidates.length,
        linked_document_count: payload.source_manifest.sources.length,
      },
      deal_desk_payload: payload,
    },
  };
  const compile = await post("/v1/experiences/compile", requestBody);
  const candidateId = compile?.compile?.candidate_id;
  if (!candidateId) throw new Error("Publication compile did not return candidate_id");
  await post(`/v1/experiences/candidates/${encodeURIComponent(candidateId)}/validate`, { request: "deal_desk_publish" });
  const promote = await post(`/v1/experiences/candidates/${encodeURIComponent(candidateId)}/promote`, { actor_id: actorId });
  const diagnostics = await get(
    `/v1/experiences/publications/${encodeURIComponent(compile?.compile?.experience_id || report.experience_id)}/diagnostics?candidate_id=${encodeURIComponent(candidateId)}&refresh_probe=1&route_id=brief`,
  ).catch(() => null);
  const experienceId = compile?.compile?.experience_id || report.experience_id;
  const canonicalLiveUrl =
    diagnostics?.diagnostics?.summary?.live_url ||
    promote?.diagnostics?.summary?.live_url ||
    compile?.compile?.public_url ||
    null;
  const verifiedLiveUrl = diagnostics?.diagnostics?.live_probe?.ok
    ? canonicalLiveUrl
    : null;
  let redeemUrl =
    diagnostics?.diagnostics?.live_probe?.redeem_url ||
    promote?.access?.redeem_url ||
    promote?.redeem_url ||
    null;
  if (!redeemUrl && canonicalLiveUrl) {
    const canonicalPath = new URL(canonicalLiveUrl).pathname || "/";
    const ttlSeconds = 60 * 60 * 24 * 14;
    const accessSession = await post("/v1/experiences/access/links", {
      experience_id: experienceId,
      host: requestBody.host,
      next_path: canonicalPath,
      ttl_seconds: ttlSeconds,
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      metadata: {
        source: "acquisition_report",
        report_id: report.id,
        workspace_id: report.workspace_id,
      },
    }).catch(() => null);
    redeemUrl = accessSession?.redeem_url || null;
  }
  const verifiedRedeemAccess = redeemUrl
    ? await verifyRedeemAccessUrl(redeemUrl, canonicalLiveUrl).catch(() => false)
    : false;
  return {
    attempted: true,
    status: verifiedLiveUrl || verifiedRedeemAccess ? "private_live" : "compiled",
    experience_id: experienceId,
    live_url: verifiedLiveUrl || (verifiedRedeemAccess ? canonicalLiveUrl : null),
    redeem_url: redeemUrl,
    candidate_id: candidateId,
    verified_access: Boolean(verifiedLiveUrl || verifiedRedeemAccess),
  };
}

async function findExistingAcquisitionReport(supabase, { workspaceId, mandateId, reportPeriod, scheduleKind = null }) {
  const { data, error } = await supabase
    .from("acquisition_deal_desk_reports")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("mandate_id", mandateId)
    .eq("report_period", reportPeriod);
  if (error) throw new Error(`Failed to inspect Acquisition Report idempotency: ${error.message}`);
  const rows = Array.isArray(data) ? data : [];
  return rows.find((row) => {
    if (row.status === "archived") return false;
    if ((row.artifact_kind || "acquisition_report") !== "acquisition_report") return false;
    if (scheduleKind && (row.schedule_kind || null) !== scheduleKind) return false;
    return true;
  }) || null;
}

async function createAcquisitionReport(supabase, workspaceId, body = {}, { requestId, idempotent = false, allowManualOverride = false } = {}) {
  const normalizedWorkspaceId = normalizeUuid(workspaceId);
  if (!normalizedWorkspaceId) {
    const error = new Error("workspace_id is required");
    error.statusCode = 400;
    throw error;
  }
  let payload = await buildDealDeskPayload(supabase, normalizedWorkspaceId, body);
  const reportPeriod = payload.report.report_period;
  const scheduleKind = normalizeText(body.schedule_kind || body.trigger_kind);
  if (idempotent || scheduleKind === "weekly") {
    const existing = await findExistingAcquisitionReport(supabase, {
      workspaceId: normalizedWorkspaceId,
      mandateId: payload.mandate.id,
      reportPeriod,
      scheduleKind: scheduleKind || null,
    });
    if (existing) {
      return {
        report_id: existing.id,
        experience_id: existing.experience_id,
        artifact_kind: existing.artifact_kind || "acquisition_report",
        surface_family: "deal_desk",
        surface_key: existing.surface_key,
        report_url: existing.live_url || null,
        legacy_deal_desk_url: existing.live_url || null,
        live_url: existing.live_url || null,
        redeem_url: existing.redeem_url || null,
        status: existing.status,
        idempotent: true,
        publication: { attempted: false, status: existing.status, reason: "existing_report" },
      };
    }
  }
  if (scheduleKind === "weekly") {
    const reportMandate = await fetchMandate(supabase, payload.mandate.id).catch(() => payload.mandate);
    const access = await resolveWeeklyReportAccess(supabase, {
      mandate: { ...reportMandate, user_id: reportMandate?.user_id || body.user_id },
      workspaceId: normalizedWorkspaceId,
      body,
      allowManualOverride,
    });
    if (!access.allowed) {
      return {
        report_id: null,
        experience_id: null,
        artifact_kind: "acquisition_report",
        surface_family: "deal_desk",
        surface_key: null,
        report_url: null,
        legacy_deal_desk_url: null,
        live_url: null,
        redeem_url: null,
        status: "paused",
        paused: true,
        reports_paused_reason: access.reports_paused_reason,
        requires_upgrade: access.requires_upgrade,
        free_report_count: access.free_report_count,
        free_report_limit: access.free_report_limit,
        publication: { attempted: false, status: "paused", reason: access.reason },
      };
    }
    payload.access = {
      ...(payload.access || {}),
      weekly_report_access: access,
    };
  }
  const computedOutputs = await refreshReportComputedOutputs(supabase, payload, body).catch((error) => ({
    skipped: false,
    error: error instanceof Error ? error.message : String(error),
  }));
  if (!computedOutputs.skipped && !computedOutputs.error) {
    payload = await buildDealDeskPayload(supabase, normalizedWorkspaceId, body);
  }
  payload.computed_outputs = computedOutputs;
  const surfaceKey = buildDealDeskSurfaceKey(normalizedWorkspaceId, reportPeriod);
  const experienceId = `exp_${surfaceKey}`;
  const notesEndpoint = `/api/acquisition/v1/acquisition-reports/{report_id}/notes`;
  payload.access.notes_endpoint = notesEndpoint;
  const { data: report, error } = await supabase
    .from("acquisition_deal_desk_reports")
    .insert({
      workspace_id: normalizedWorkspaceId,
      mandate_id: payload.mandate.id,
      report_period: reportPeriod,
      artifact_kind: "acquisition_report",
      schedule_kind: scheduleKind || null,
      generated_for_period: reportPeriod,
      presentation_json: payload.presentation || payload.report.presentation || {},
      status: "assembled",
      surface_key: surfaceKey,
      experience_id: experienceId,
      live_url: null,
      redeem_url: null,
      payload_json: payload,
      created_by: normalizeUuid(body.user_id || body.created_by),
    })
    .select("*")
    .single();
  if (error) throw new Error(`Failed to create Acquisition Report: ${error.message}`);

  payload.report.id = report.id;
  payload.access.notes_endpoint = `/api/acquisition/v1/acquisition-reports/${report.id}/notes`;
  await supabase
    .from("acquisition_deal_desk_reports")
    .update({ payload_json: payload })
    .eq("id", report.id);

  let publication = null;
  try {
    publication = await publishDealDeskReport({
      report: { ...report, experience_id: experienceId },
      payload,
      requestId,
    });
    await supabase
      .from("acquisition_deal_desk_reports")
      .update({
        status: publication.status || "assembled",
        experience_id: publication.experience_id || experienceId,
        live_url: publication.live_url || null,
        redeem_url: publication.redeem_url || null,
      })
      .eq("id", report.id);
  } catch (publishError) {
    publication = {
      attempted: true,
      status: "promotion_failed",
      error: publishError instanceof Error ? publishError.message : String(publishError),
    };
    await supabase
      .from("acquisition_deal_desk_reports")
      .update({ status: "promotion_failed" })
      .eq("id", report.id);
  }

  return {
    report_id: report.id,
    experience_id: publication?.experience_id || experienceId,
    artifact_kind: "acquisition_report",
    surface_family: "deal_desk",
    surface_key: surfaceKey,
    report_url: publication?.live_url || null,
    legacy_deal_desk_url: publication?.live_url || null,
    live_url: publication?.live_url || null,
    redeem_url: publication?.redeem_url || null,
    status: publication?.status || "assembled",
    publication,
  };
}

async function createDealDeskReport(supabase, workspaceId, body = {}, options = {}) {
  return createAcquisitionReport(supabase, workspaceId, body, options);
}

async function scheduleWeeklyReportTask({ req, requestId, mandate, reportPeriod }) {
  if (!TASKS_LOCATION) {
    return { enqueued: false, reason: "GCP_TASKS_LOCATION not configured" };
  }
  const task = await createHttpTask({
    queueName: REPORT_TASK_QUEUE,
    location: TASKS_LOCATION,
    url: `${buildServiceBaseUrl(req)}/internal/acquisition/report-task`,
    payload: {
      workspace_id: mandate.workspace_id,
      mandate_id: mandate.id,
      report_period: reportPeriod,
      schedule_kind: "weekly",
      request_id: requestId,
    },
    headers: getInternalTaskHeaders(requestId),
  });
  return { enqueued: true, task_name: task.name || null };
}

async function runWeeklyAcquisitionReports({ supabase, req, requestId, body = {} }) {
  const reportPeriod = reportPeriodFromBody({
    report_period: body.report_period || body.period || currentIsoWeekPeriod(),
  });
  const maxMandates = clampNumber(body.max_mandates, 50, 1, 250);
  const workspaceId = normalizeUuid(body.workspace_id);
  const mandateIds = Array.isArray(body.mandate_ids)
    ? body.mandate_ids.map(normalizeUuid).filter(Boolean)
    : [];
  let query = supabase
    .from("acquisition_mandates")
    .select("*")
    .eq("status", "active")
    .limit(maxMandates);
  if (workspaceId) query = query.eq("workspace_id", workspaceId);
  if (mandateIds.length) query = query.in("id", mandateIds);
  const mandates = await selectRows(query, "acquisition_mandates");
  const shouldQueue = body.enqueue !== false && body.process_inline !== true && TASKS_LOCATION;
  const results = [];
  for (const mandate of mandates.filter((row) => row.workspace_id)) {
    if (shouldQueue) {
      results.push({
        mandate_id: mandate.id,
        workspace_id: mandate.workspace_id,
        queue: await scheduleWeeklyReportTask({ req, requestId, mandate, reportPeriod }),
      });
      continue;
    }
    try {
      const report = await createAcquisitionReport(supabase, mandate.workspace_id, {
        ...body,
        mandate_id: mandate.id,
        report_period: reportPeriod,
        schedule_kind: "weekly",
        delivery_hint: body.delivery_hint || "weekly",
      }, { requestId, idempotent: true, allowManualOverride: true });
      results.push({ mandate_id: mandate.id, workspace_id: mandate.workspace_id, report });
    } catch (error) {
      results.push({
        mandate_id: mandate.id,
        workspace_id: mandate.workspace_id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return {
    report_period: reportPeriod,
    schedule_kind: "weekly",
    queued: Boolean(shouldQueue),
    mandate_count: mandates.length,
    results,
  };
}

async function addDealDeskReportNote(supabase, reportId, body = {}) {
  const { data: report, error: reportError } = await supabase
    .from("acquisition_deal_desk_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();
  if (reportError || !report) {
    const error = new Error(reportError?.message || "Deal Desk report not found");
    error.statusCode = 404;
    throw error;
  }
  const requestedNoteKind = normalizeText(body.note_kind || body.kind) || "general";
  const noteKind = DEAL_DESK_NOTE_KINDS.has(requestedNoteKind) ? requestedNoteKind : "general";
  const bodyText = normalizeText(body.body || body.note || body.text);
  if (!bodyText) {
    const error = new Error("note body is required");
    error.statusCode = 400;
    throw error;
  }
  if (bodyText.length > 5000) {
    const error = new Error("note body is too long");
    error.statusCode = 400;
    throw error;
  }
  const { data: note, error } = await supabase
    .from("acquisition_deal_desk_notes")
    .insert({
      report_id: report.id,
      workspace_id: report.workspace_id,
      mandate_id: report.mandate_id,
      opportunity_id: normalizeUuid(body.opportunity_id),
      note_kind: noteKind,
      body: bodyText,
      viewer_ref: normalizeText(body.viewer_ref) || null,
      metadata_json: body.metadata_json || body.metadata || {},
    })
    .select("*")
    .single();
  if (error) throw new Error(`Failed to store Deal Desk note: ${error.message}`);
  return { report_id: report.id, note };
}

// ---------------------------------------------------------------------------
// Mihad cross-border handlers: Discover intake, buyer packets, broker partners,
// broker events, scorecard recompute, verification expiry.
// ---------------------------------------------------------------------------

function deriveBudgetBand(budgetMin, budgetMax, currency = "SAR") {
  const cur = String(currency || "SAR").toUpperCase();
  const min = Number(budgetMin || 0);
  const max = Number(budgetMax || 0);
  if (!max || max <= 0) return null;
  const fmt = (value) => {
    if (value >= 1_000_000) return `${Math.round((value / 1_000_000) * 10) / 10}M`;
    if (value >= 1000) return `${Math.round(value / 1000)}K`;
    return String(Math.round(value));
  };
  if (min > 0 && max > min) return `${fmt(min)}-${fmt(max)} ${cur}`;
  return `<${fmt(max)} ${cur}`;
}

async function createDiscoverIntake(supabase, body = {}) {
  const userId = normalizeUuid(body.user_id);
  if (!userId) {
    const error = new Error("user_id is required");
    error.statusCode = 400;
    throw error;
  }
  const targetCountryCodes = normalizeTargetCountryCodes(
    body.target_country_codes ?? body.target_countries,
  );
  const purpose = normalizeEnum(body.purpose, MANDATE_PURPOSES);
  const timeline = normalizeEnum(body.timeline, MANDATE_TIMELINES);
  const liquidityClass = normalizeEnum(body.liquidity_class, MANDATE_LIQUIDITY_CLASSES);
  const budgetCurrency = normalizeBudgetCurrency(body.budget_currency);
  const budgetRange = body.budget_range || body.budget_range_json || {};
  const budgetBand = deriveBudgetBand(
    Number(budgetRange.min || budgetRange.minimum || 0),
    Number(budgetRange.max || budgetRange.maximum || 0),
    budgetCurrency,
  );

  const mandateTitle =
    normalizeText(body.title) ||
    `Mihad Discover — ${targetCountryCodes.join(", ")}`;

  const mandate = await createMandate(supabase, {
    user_id: userId,
    organization_id: normalizeUuid(body.organization_id),
    workspace_id: normalizeUuid(body.workspace_id),
    title: mandateTitle,
    status: "active",
    buy_box_json: body.buy_box || body.buy_box_json || {},
    target_locations_json: body.target_locations || body.target_locations_json || [],
    budget_range_json: budgetRange,
    target_country_codes: targetCountryCodes,
    purpose,
    timeline,
    liquidity_class: liquidityClass,
    budget_currency: budgetCurrency,
    confidence_json: { source: "mihad_discover_intake", ...(body.confidence || {}) },
  });

  const profilePayload = {
    workspace_id: mandate.workspace_id,
    mandate_id: mandate.id,
    buyer_user_id: userId,
    organization_id: mandate.organization_id,
    buyer_type: body.buyer_type || "individual",
    mandate_summary: body.mandate_summary || mandateTitle,
    funding_path: body.funding_path || liquidityClass,
    sharing_mode: "private",
    metadata_json: {
      source: "mihad_discover_intake",
      target_country_codes: targetCountryCodes,
      purpose,
      timeline,
      liquidity_class: liquidityClass,
      budget_currency: budgetCurrency,
    },
    created_by: userId,
  };
  const profile = await createReadinessProfile(supabase, profilePayload);

  if (budgetBand) {
    await supabase
      .from("buyer_readiness_profiles")
      .update({ budget_band: budgetBand })
      .eq("id", profile.id);
    profile.budget_band = budgetBand;
  }

  return {
    mandate,
    readiness_profile: profile,
    target_country_codes: targetCountryCodes,
    purpose,
    timeline,
    liquidity_class: liquidityClass,
    budget_currency: budgetCurrency,
    budget_band: budgetBand,
  };
}

async function clarifyMandate(supabase, mandateId, body = {}) {
  const mandate = await fetchMandate(supabase, mandateId);
  if (!mandate) {
    const error = new Error("mandate_not_found");
    error.statusCode = 404;
    throw error;
  }
  const patch = {};
  if (body.purpose !== undefined) patch.purpose = normalizeEnum(body.purpose, MANDATE_PURPOSES);
  if (body.timeline !== undefined) patch.timeline = normalizeEnum(body.timeline, MANDATE_TIMELINES);
  if (body.liquidity_class !== undefined) {
    patch.liquidity_class = normalizeEnum(body.liquidity_class, MANDATE_LIQUIDITY_CLASSES);
  }
  if (body.budget_currency !== undefined) {
    patch.budget_currency = normalizeBudgetCurrency(body.budget_currency);
  }
  if (body.budget_range !== undefined || body.budget_range_json !== undefined) {
    patch.budget_range_json = body.budget_range || body.budget_range_json || {};
  }
  if (body.buy_box !== undefined || body.buy_box_json !== undefined) {
    patch.buy_box_json = body.buy_box || body.buy_box_json || {};
  }
  if (body.target_country_codes !== undefined || body.target_countries !== undefined) {
    patch.target_country_codes = normalizeTargetCountryCodes(
      body.target_country_codes ?? body.target_countries,
    );
  }
  if (body.target_locations !== undefined || body.target_locations_json !== undefined) {
    patch.target_locations_json = body.target_locations || body.target_locations_json || [];
  }
  if (body.confidence !== undefined || body.confidence_json !== undefined) {
    patch.confidence_json = body.confidence || body.confidence_json || mandate.confidence_json || {};
  }
  if (body.excluded_criteria !== undefined || body.excluded_criteria_json !== undefined) {
    patch.excluded_criteria_json = body.excluded_criteria || body.excluded_criteria_json || [];
  }

  if (Object.keys(patch).length === 0) {
    return { mandate, gaps: detectMandateGaps(mandate) };
  }

  const { data, error } = await supabase
    .from("acquisition_mandates")
    .update(patch)
    .eq("id", mandate.id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to clarify mandate: ${error?.message || "unknown"}`);

  return { mandate: data, gaps: detectMandateGaps(data) };
}

function detectMandateGaps(mandate) {
  const gaps = [];
  if (!mandate.purpose) gaps.push("purpose");
  if (!mandate.timeline) gaps.push("timeline");
  if (!mandate.liquidity_class) gaps.push("liquidity_class");
  const codes = Array.isArray(mandate.target_country_codes) ? mandate.target_country_codes : [];
  if (codes.length === 0) gaps.push("target_country_codes");
  const budget = mandate.budget_range_json || {};
  if (!budget.max && !budget.maximum) gaps.push("budget_max");
  return gaps;
}

const BUYER_PACKET_ALLOWED_FIELDS = [
  "target_country_codes",
  "purpose",
  "timeline",
  "liquidity_class",
  "budget_currency",
  "budget_band",
  "buyer_type",
  "preferences",
  "verification_confidence",
  "verification_expires_at",
  "readiness_level",
  "evidence_status",
];

function pickPacketFields(source = {}) {
  const out = {};
  for (const key of BUYER_PACKET_ALLOWED_FIELDS) {
    if (source[key] !== undefined && source[key] !== null) {
      out[key] = source[key];
    }
  }
  return out;
}

async function createBuyerPacket(supabase, body = {}) {
  const profileId = normalizeUuid(body.buyer_profile_id);
  if (!profileId) {
    const error = new Error("buyer_profile_id is required");
    error.statusCode = 400;
    throw error;
  }
  const profile = await fetchReadinessProfile(supabase, profileId);
  const mandate = profile.mandate_id ? await fetchMandate(supabase, profile.mandate_id) : null;

  const { count: versionCount } = await supabase
    .from("buyer_packets")
    .select("id", { count: "exact", head: true })
    .eq("buyer_profile_id", profile.id);
  const nextVersion = (versionCount || 0) + 1;

  const ttlDays = Number.isFinite(Number(body.ttl_days)) && Number(body.ttl_days) > 0
    ? Math.min(365, Number(body.ttl_days))
    : BUYER_PACKET_TTL_DAYS;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  const snapshot = pickPacketFields({
    target_country_codes: mandate?.target_country_codes,
    purpose: mandate?.purpose,
    timeline: mandate?.timeline,
    liquidity_class: mandate?.liquidity_class,
    budget_currency: mandate?.budget_currency,
    budget_band: profile.budget_band,
    buyer_type: profile.buyer_type,
    preferences: body.preferences || null,
    verification_confidence: profile.verification_confidence,
    verification_expires_at: profile.verification_expires_at,
    readiness_level: profile.readiness_level,
    evidence_status: profile.evidence_status,
  });

  const consentScope = body.consent_scope_json || body.consent_scope || {
    broker_partner_ids: [],
    markets: snapshot.target_country_codes || [],
    until: expiresAt,
  };

  const payload = {
    buyer_profile_id: profile.id,
    workspace_id: profile.workspace_id,
    mandate_id: mandate?.id || null,
    version: nextVersion,
    snapshot_json: snapshot,
    consent_scope_json: consentScope,
    status: "active",
    expires_at: expiresAt,
    created_by: normalizeUuid(body.user_id || body.created_by),
  };
  const { data, error } = await supabase
    .from("buyer_packets")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create buyer packet: ${error?.message || "unknown"}`);
  return { packet: data };
}

async function grantBuyerPacketToBroker(supabase, packetId, body = {}) {
  const { data: packet, error: fetchError } = await supabase
    .from("buyer_packets")
    .select("*")
    .eq("id", packetId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!packet) {
    const error = new Error("buyer_packet_not_found");
    error.statusCode = 404;
    throw error;
  }
  if (packet.status !== "active") {
    const error = new Error("buyer_packet_not_active");
    error.statusCode = 409;
    throw error;
  }
  const brokerPartnerId = normalizeUuid(body.broker_partner_id);
  if (!brokerPartnerId) {
    const error = new Error("broker_partner_id is required");
    error.statusCode = 400;
    throw error;
  }
  const purpose = normalizeText(body.purpose) || "share_buyer_readiness_with_broker";
  const ttlDays = Number.isFinite(Number(body.ttl_days)) && Number(body.ttl_days) > 0
    ? Math.min(60, Number(body.ttl_days))
    : 30;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
  const cappedExpiry = packet.expires_at && new Date(packet.expires_at) < new Date(expiresAt)
    ? packet.expires_at
    : expiresAt;

  const grantPayload = {
    workspace_id: packet.workspace_id,
    buyer_profile_id: packet.buyer_profile_id,
    opportunity_id: normalizeUuid(body.opportunity_id),
    granted_by: normalizeUuid(body.user_id || body.granted_by),
    granted_to_kind: "broker",
    granted_to_identifier: brokerPartnerId,
    purpose,
    allowed_action: "share_status",
    share_mode: "status_only",
    expires_at: cappedExpiry,
    metadata_json: {
      buyer_packet_id: packet.id,
      packet_version: packet.version,
      consent_scope: packet.consent_scope_json,
    },
  };

  const { data, error } = await supabase
    .from("document_sharing_grants")
    .insert(grantPayload)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to grant buyer packet: ${error?.message || "unknown"}`);
  }

  const existingScope = packet.consent_scope_json && typeof packet.consent_scope_json === "object"
    ? packet.consent_scope_json
    : {};
  const brokerIds = new Set(
    Array.isArray(existingScope.broker_partner_ids) ? existingScope.broker_partner_ids : [],
  );
  brokerIds.add(brokerPartnerId);
  await supabase
    .from("buyer_packets")
    .update({
      consent_scope_json: {
        ...existingScope,
        broker_partner_ids: [...brokerIds],
        last_granted_at: new Date().toISOString(),
      },
    })
    .eq("id", packet.id);

  return { grant: data, packet_id: packet.id };
}

async function revokeBuyerPacketGrant(supabase, grantId, body = {}) {
  const id = normalizeUuid(grantId);
  if (!id) {
    const error = new Error("grant_id is required");
    error.statusCode = 400;
    throw error;
  }
  const { data: existing, error: fetchError } = await supabase
    .from("document_sharing_grants")
    .select("id, workspace_id, granted_to_identifier, revoked_at, expires_at, metadata_json")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) {
    const error = new Error("sharing_grant_not_found");
    error.statusCode = 404;
    throw error;
  }
  if (existing.revoked_at) {
    return { grant: existing, already_revoked: true };
  }
  const reason = normalizeText(body.reason) || "revoked_by_buyer";
  const { data: updated, error: updateError } = await supabase
    .from("document_sharing_grants")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (updateError || !updated) {
    throw new Error(`Failed to revoke sharing grant: ${updateError?.message || "unknown"}`);
  }

  const brokerPartnerId = normalizeUuid(existing.granted_to_identifier);
  if (brokerPartnerId) {
    try {
      await supabase.from("broker_events").insert({
        broker_partner_id: brokerPartnerId,
        workspace_id: existing.workspace_id,
        event_type: "consent_revoked",
        outcome: reason,
        metadata_json: {
          sharing_grant_id: id,
          reason,
          buyer_packet_id: existing.metadata_json?.buyer_packet_id ?? null,
        },
      });
    } catch (_) {
      // Non-fatal: revocation itself already succeeded; scorecard recompute
      // will pick this up on the next cron tick once the enum is extended.
    }
  }

  return { grant: updated, already_revoked: false };
}

async function listBrokerPartners(supabase, query = {}) {
  let req = supabase
    .from("broker_partners")
    .select("*")
    .order("updated_at", { ascending: false });
  if (query.country_code) {
    req = req.eq("country_code", String(query.country_code).toUpperCase());
  }
  if (query.status) {
    req = req.eq("status", String(query.status));
  }
  const { data, error } = await req;
  if (error) throw error;
  return { broker_partners: data || [] };
}

async function createBrokerPartner(supabase, body = {}) {
  const displayName = normalizeText(body.display_name || body.name);
  if (!displayName) {
    const error = new Error("display_name is required");
    error.statusCode = 400;
    throw error;
  }
  const countryCode = String(body.country_code || "").trim().toUpperCase();
  if (!SUPPORTED_TARGET_COUNTRIES.has(countryCode)) {
    const error = new Error("country_code must be one of SA, AE, TR, GR, ES");
    error.statusCode = 400;
    throw error;
  }
  const status = BROKER_PARTNER_STATUSES.has(body.status) ? body.status : "candidate";
  const licensing = body.licensing_json || body.licensing || {};
  const languages = Array.isArray(body.languages) ? body.languages : [];
  const responseSla = Number.isFinite(Number(body.response_sla_minutes))
    ? Math.max(0, Math.round(Number(body.response_sla_minutes)))
    : null;

  if (status === "active") {
    if (!licensing || Object.keys(licensing).length === 0) {
      const error = new Error("active brokers require licensing_json");
      error.statusCode = 422;
      throw error;
    }
    if (!body.privacy_agreement_signed_at) {
      const error = new Error("active brokers require privacy_agreement_signed_at");
      error.statusCode = 422;
      throw error;
    }
  }

  const payload = {
    display_name: displayName,
    legal_name: normalizeText(body.legal_name) || null,
    country_code: countryCode,
    city: normalizeText(body.city) || null,
    languages,
    licensing_json: licensing,
    markets_covered_json: body.markets_covered_json || body.markets_covered || {},
    contact_email: normalizeText(body.contact_email) || null,
    contact_phone: normalizeText(body.contact_phone) || null,
    status,
    privacy_agreement_signed_at: body.privacy_agreement_signed_at || null,
    response_sla_minutes: responseSla,
    co_brokerage_terms_json: body.co_brokerage_terms_json || body.co_brokerage_terms || {},
    notes: normalizeText(body.notes) || null,
    metadata_json: body.metadata_json || body.metadata || {},
    organization_id: normalizeUuid(body.organization_id),
    created_by: normalizeUuid(body.created_by || body.user_id),
  };

  const { data, error } = await supabase
    .from("broker_partners")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create broker partner: ${error?.message || "unknown"}`);
  }
  return { broker_partner: data };
}

async function logBrokerEvent(supabase, brokerPartnerId, body = {}) {
  const { data: broker, error: fetchError } = await supabase
    .from("broker_partners")
    .select("id")
    .eq("id", brokerPartnerId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!broker) {
    const error = new Error("broker_partner_not_found");
    error.statusCode = 404;
    throw error;
  }
  const eventType = normalizeText(body.event_type);
  if (!BROKER_EVENT_TYPES.has(eventType)) {
    const error = new Error("invalid event_type");
    error.statusCode = 400;
    throw error;
  }
  const latency = Number.isFinite(Number(body.response_latency_seconds))
    ? Math.max(0, Math.round(Number(body.response_latency_seconds)))
    : null;
  const payload = {
    broker_partner_id: broker.id,
    workspace_id: normalizeUuid(body.workspace_id),
    opportunity_id: normalizeUuid(body.opportunity_id),
    buyer_profile_id: normalizeUuid(body.buyer_profile_id),
    event_type: eventType,
    response_latency_seconds: latency,
    outcome: normalizeText(body.outcome) || null,
    metadata_json: body.metadata_json || body.metadata || {},
    recorded_by: normalizeUuid(body.recorded_by || body.user_id),
    occurred_at: body.occurred_at || new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("broker_events")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to log broker event: ${error?.message || "unknown"}`);
  }
  return { broker_event: data };
}

async function getBrokerScorecard(supabase, brokerPartnerId) {
  const { data, error } = await supabase
    .from("broker_scorecards")
    .select("*")
    .eq("broker_partner_id", brokerPartnerId)
    .maybeSingle();
  if (error) throw error;
  return { scorecard: data || null };
}

function median(values = []) {
  const cleaned = values.filter((v) => Number.isFinite(v));
  if (!cleaned.length) return null;
  const sorted = [...cleaned].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function computeScorecardFromEvents(events = [], { responseSlaMinutes } = {}) {
  const intros = events.filter((e) => e.event_type === "intro_sent");
  const firstResponses = events.filter((e) => e.event_type === "first_response");
  const shortlistsProvided = events.filter((e) => e.event_type === "shortlist_provided");
  const shortlistsAccepted = events.filter((e) => e.event_type === "shortlist_accepted");
  const offerSubmitted = events.filter((e) => e.event_type === "offer_submitted");
  const closings = events.filter((e) => e.event_type === "closing_completed");
  const complaints = events.filter((e) => e.event_type === "buyer_complaint");
  const compliance = events.filter((e) => e.event_type === "compliance_incident");
  const consentRevocations = events.filter((e) => e.event_type === "consent_revoked");

  const slaSeconds = Number.isFinite(Number(responseSlaMinutes))
    ? Math.max(60, Number(responseSlaMinutes) * 60)
    : 60 * 60 * 24;
  const responseLatencies = firstResponses
    .map((e) => Number(e.response_latency_seconds))
    .filter((v) => Number.isFinite(v));
  const medianLatency = median(responseLatencies);
  const responseSpeedPts = (() => {
    if (medianLatency == null) return 12;
    if (medianLatency <= slaSeconds * 0.25) return 25;
    if (medianLatency <= slaSeconds * 0.5) return 22;
    if (medianLatency <= slaSeconds) return 18;
    if (medianLatency <= slaSeconds * 2) return 12;
    if (medianLatency <= slaSeconds * 4) return 6;
    return 2;
  })();

  const shortlistQualityPts = (() => {
    if (shortlistsProvided.length === 0) return 10;
    const ratio = shortlistsAccepted.length / shortlistsProvided.length;
    return Math.round(Math.max(0, Math.min(1, ratio)) * 20);
  })();

  const buyerSatisfactionPts = 12;

  const offerToClosePts = (() => {
    if (offerSubmitted.length === 0) return 10;
    const ratio = closings.length / offerSubmitted.length;
    return Math.round(Math.max(0, Math.min(1, ratio)) * 20);
  })();

  const compliancePts = (() => {
    // Each consent revocation costs 3 pts (less than a complaint, more than
    // a neutral signal); a buyer may legitimately revoke for non-broker
    // reasons, so we don't treat it as severely as a complaint.
    const demerits = complaints.length * 5 + compliance.length * 8 + consentRevocations.length * 3;
    return Math.max(0, 15 - demerits);
  })();

  const composite =
    responseSpeedPts +
    shortlistQualityPts +
    buyerSatisfactionPts +
    offerToClosePts +
    compliancePts;

  return {
    response_speed_pts: Math.max(0, Math.min(25, responseSpeedPts)),
    shortlist_quality_pts: Math.max(0, Math.min(20, shortlistQualityPts)),
    buyer_satisfaction_pts: Math.max(0, Math.min(20, buyerSatisfactionPts)),
    offer_to_close_pts: Math.max(0, Math.min(20, offerToClosePts)),
    compliance_pts: Math.max(0, Math.min(15, compliancePts)),
    composite_score: Math.max(0, Math.min(100, composite)),
    inputs_json: {
      intros_sent: intros.length,
      first_responses: firstResponses.length,
      median_response_latency_seconds: medianLatency,
      response_sla_seconds: slaSeconds,
      shortlists_provided: shortlistsProvided.length,
      shortlists_accepted: shortlistsAccepted.length,
      offers_submitted: offerSubmitted.length,
      closings_completed: closings.length,
      buyer_complaints: complaints.length,
      compliance_incidents: compliance.length,
      consent_revocations: consentRevocations.length,
      total_events: events.length,
    },
  };
}

async function recomputeBrokerScorecards(supabase, { brokerPartnerId } = {}) {
  let partnersQuery = supabase
    .from("broker_partners")
    .select("id, response_sla_minutes, status")
    .neq("status", "removed");
  if (brokerPartnerId) partnersQuery = partnersQuery.eq("id", brokerPartnerId);
  const { data: partners, error: partnersError } = await partnersQuery;
  if (partnersError) throw partnersError;

  const results = [];
  for (const partner of partners || []) {
    const { data: events, error: eventsError } = await supabase
      .from("broker_events")
      .select("event_type, response_latency_seconds, outcome, occurred_at")
      .eq("broker_partner_id", partner.id)
      .order("occurred_at", { ascending: true });
    if (eventsError) throw eventsError;
    const pillars = computeScorecardFromEvents(events || [], {
      responseSlaMinutes: partner.response_sla_minutes,
    });
    const upsertPayload = {
      broker_partner_id: partner.id,
      ...pillars,
      computed_at: new Date().toISOString(),
    };
    const { error: upsertError } = await supabase
      .from("broker_scorecards")
      .upsert(upsertPayload, { onConflict: "broker_partner_id" });
    if (upsertError) throw upsertError;
    results.push({ broker_partner_id: partner.id, composite_score: pillars.composite_score });
  }
  return { recomputed: results.length, results };
}

async function expireVerifications(supabase) {
  const now = new Date().toISOString();
  const expired = { profiles: 0, packets: 0, grants: 0 };

  const { data: profiles, error: profilesError } = await supabase
    .from("buyer_readiness_profiles")
    .update({ verification_confidence: "expired", evidence_status: "expired" })
    .lt("verification_expires_at", now)
    .neq("verification_confidence", "expired")
    .select("id");
  if (profilesError) throw profilesError;
  expired.profiles = profiles?.length || 0;

  const { data: packets, error: packetsError } = await supabase
    .from("buyer_packets")
    .update({ status: "expired" })
    .lt("expires_at", now)
    .eq("status", "active")
    .select("id");
  if (packetsError) throw packetsError;
  expired.packets = packets?.length || 0;

  const { data: grants, error: grantsError } = await supabase
    .from("document_sharing_grants")
    .update({ revoked_at: now, revoked_reason: "expired" })
    .lt("expires_at", now)
    .is("revoked_at", null)
    .select("id");
  if (grantsError) throw grantsError;
  expired.grants = grants?.length || 0;

  return { expired };
}

async function maybeSingleRow(query, label = "row") {
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to load ${label}: ${error.message}`);
  return data || null;
}

async function loadMihadAgentWorkspaceContext(supabase, { workspaceId, userId, selectedOpportunityId = null }) {
  const workspace = await maybeSingleRow(
    supabase
      .from("workspaces")
      .select("id, name, workspace_kind, owner_id, org_id, analysis_brief, description")
      .eq("id", workspaceId),
    "workspace",
  );
  if (!workspace) {
    const error = new Error("workspace_not_found");
    error.statusCode = 404;
    throw error;
  }
  if (workspace.workspace_kind !== "mihad_buyer_desk") {
    const error = new Error("mihad_buyer_desk_required");
    error.statusCode = 409;
    throw error;
  }

  const [
    mandates,
    searchRuns,
    candidates,
    opportunities,
    readinessProfiles,
    buyerPackets,
    sharingGrants,
  ] = await Promise.all([
    selectRows(supabase.from("acquisition_mandates").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(3), "acquisition_mandates"),
    selectRows(supabase.from("acquisition_search_runs").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(5), "acquisition_search_runs"),
    selectRows(supabase.from("acquisition_candidate_opportunities").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(10), "acquisition_candidate_opportunities"),
    selectRows(supabase.from("acquisition_opportunities").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(10), "acquisition_opportunities"),
    selectRows(supabase.from("buyer_readiness_profiles").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(3), "buyer_readiness_profiles"),
    selectRows(supabase.from("buyer_packets").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(5), "buyer_packets"),
    selectRows(supabase.from("document_sharing_grants").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(10), "document_sharing_grants"),
  ]);

  const mandate = mandates[0] || null;
  const readinessProfile = readinessProfiles[0] || null;
  const activePacket = (buyerPackets || []).find((packet) => packet.status === "active") || null;
  return {
    supabase,
    workspace_id: workspaceId,
    user_id: userId,
    selected_opportunity_id: selectedOpportunityId,
    workspace,
    mandate,
    search_runs: searchRuns,
    candidates,
    opportunities,
    readiness_profile: readinessProfile,
    buyer_packets: buyerPackets,
    active_packet: activePacket,
    sharing_grants: sharingGrants,
    default_sources: ["aqar", "bayut", "property_finder"],
  };
}

async function upsertMihadAgentConversation(supabase, { workspaceId, userId, mandateId }) {
  const externalThreadId = `mihad_buyer_desk:${workspaceId}:${userId}`;
  const existing = await maybeSingleRow(
    supabase
      .from("agent_conversations")
      .select("*")
      .eq("channel", "web")
      .eq("external_thread_id", externalThreadId),
    "agent_conversations",
  );
  const payload = {
    channel: "web",
    external_thread_id: externalThreadId,
    workspace_id: workspaceId,
    mandate_id: mandateId || null,
    linked_profile_id: userId,
    mode: "workspace_coordination",
    last_message_at: new Date().toISOString(),
  };
  if (existing?.id) {
    const { data, error } = await supabase
      .from("agent_conversations")
      .update({
        ...payload,
        state_json: {
          ...(existing.state_json || {}),
          agent_surface: "mihad_buyer_desk",
        },
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) throw new Error(`Failed to update Mihad agent conversation: ${error?.message || "unknown"}`);
    return data;
  }
  const { data, error } = await supabase
    .from("agent_conversations")
    .insert({
      ...payload,
      state_json: { agent_surface: "mihad_buyer_desk" },
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create Mihad agent conversation: ${error?.message || "unknown"}`);
  return data;
}

async function insertAgentEvent(supabase, payload) {
  const { data, error } = await supabase
    .from("agent_events")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to insert agent event: ${error?.message || "unknown"}`);
  return data;
}

async function runMihadBrokerAgentTurn({ supabase, req, requestId, workspaceId, userId, body = {} }) {
  await assertWorkspaceWriteAccess(supabase, workspaceId, userId);
  const message = normalizeText(body.message || body.text);
  if (!message) {
    const error = new Error("message is required");
    error.statusCode = 400;
    throw error;
  }
  if (message.length > 3000) {
    const error = new Error("message is too long");
    error.statusCode = 413;
    throw error;
  }

  const context = await loadMihadAgentWorkspaceContext(supabase, {
    workspaceId,
    userId,
    selectedOpportunityId: normalizeUuid(body.selected_opportunity_id),
  });
  context.message = message;
  const conversation = await upsertMihadAgentConversation(supabase, {
    workspaceId,
    userId,
    mandateId: context.mandate?.id || null,
  });
  const inboundEvent = await insertAgentEvent(supabase, {
    conversation_id: conversation.id,
    workspace_id: workspaceId,
    opportunity_id: normalizeUuid(body.selected_opportunity_id),
    channel: "web",
    direction: "inbound",
    event_type: "mihad_buyer_message",
    safe_payload_json: {
      text_excerpt: message.slice(0, 500),
      selected_opportunity_id: normalizeUuid(body.selected_opportunity_id),
    },
  });

  const plan = await planMihadBrokerAgentTurn({
    message,
    context: {
      workspace_id: workspaceId,
      workspace_kind: context.workspace.workspace_kind,
      selected_opportunity_id: context.selected_opportunity_id,
      mandate: context.mandate,
      search_runs: context.search_runs,
      candidates: context.candidates,
      opportunities: context.opportunities,
      readiness_profile: context.readiness_profile,
      buyer_packets: context.buyer_packets,
      active_packet: context.active_packet,
      sharing_grants: context.sharing_grants,
      default_sources: context.default_sources,
    },
    requestId,
  });

  const deps = {
    clarifyMandate,
    createWorkspaceSearchRun,
    promoteCandidate,
    createReadinessProfile,
    createBuyerPacket,
    listBrokerPartners,
    grantBuyerPacketToBroker,
    createExternalActionApproval,
    insertAcquisitionEvent: insertEvent,
  };
  const toolResults = [];
  for (const call of plan.tool_calls || []) {
    try {
      const result = await executeMihadToolCall({
        call,
        deps,
        context,
        req,
        requestId,
      });
      toolResults.push(result);
    } catch (error) {
      toolResults.push({
        tool: call.tool,
        status: "failed",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await insertAgentEvent(supabase, {
    conversation_id: conversation.id,
    workspace_id: workspaceId,
    opportunity_id: normalizeUuid(body.selected_opportunity_id),
    channel: "web",
    direction: "outbound",
    event_type: "mihad_agent_turn",
    safe_payload_json: {
      in_reply_to_event_id: inboundEvent.id,
      assistant_message: normalizeText(plan.assistant_message).slice(0, 1200),
      reasoning_summary: normalizeText(plan.reasoning_summary).slice(0, 1200),
      planner: plan.planner || null,
      model: plan.model || null,
      tool_results: toolResults.map((result) => ({
        tool: result.tool,
        status: result.status,
        reason: result.reason || null,
      })),
    },
  });

  const nextContext = await loadMihadAgentWorkspaceContext(supabase, {
    workspaceId,
    userId,
    selectedOpportunityId: normalizeUuid(body.selected_opportunity_id),
  });
  return {
    conversation_id: conversation.id,
    assistant_message: plan.assistant_message,
    reasoning_summary: plan.reasoning_summary,
    planner: plan.planner,
    model: plan.model || null,
    next_state: plan.next_state,
    tools: mihadToolDefinitions(),
    tool_calls: plan.tool_calls || [],
    tool_results: toolResults,
    context: {
      mandate: nextContext.mandate,
      search_runs: nextContext.search_runs,
      candidates: nextContext.candidates,
      opportunities: nextContext.opportunities,
      readiness_profile: nextContext.readiness_profile,
      buyer_packets: nextContext.buyer_packets,
      active_packet: nextContext.active_packet,
      sharing_grants: nextContext.sharing_grants,
    },
  };
}

function matchRoute(method, pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "acquisition" || parts[2] !== "v1") return null;
  if (method === "POST" && parts[3] === "mandates" && parts.length === 4) return { name: "createMandate" };
  if (method === "POST" && parts[3] === "mandates" && parts[5] === "search-runs") return { name: "createSearchRun", mandateId: parts[4] };
  if (method === "POST" && parts[3] === "workspaces" && parts[5] === "search-runs" && parts.length === 6) return { name: "createWorkspaceSearchRun", workspaceId: parts[4] };
  if (method === "POST" && parts[3] === "workspaces" && parts[5] === "mihad-agent" && parts[6] === "turn" && parts.length === 7) return { name: "mihadAgentTurn", workspaceId: parts[4] };
  if (method === "GET" && parts[3] === "search-runs" && parts.length === 5) return { name: "getSearchRun", searchRunId: parts[4] };
  if (method === "GET" && parts[3] === "search-runs" && parts[5] === "candidates") return { name: "listSearchCandidates", searchRunId: parts[4] };
  if (method === "POST" && parts[3] === "intake" && parts[4] === "listing") return { name: "intakeListing" };
  if (method === "POST" && parts[3] === "workspaces" && parts[5] === "acquisition-reports" && parts.length === 6) return { name: "createAcquisitionReport", workspaceId: parts[4] };
  if (method === "POST" && parts[3] === "workspaces" && parts[5] === "deal-desk" && parts.length === 6) return { name: "createDealDeskReport", workspaceId: parts[4] };
  if (method === "POST" && parts[3] === "acquisition-reports" && parts[5] === "notes" && parts.length === 6) return { name: "addDealDeskReportNote", reportId: parts[4] };
  if (method === "POST" && parts[3] === "deal-desk" && parts[5] === "notes" && parts.length === 6) return { name: "addDealDeskReportNote", reportId: parts[4] };
  if (method === "POST" && parts[3] === "candidates" && parts[5] === "screen") return { name: "screenCandidate", candidateId: parts[4] };
  if (method === "POST" && parts[3] === "candidates" && parts[5] === "promote") return { name: "promoteCandidate", candidateId: parts[4] };
  if (method === "GET" && parts[3] === "opportunities" && parts.length === 5) return { name: "getOpportunity", opportunityId: parts[4] };
  if (method === "GET" && parts[3] === "opportunities" && parts[5] === "actions" && parts.length === 6) return { name: "listOpportunityActions", opportunityId: parts[4] };
  if (method === "POST" && parts[3] === "opportunities" && parts[5] === "capex-estimate" && parts.length === 6) return { name: "generateCapexEstimate", opportunityId: parts[4] };
  if (method === "POST" && parts[3] === "opportunities" && parts[5] === "underwriting-run" && parts.length === 6) return { name: "runUnderwriting", opportunityId: parts[4] };
  if (method === "POST" && parts[3] === "opportunities" && parts[5] === "actions" && parts[7] === "prepare") return { name: "prepareOpportunityAction", opportunityId: parts[4], actionId: parts[6] };
  if (method === "POST" && parts[3] === "opportunities" && parts[5] === "actions" && parts[7] === "execute") return { name: "executeOpportunityAction", opportunityId: parts[4], actionId: parts[6] };
  if (method === "POST" && parts[3] === "opportunities" && parts[5] === "enrich") return { name: "enrichOpportunity", opportunityId: parts[4] };
  if (method === "POST" && parts[3] === "opportunities" && parts[5] === "notes") return { name: "addOpportunityNote", opportunityId: parts[4] };
  if (method === "POST" && parts[3] === "opportunities" && parts[5] === "stage") return { name: "updateOpportunityStage", opportunityId: parts[4] };
  if (method === "POST" && parts[3] === "readiness-profiles" && parts.length === 4) return { name: "createReadinessProfile" };
  if (method === "GET" && parts[3] === "readiness-profiles" && parts.length === 5) return { name: "getReadinessProfile", profileId: parts[4] };
  if (method === "PATCH" && parts[3] === "readiness-profiles" && parts.length === 5) return { name: "updateReadinessProfile", profileId: parts[4] };
  if (method === "POST" && parts[3] === "readiness-profiles" && parts[5] === "evidence") return { name: "attachReadinessEvidence", profileId: parts[4] };
  if (method === "POST" && parts[3] === "readiness-evidence" && parts[5] === "verify") return { name: "verifyReadinessEvidence", evidenceId: parts[4] };
  if (method === "POST" && parts[3] === "document-sharing-grants" && parts.length === 4) return { name: "createDocumentSharingGrant" };
  if (method === "POST" && parts[3] === "brokerage-agreements" && parts.length === 4) return { name: "createBrokerageAgreement" };
  if (method === "POST" && parts[3] === "kyc-cases" && parts.length === 4) return { name: "createKycCase" };
  if (method === "POST" && parts[3] === "kyc-cases" && parts[5] === "risk-flags") return { name: "createKycRiskFlag", kycCaseId: parts[4] };
  if (method === "POST" && parts[3] === "approvals" && parts.length === 4) return { name: "createExternalActionApproval" };
  if (method === "POST" && parts[3] === "approvals" && parts[5] === "approve") return { name: "approveExternalAction", approvalId: parts[4] };
  if (method === "POST" && parts[3] === "approvals" && parts[5] === "execute") return { name: "executeExternalAction", approvalId: parts[4] };
  if (method === "POST" && parts[3] === "discover" && parts.length === 4) return { name: "createDiscoverIntake" };
  if (method === "POST" && parts[3] === "mandates" && parts[5] === "clarify" && parts.length === 6) return { name: "clarifyMandate", mandateId: parts[4] };
  if (method === "POST" && parts[3] === "buyer-packets" && parts.length === 4) return { name: "createBuyerPacket" };
  if (method === "POST" && parts[3] === "buyer-packets" && parts[5] === "grant" && parts.length === 6) return { name: "grantBuyerPacketToBroker", packetId: parts[4] };
  if (method === "POST" && parts[3] === "sharing-grants" && parts[5] === "revoke" && parts.length === 6) return { name: "revokeBuyerPacketGrant", grantId: parts[4] };
  if (method === "GET" && parts[3] === "broker-partners" && parts.length === 4) return { name: "listBrokerPartners" };
  if (method === "POST" && parts[3] === "broker-partners" && parts.length === 4) return { name: "createBrokerPartner" };
  if (method === "POST" && parts[3] === "broker-partners" && parts[5] === "events" && parts.length === 6) return { name: "logBrokerEvent", brokerPartnerId: parts[4] };
  if (method === "GET" && parts[3] === "broker-partners" && parts[5] === "scorecard" && parts.length === 6) return { name: "getBrokerScorecard", brokerPartnerId: parts[4] };
  return null;
}

export function isAcquisitionApiRoute(method, pathname) {
  return Boolean(matchRoute(method, pathname));
}

export async function handleAcquisitionApi(req, res, { requestId, log, readJsonBody, supabase = createServiceClient() }) {
  const route = matchRoute(req.method, new URL(req.url || "/", "http://localhost").pathname);
  if (!route) return false;
  try {
    if (route.name === "generateCapexEstimate" || route.name === "runUnderwriting") {
      const body = await readJsonBody(req);
      const allowInternal = isInternalCaller(req.headers);
      let userId = null;
      if (!allowInternal) {
        const token = bearerToken(req.headers);
        if (!token) {
          const error = new Error("not_authenticated");
          error.statusCode = 401;
          throw error;
        }
        const verified = await verifySupabaseJwt(token);
        userId = verified.payload?.sub || null;
        if (!userId) {
          const error = new Error("invalid_user_token");
          error.statusCode = 401;
          throw error;
        }
      }
      const result = route.name === "generateCapexEstimate"
        ? await runRenovationCapexAgent({
          supabase,
          opportunityId: route.opportunityId,
          input: body,
          requestId,
          userId,
          allowInternal,
        })
        : await runAndPersistUnderwriting({
          supabase,
          opportunityId: route.opportunityId,
          input: body,
          userId,
          allowInternal,
        });
      return sendJson(res, 200, buildEnvelope(requestId, result));
    }
    if (["intakeListing", "promoteCandidate", "updateOpportunityStage"].includes(route.name)) {
      const body = await readJsonBody(req);
      const allowInternal = isInternalCaller(req.headers);
      body.allow_admin_override = allowInternal;
      let userId = null;
      if (!allowInternal) {
        const token = bearerToken(req.headers);
        if (!token) {
          const error = new Error("not_authenticated");
          error.statusCode = 401;
          throw error;
        }
        const verified = await verifySupabaseJwt(token);
        if (!verified.payload?.sub) {
          const error = new Error("invalid_user_token");
          error.statusCode = 401;
          throw error;
        }
        userId = normalizeUuid(verified.payload.sub);
        body.user_id ||= userId;
        if (route.name === "intakeListing") {
          await assertWorkspaceWriteAccess(supabase, normalizeUuid(body.workspace_id), userId);
        } else if (route.name === "promoteCandidate") {
          const candidate = await fetchCandidate(supabase, route.candidateId);
          await assertWorkspaceWriteAccess(supabase, candidate.workspace_id, userId);
        } else if (route.name === "updateOpportunityStage") {
          const { data: opportunity, error: opportunityError } = await supabase
            .from("acquisition_opportunities")
            .select("id, workspace_id")
            .eq("id", route.opportunityId)
            .maybeSingle();
          if (opportunityError) throw opportunityError;
          await assertWorkspaceWriteAccess(supabase, opportunity?.workspace_id, userId);
        }
      }
      if (route.name === "intakeListing") {
        const result = await createListingCandidate(supabase, body);
        return sendJson(res, 201, buildEnvelope(requestId, result));
      }
      if (route.name === "promoteCandidate") {
        const result = await promoteCandidate(supabase, route.candidateId);
        return sendJson(res, 201, buildEnvelope(requestId, result));
      }
      return sendJson(res, 200, buildEnvelope(requestId, { opportunity: await updateOpportunityStage(supabase, route.opportunityId, body) }));
    }
    if (route.name === "addDealDeskReportNote") {
      const body = await readJsonBody(req);
      const result = await addDealDeskReportNote(supabase, route.reportId, body);
      return sendJson(res, 201, buildEnvelope(requestId, result));
    }
    if (route.name === "createAcquisitionReport") {
      const body = await readJsonBody(req);
      const allowInternal = isInternalCaller(req.headers);
      let userId = normalizeUuid(body.user_id);
      if (!allowInternal) {
        const token = bearerToken(req.headers);
        if (!token) {
          const error = new Error("not_authenticated");
          error.statusCode = 401;
          throw error;
        }
        const verified = await verifySupabaseJwt(token);
        if (!verified.payload?.sub) {
          const error = new Error("invalid_user_token");
          error.statusCode = 401;
          throw error;
        }
        userId = normalizeUuid(verified.payload.sub);
        await assertWorkspaceWriteAccess(supabase, normalizeUuid(route.workspaceId), userId);
      }
      body.user_id ||= userId;
      const result = await createAcquisitionReport(supabase, route.workspaceId, body, { requestId, allowManualOverride: allowInternal });
      const statusCode = result.publication?.attempted ? 201 : 202;
      return sendJson(res, statusCode, buildEnvelope(requestId, result));
    }
    if (route.name === "createWorkspaceSearchRun") {
      const body = await readJsonBody(req);
      const allowInternal = isInternalCaller(req.headers);
      let userId = normalizeUuid(body.user_id);
      if (!allowInternal) {
        const token = bearerToken(req.headers);
        if (!token) {
          const error = new Error("not_authenticated");
          error.statusCode = 401;
          throw error;
        }
        const verified = await verifySupabaseJwt(token);
        if (!verified.payload?.sub) {
          const error = new Error("invalid_user_token");
          error.statusCode = 401;
          throw error;
        }
        userId = normalizeUuid(verified.payload.sub);
      }
      const result = await createWorkspaceSearchRun({
        supabase,
        req,
        requestId,
        workspaceId: normalizeUuid(route.workspaceId),
        userId,
        body,
      });
      return sendJson(res, 202, buildEnvelope(requestId, result));
    }
    if (route.name === "mihadAgentTurn") {
      const body = await readJsonBody(req);
      const allowInternal = isInternalCaller(req.headers);
      let userId = normalizeUuid(body.user_id);
      if (!allowInternal) {
        const token = bearerToken(req.headers);
        if (!token) {
          const error = new Error("not_authenticated");
          error.statusCode = 401;
          throw error;
        }
        const verified = await verifySupabaseJwt(token);
        if (!verified.payload?.sub) {
          const error = new Error("invalid_user_token");
          error.statusCode = 401;
          throw error;
        }
        userId = normalizeUuid(verified.payload.sub);
      }
      const result = await runMihadBrokerAgentTurn({
        supabase,
        req,
        requestId,
        workspaceId: normalizeUuid(route.workspaceId),
        userId,
        body,
      });
      return sendJson(res, 200, buildEnvelope(requestId, result));
    }
    if ([
      "createDiscoverIntake",
      "clarifyMandate",
      "createBuyerPacket",
      "grantBuyerPacketToBroker",
      "revokeBuyerPacketGrant",
      "listBrokerPartners",
      "getBrokerScorecard",
    ].includes(route.name)) {
      const allowInternal = isInternalCaller(req.headers);
      const body = req.method === "GET" ? {} : await readJsonBody(req);
      let userId = normalizeUuid(body.user_id);
      if (!allowInternal) {
        const token = bearerToken(req.headers);
        if (!token) {
          const error = new Error("not_authenticated");
          error.statusCode = 401;
          throw error;
        }
        const verified = await verifySupabaseJwt(token);
        if (!verified.payload?.sub) {
          const error = new Error("invalid_user_token");
          error.statusCode = 401;
          throw error;
        }
        userId = normalizeUuid(verified.payload.sub);
        body.user_id ||= userId;
      }

      if (route.name === "createDiscoverIntake") {
        const result = await createDiscoverIntake(supabase, body);
        return sendJson(res, 201, buildEnvelope(requestId, result));
      }
      if (route.name === "clarifyMandate") {
        const mandate = await fetchMandate(supabase, route.mandateId);
        if (!mandate) {
          const error = new Error("mandate_not_found");
          error.statusCode = 404;
          throw error;
        }
        if (!allowInternal && mandate.user_id && mandate.user_id !== userId) {
          const error = new Error("mandate_not_accessible");
          error.statusCode = 403;
          throw error;
        }
        const result = await clarifyMandate(supabase, route.mandateId, body);
        return sendJson(res, 200, buildEnvelope(requestId, result));
      }
      if (route.name === "createBuyerPacket") {
        if (!allowInternal) {
          const profile = await fetchReadinessProfile(supabase, normalizeUuid(body.buyer_profile_id));
          await assertWorkspaceWriteAccess(supabase, profile?.workspace_id, userId);
        }
        const result = await createBuyerPacket(supabase, body);
        return sendJson(res, 201, buildEnvelope(requestId, result));
      }
      if (route.name === "grantBuyerPacketToBroker") {
        if (!allowInternal) {
          const { data: packet, error: packetError } = await supabase
            .from("buyer_packets")
            .select("workspace_id")
            .eq("id", route.packetId)
            .maybeSingle();
          if (packetError) throw packetError;
          await assertWorkspaceWriteAccess(supabase, packet?.workspace_id, userId);
        }
        const result = await grantBuyerPacketToBroker(supabase, route.packetId, body);
        return sendJson(res, 201, buildEnvelope(requestId, result));
      }
      if (route.name === "revokeBuyerPacketGrant") {
        if (!allowInternal) {
          const { data: grant, error: grantError } = await supabase
            .from("document_sharing_grants")
            .select("workspace_id")
            .eq("id", route.grantId)
            .maybeSingle();
          if (grantError) throw grantError;
          await assertWorkspaceWriteAccess(supabase, grant?.workspace_id, userId);
        }
        const result = await revokeBuyerPacketGrant(supabase, route.grantId, body);
        return sendJson(res, 200, buildEnvelope(requestId, result));
      }
      if (route.name === "listBrokerPartners") {
        const url = new URL(req.url || "/", "http://localhost");
        const query = {
          country_code: url.searchParams.get("country_code"),
          status: url.searchParams.get("status") || "active",
        };
        const result = await listBrokerPartners(supabase, query);
        return sendJson(res, 200, buildEnvelope(requestId, result));
      }
      if (route.name === "getBrokerScorecard") {
        const result = await getBrokerScorecard(supabase, route.brokerPartnerId);
        return sendJson(res, 200, buildEnvelope(requestId, result));
      }
    }
    requireInternalCaller(req.headers);
    const body = req.method === "GET" ? {} : await readJsonBody(req);
    if (route.name === "createMandate") {
      const mandate = await createMandate(supabase, body);
      return sendJson(res, 201, buildEnvelope(requestId, { mandate }));
    }
    if (route.name === "createSearchRun") {
      const searchRun = await createSearchRun(supabase, route.mandateId, body);
      const queue = await scheduleSearchRunTask({ req, requestId, searchRunId: searchRun.id });
      return sendJson(res, 202, buildEnvelope(requestId, { search_run: searchRun, queue }));
    }
    if (route.name === "getSearchRun") {
      const { data, error } = await supabase.from("acquisition_search_runs").select("*").eq("id", route.searchRunId).single();
      if (error) throw error;
      return sendJson(res, 200, buildEnvelope(requestId, { search_run: data }));
    }
    if (route.name === "listSearchCandidates") {
      const { data, error } = await supabase.from("acquisition_candidate_opportunities").select("*").eq("search_run_id", route.searchRunId).order("updated_at", { ascending: false });
      if (error) throw error;
      const candidates = [...(data || [])].sort((left, right) =>
        Number(right.screening_output_json?.fit?.score || 0) - Number(left.screening_output_json?.fit?.score || 0)
      );
      return sendJson(res, 200, buildEnvelope(requestId, { candidates }));
    }
    if (route.name === "intakeListing") {
      const result = await createListingCandidate(supabase, body);
      return sendJson(res, 201, buildEnvelope(requestId, result));
    }
    if (route.name === "createDealDeskReport") {
      const result = await createDealDeskReport(supabase, route.workspaceId, body, { requestId });
      const statusCode = result.publication?.attempted ? 201 : 202;
      return sendJson(res, statusCode, buildEnvelope(requestId, result));
    }
    if (route.name === "screenCandidate") {
      const result = await screenCandidate(supabase, route.candidateId, { requestId });
      return sendJson(res, 200, buildEnvelope(requestId, result));
    }
    if (route.name === "promoteCandidate") {
      const result = await promoteCandidate(supabase, route.candidateId);
      return sendJson(res, 201, buildEnvelope(requestId, result));
    }
    if (route.name === "getOpportunity") {
      const { data, error } = await supabase.from("acquisition_opportunities").select("*, acquisition_claims(*), acquisition_diligence_items(*), acquisition_events(*), acquisition_threads(*)").eq("id", route.opportunityId).single();
      if (error) throw error;
      return sendJson(res, 200, buildEnvelope(requestId, { opportunity: data }));
    }
    if (route.name === "listOpportunityActions") {
      return sendJson(res, 200, buildEnvelope(requestId, await listOpportunityActions(supabase, route.opportunityId)));
    }
    if (route.name === "prepareOpportunityAction") {
      return sendJson(res, 200, buildEnvelope(requestId, await prepareOpportunityAction(supabase, route.opportunityId, route.actionId, body)));
    }
    if (route.name === "executeOpportunityAction") {
      return sendJson(res, 200, buildEnvelope(requestId, await executeOpportunityAction(supabase, route.opportunityId, route.actionId, body)));
    }
    if (route.name === "enrichOpportunity") {
      return sendJson(res, 200, buildEnvelope(requestId, await enrichOpportunity(supabase, route.opportunityId, body)));
    }
    if (route.name === "addOpportunityNote") {
      return sendJson(res, 201, buildEnvelope(requestId, await addOpportunityNote(supabase, route.opportunityId, body)));
    }
    if (route.name === "updateOpportunityStage") {
      return sendJson(res, 200, buildEnvelope(requestId, { opportunity: await updateOpportunityStage(supabase, route.opportunityId, body) }));
    }
    if (route.name === "createReadinessProfile") {
      return sendJson(res, 201, buildEnvelope(requestId, { profile: await createReadinessProfile(supabase, body) }));
    }
    if (route.name === "getReadinessProfile") {
      const context = await loadReadinessContext(supabase, route.profileId);
      return sendJson(res, 200, buildEnvelope(requestId, context));
    }
    if (route.name === "updateReadinessProfile") {
      return sendJson(res, 200, buildEnvelope(requestId, { profile: await updateReadinessProfile(supabase, route.profileId, body) }));
    }
    if (route.name === "attachReadinessEvidence") {
      return sendJson(res, 201, buildEnvelope(requestId, { evidence: await attachReadinessEvidence(supabase, route.profileId, body) }));
    }
    if (route.name === "verifyReadinessEvidence") {
      return sendJson(res, 200, buildEnvelope(requestId, await verifyReadinessEvidence(supabase, route.evidenceId, body)));
    }
    if (route.name === "createDocumentSharingGrant") {
      return sendJson(res, 201, buildEnvelope(requestId, { grant: await createDocumentSharingGrant(supabase, body) }));
    }
    if (route.name === "createBrokerageAgreement") {
      return sendJson(res, 201, buildEnvelope(requestId, await createBrokerageAgreement(supabase, body)));
    }
    if (route.name === "createKycCase") {
      return sendJson(res, 201, buildEnvelope(requestId, await createKycCase(supabase, body)));
    }
    if (route.name === "createKycRiskFlag") {
      return sendJson(res, 201, buildEnvelope(requestId, await createKycRiskFlag(supabase, route.kycCaseId, body)));
    }
    if (route.name === "createExternalActionApproval") {
      return sendJson(res, 201, buildEnvelope(requestId, { approval: await createExternalActionApproval(supabase, body) }));
    }
    if (route.name === "approveExternalAction") {
      return sendJson(res, 200, buildEnvelope(requestId, { approval: await approveExternalAction(supabase, route.approvalId, body) }));
    }
    if (route.name === "executeExternalAction") {
      return sendJson(res, 200, buildEnvelope(requestId, { approval: await executeExternalAction(supabase, route.approvalId, body) }));
    }
    if (route.name === "createBrokerPartner") {
      const result = await createBrokerPartner(supabase, body);
      return sendJson(res, 201, buildEnvelope(requestId, result));
    }
    if (route.name === "logBrokerEvent") {
      const result = await logBrokerEvent(supabase, route.brokerPartnerId, body);
      return sendJson(res, 201, buildEnvelope(requestId, result));
    }
  } catch (error) {
    log?.error?.("Acquisition API error", { error: error instanceof Error ? error.message : String(error) });
    return sendJson(res, error.statusCode || 500, buildEnvelope(requestId, { error: error.message || "Acquisition API error" }));
  }
  return false;
}

export async function handleAcquisitionInternal(req, res, { requestId, log, readJsonBody, supabase = createServiceClient() }) {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  if (!pathname.startsWith("/internal/acquisition/")) return false;
  try {
    requireInternalCaller(req.headers);
    const body = await readJsonBody(req);
    if (pathname === "/internal/acquisition/search-run") {
      const result = await processSearchRun({ supabase, requestId, searchRunId: normalizeUuid(body.search_run_id) });
      return sendJson(res, 200, buildEnvelope(requestId, result));
    }
    if (pathname === "/internal/acquisition/reports/weekly") {
      const result = await runWeeklyAcquisitionReports({ supabase, req, requestId, body });
      return sendJson(res, 200, buildEnvelope(requestId, result));
    }
    if (pathname === "/internal/acquisition/report-task") {
      const result = await createAcquisitionReport(supabase, normalizeUuid(body.workspace_id), {
        ...body,
        mandate_id: normalizeUuid(body.mandate_id),
        schedule_kind: normalizeText(body.schedule_kind) || "weekly",
        report_period: reportPeriodFromBody(body),
        delivery_hint: normalizeText(body.delivery_hint) || "weekly",
      }, { requestId, idempotent: true, allowManualOverride: true });
      return sendJson(res, 200, buildEnvelope(requestId, result));
    }
    if (pathname === "/internal/acquisition/screen-candidate") {
      return sendJson(res, 200, buildEnvelope(requestId, await screenCandidate(supabase, normalizeUuid(body.candidate_id), { requestId })));
    }
    if (pathname === "/internal/acquisition/enrich-opportunity") {
      return sendJson(res, 200, buildEnvelope(requestId, await enrichOpportunity(supabase, normalizeUuid(body.opportunity_id), body)));
    }
    if (pathname === "/internal/acquisition/recompute-broker-scorecards") {
      const result = await recomputeBrokerScorecards(supabase, {
        brokerPartnerId: normalizeUuid(body.broker_partner_id),
      });
      return sendJson(res, 200, buildEnvelope(requestId, result));
    }
    if (pathname === "/internal/acquisition/expire-verifications") {
      const result = await expireVerifications(supabase);
      return sendJson(res, 200, buildEnvelope(requestId, result));
    }
    return sendJson(res, 404, buildEnvelope(requestId, { error: "Not found" }));
  } catch (error) {
    log?.error?.("Internal acquisition error", { error: error instanceof Error ? error.message : String(error) });
    return sendJson(res, error.statusCode || 500, buildEnvelope(requestId, { error: error.message || "Internal acquisition error" }));
  }
}

export const __test = {
  buildScreeningOutput,
  buildSourceFingerprint,
  approveExternalAction,
  attachReadinessEvidence,
  createBrokerageAgreement,
  createDocumentSharingGrant,
  createExternalActionApproval,
  buildMandateFit,
  buildDealDeskPayload,
  buildAcquisitionReportPayload: buildDealDeskPayload,
  createListingCandidate,
  createAcquisitionReport,
  createDealDeskReport,
  createKycCase,
  createKycRiskFlag,
  createMandate,
  createReadinessProfile,
  createSearchRun,
  createWorkspaceSearchRun,
  deriveReadinessState,
  executeExternalAction,
  normalizeSearchLimits,
  normalizeSources,
  normalizeReportPresentation,
  promoteCandidate,
  buildCrossListingSignature,
  tryAttachAsCrossListing,
  recomputeReadinessProfile,
  resolvePrimaryAcquisitionAction,
  screenCandidate,
  runWeeklyAcquisitionReports,
  runMihadBrokerAgentTurn,
  updateOpportunityStage,
  upsertCandidateDraft,
  updateReadinessProfile,
  verifyReadinessEvidence,
  grantBuyerPacketToBroker,
  revokeBuyerPacketGrant,
  computeScorecardFromEvents,
};
