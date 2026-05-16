import { createHash, randomUUID } from "node:crypto";
import { getExpectedInternalToken } from "../runtime/internal-auth.js";

const PREVIEW_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PREVIEW_CACHE = new Map();

function normalizeText(value) {
  return String(value || "").trim();
}

function firstValue(value, fallback = "") {
  return Array.isArray(value) && value.length ? normalizeText(value[0]) : fallback;
}

function cacheKeyForIntent(intent = {}) {
  const key = JSON.stringify({
    countries: intent.target_country_codes || [],
    city: intent.city || [],
    districts: intent.districts || [],
    type: intent.property_type || null,
    budget_max: intent.budget_max || null,
    monthly_payment_max: intent.monthly_payment_max || null,
    currency: intent.currency || null,
  });
  return createHash("sha256").update(key).digest("hex");
}

function sourceForIntent(intent = {}) {
  const country = firstValue(intent.target_country_codes, "SA").toUpperCase();
  if (country === "AE") return "property_finder";
  if (country === "SA") return "aqar";
  return null;
}

function budgetRangeForIntent(intent = {}) {
  const max = Number(intent.budget_max || 0);
  if (Number.isFinite(max) && max > 0) {
    return { min: intent.budget_min || null, max, currency: intent.currency || "SAR" };
  }
  return { min: null, max: null, currency: intent.currency || "SAR" };
}

function mandateForIntent(intent = {}) {
  const country = firstValue(intent.target_country_codes, "SA").toUpperCase();
  const city = firstValue(intent.city, country === "AE" ? "Dubai" : country === "TR" ? "Istanbul" : "Riyadh");
  const districts = Array.isArray(intent.districts) ? intent.districts.map(normalizeText).filter(Boolean) : [];
  return {
    id: null,
    workspace_id: null,
    user_id: null,
    title: `Anonymous Mihad preview - ${city}`,
    target_country_codes: [country],
    target_locations_json: districts.length ? districts : [city],
    budget_range_json: budgetRangeForIntent(intent),
    budget_currency: intent.currency || "SAR",
    buy_box_json: {
      city,
      district: districts[0] || null,
      property_type: intent.property_type || "apartment",
      asset_type: intent.property_type || "apartment",
      monthly_payment_max: intent.monthly_payment_max || null,
      preview_only: true,
    },
    confidence_json: {
      source: "mihad_anonymous_preview",
      preview_only: true,
    },
  };
}

function headers(requestId) {
  const token = getExpectedInternalToken();
  if (!token) return null;
  return {
    authorization: `Bearer ${token}`,
    apikey: token,
    "x-internal-function-jwt": token,
    "x-request-id": requestId,
    "content-type": "application/json",
  };
}

function sourceLabel(source) {
  if (source === "aqar") return "Aqar";
  if (source === "bayut") return "Bayut";
  if (source === "property_finder") return "Property Finder";
  return source || "source";
}

function formatPrice(candidate = {}) {
  const price = Number(candidate.asking_price || candidate.limited_evidence_snapshot_json?.asking_price_native || 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  const currency = normalizeText(candidate.limited_evidence_snapshot_json?.currency) || "SAR";
  return `${new Intl.NumberFormat("en").format(Math.round(price))} ${currency}`;
}

export function previewCardsFromCandidates(candidates = []) {
  return (Array.isArray(candidates) ? candidates : []).slice(0, 3).map((candidate) => {
    const location = [candidate.district, candidate.city].map(normalizeText).filter(Boolean).join(", ");
    const price = formatPrice(candidate);
    const facts = [
      price,
      candidate.area_sqm ? `${candidate.area_sqm} sqm` : null,
      sourceLabel(candidate.source),
    ].filter(Boolean);
    return {
      title: normalizeText(candidate.title) || "Matching property preview",
      location: location || "Target market",
      note: facts.join(" · ") || "Preview match from a capped anonymous search.",
      preview_kind: "live_preview",
    };
  });
}

export function fallbackPreviewCards(intent = {}, locale = "en") {
  const city = firstValue(intent.city, locale === "ar" ? "الرياض" : "Riyadh");
  const type = intent.property_type || (locale === "ar" ? "عقار" : "property");
  const district = firstValue(intent.districts, locale === "ar" ? "الأحياء المناسبة" : "matching districts");
  return [
    {
      title: locale === "ar" ? `مسار بحث: ${type}` : `Search lane: ${type}`,
      location: [district, city].filter(Boolean).join(", "),
      note: locale === "ar"
        ? "سنشغّل بحثًا موثقًا أوسع بعد التحقق."
        : "A wider verified search starts after authentication.",
      preview_kind: "sample_preview",
    },
  ];
}

export async function buildMihadAnonymousPreview({ intent, locale = "en", requestId = randomUUID() } = {}) {
  const source = sourceForIntent(intent);
  if (!source) {
    return {
      live_preview: false,
      reason: "launch_market_adapter_not_ready",
      preview_cards: fallbackPreviewCards(intent, locale),
    };
  }
  const workerUrl = normalizeText(process.env.ACQUISITION_BROWSER_WORKER_URL).replace(/\/+$/, "");
  const internalHeaders = headers(requestId);
  if (!workerUrl || !internalHeaders) {
    return {
      live_preview: false,
      reason: !workerUrl ? "browser_worker_not_configured" : "internal_token_missing",
      preview_cards: fallbackPreviewCards(intent, locale),
    };
  }

  const key = cacheKeyForIntent(intent);
  const cached = PREVIEW_CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.value, cached: true };
  }

  const searchRun = {
    id: `anon-preview-${key.slice(0, 16)}`,
    workspace_id: null,
    mandate_id: null,
    user_id: null,
    sources_json: [source],
    limits_json: {
      max_result_pages_per_source: 1,
      max_detail_pages_per_source: 3,
      per_source_timeout_ms: 20_000,
      per_run_timeout_ms: 35_000,
    },
  };
  const response = await fetch(`${workerUrl}/internal/search-run`, {
    method: "POST",
    headers: internalHeaders,
    body: JSON.stringify({
      search_run: searchRun,
      mandate: mandateForIntent(intent),
      suppressed_candidates: [],
      preview_only: true,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      live_preview: false,
      reason: payload?.error || `browser_worker_${response.status}`,
      preview_cards: fallbackPreviewCards(intent, locale),
    };
  }
  const previewCards = previewCardsFromCandidates(payload.candidates);
  const value = {
    live_preview: previewCards.length > 0,
    reason: previewCards.length > 0 ? "ok" : "no_preview_candidates",
    source,
    preview_cards: previewCards.length ? previewCards : fallbackPreviewCards(intent, locale),
    adapter_runs: (payload.adapter_runs || []).map((run) => ({
      source: run.source,
      status: run.status,
      cards_seen: run.cards_seen || 0,
      detail_pages_fetched: run.detail_pages_fetched || 0,
      candidates_created: run.candidates_created || 0,
      failure_count: run.failure_count || 0,
    })),
  };
  PREVIEW_CACHE.set(key, { value, expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS });
  return value;
}
