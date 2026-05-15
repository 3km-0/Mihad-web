/**
 * Investment Quality Score (IQS) — 6-pillar deal-quality scoring system.
 *
 * Answers: "How good an investment is this listing, relative to the market?"
 * Output: 0–100 total score with a per-pillar breakdown.
 *
 * Pillars:
 *   P1 — Price Efficiency vs Market     (30 pts) — PSM vs district average
 *   P2 — Market Momentum                (20 pts) — quarterly PSM trend
 *   P3 — Market Liquidity               (15 pts) — recent transaction count
 *   P4 — Listing Evidence Quality       (20 pts) — completeness of scraped data
 *   P5 — Budget Position                (15 pts) — headroom inside mandate budget
 *   P6 — Location Quality               (15 pts) — coordinate confidence + nearby amenity density
 *
 * The raw 115-point score is normalized back to 0–100 for the public IQS.
 *
 * Cross-border:
 *   The scorer is country-aware. Saudi Arabia is one country among many. The
 *   `country_code` on the candidate (or mandate target) selects the district
 *   normalizer and the liquidity baseline. Currency normalization (everything
 *   SAR-denominated) happens inside the scorer via fx.js so cross-country
 *   comparisons remain apples-to-apples.
 *
 * Normalization language note:
 *   Listing sources may emit district names in many spellings. Per-country
 *   normalizers under `src/market/district-normalizers/{sa,ae,tr,gr,es}.js`
 *   map English/transliterated variants to the canonical label used in
 *   `acquisition_market_observations`. Extend those tables as new districts
 *   are observed.
 */

import { scoreLocationQuality } from "./location-scorer.js";
import { convertToSAR, getFxRateToSAR } from "./fx.js";
import { getCountryBaseline } from "./country-baselines.js";
import { getDistrictMap } from "./district-normalizers/index.js";

// ---------------------------------------------------------------------------
// District normalization (country-keyed)
// ---------------------------------------------------------------------------

/**
 * Strip Arabic diacritics (tashkeel) and normalize common orthographic
 * variants. Only relevant for the SA market; other markets pass through.
 */
function normalizeArabicOrthography(text) {
  if (!text) return "";
  return String(text)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

/**
 * Remove portal listing noise that gets appended to district fields.
 * Strategy: chop at the first noise marker (digit run, dash, parenthesis,
 * Latin word start). Works for both Arabic and Latin-script inputs.
 */
function stripDistrictNoise(raw) {
  if (!raw) return "";
  let text = String(raw).trim();
  text = text
    .replace(/\s+\d[\d,\s]{2,}.*$/, "")
    .replace(/\s+[-–—]\s+.*$/, "")
    .replace(/\s+[-–—].*$/, "")
    .replace(/\s+\(.*$/, "");
  return text.trim();
}

function isArabicLetter(text) {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Produce a canonical lookup key for a district name in a given country.
 * For SA the canonical form is Arabic; for AE/TR/GR/ES it is a canonical
 * Latin label that matches market observation rows.
 */
function canonicalDistrict(raw, countryCode) {
  if (!raw) return "";
  const stripped = stripDistrictNoise(raw);
  const map = getDistrictMap(countryCode);
  const country = (countryCode || "SA").toUpperCase();

  if (country === "SA") {
    const normalized = normalizeArabicOrthography(stripped).trim();
    if (isArabicLetter(normalized)) return normalized;
    const lower = stripped.toLowerCase().trim();
    const arabicForm = map[lower];
    if (arabicForm) return normalizeArabicOrthography(arabicForm);
    return lower.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  }

  const lower = stripped.toLowerCase().trim();
  const mapped = map[lower];
  if (mapped) return mapped;
  return stripped;
}

/**
 * Return all candidate lookup strings for a district name. The first match
 * wins in the DB query.
 */
function districtLookupTerms(raw, countryCode) {
  const canon = canonicalDistrict(raw, countryCode);
  const terms = new Set([canon]);

  const map = getDistrictMap(countryCode);
  const stripped = stripDistrictNoise(raw).toLowerCase().trim();
  const mapped = map[stripped];
  if (mapped) {
    terms.add((countryCode || "SA").toUpperCase() === "SA"
      ? normalizeArabicOrthography(mapped)
      : mapped);
  }

  if ((countryCode || "SA").toUpperCase() === "SA") {
    for (const t of [...terms]) {
      if (t.startsWith("ا")) terms.add(t.slice(1));
    }
  } else {
    terms.add(stripped);
  }

  return [...terms].filter(Boolean);
}

// ---------------------------------------------------------------------------
// Market data fetching
// ---------------------------------------------------------------------------

const MARKET_FETCH_TIMEOUT_MS = 5000;

/**
 * Normalise a property_type string. Recognises Arabic and English labels.
 */
function canonicalPropertyType(raw) {
  const t = normalizeArabicOrthography(String(raw || "")).toLowerCase().trim();
  if (/villa|فيلا|فله|فلل/.test(t)) return "villa";
  if (/apart|شقه|شقق/.test(t)) return "apartment";
  if (/floor|دور/.test(t)) return "floor";
  if (/land|ارض|أرض/.test(t)) return "land";
  return t;
}

/**
 * Fetch market observation rows for a given district / property type / country
 * from Supabase. Ordered oldest → newest. Resilient: returns [] on failure.
 */
async function fetchMarketRows(supabase, districtRaw, propertyTypeRaw, countryCode) {
  const country = (countryCode || "SA").toUpperCase();
  const terms = districtLookupTerms(districtRaw, country);
  const baseline = getCountryBaseline(country);
  const propType = canonicalPropertyType(propertyTypeRaw) || baseline.defaultPropertyType;

  let rows = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MARKET_FETCH_TIMEOUT_MS);

    for (const term of terms) {
      if (!term) continue;
      const { data, error } = await supabase
        .from("acquisition_market_observations")
        .select("district, year_number, quarter_number, average_price_per_sqm, min_price_per_sqm, max_price_per_sqm, transaction_count, property_type, country_code")
        .eq("country_code", country)
        .ilike("district", `%${term}%`)
        .order("year_number", { ascending: true })
        .order("quarter_number", { ascending: true })
        .limit(20);
      if (error) continue;
      if (!data || data.length === 0) continue;

      const typed = data.filter((r) => {
        if (!r.property_type) return true;
        return canonicalPropertyType(r.property_type) === propType || propType === "";
      });
      if (typed.length > 0) { rows = typed; break; }
      if (rows.length === 0) rows = data;
    }

    clearTimeout(timeout);
  } catch {
    rows = [];
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Pillar scorers
// ---------------------------------------------------------------------------

/**
 * P1 — Price Efficiency vs Market (30 pts).
 * Compares the deal's SAR-normalized PSM to the district's latest market
 * average SAR PSM. Listings priced suspiciously low for the country baseline
 * are flagged as "suspect land/plot PSM" and the pillar is halved.
 */
function scoreP1(dealPsmSAR, latestMarketRow, baseline) {
  const maxPts = 30;
  if (!dealPsmSAR || dealPsmSAR <= 0 || !latestMarketRow?.average_price_per_sqm) {
    return { pts: 10, max: maxPts, note: "no_market_data", ratio: null };
  }

  const marketPsm = Number(latestMarketRow.average_price_per_sqm);
  if (marketPsm <= 0) return { pts: 10, max: maxPts, note: "market_psm_zero", ratio: null };

  const ratio = dealPsmSAR / marketPsm;

  if (dealPsmSAR < baseline.psmFloorSAR) {
    const raw = linearInterp(ratio, [
      [0.70, maxPts], [1.00, 18], [1.25, 6], [1.50, 0],
    ]);
    return {
      pts: Math.round(raw * 0.5),
      max: maxPts,
      note: "suspect_land_area_psm",
      deal_psm_sar: Math.round(dealPsmSAR),
      market_avg_psm_sar: Math.round(marketPsm),
      ratio: +ratio.toFixed(3),
      psm_floor_sar: baseline.psmFloorSAR,
    };
  }

  const pts = Math.round(linearInterp(ratio, [
    [0.70, maxPts], [1.00, 18], [1.25, 6], [1.50, 0],
  ]));

  return {
    pts: Math.max(0, Math.min(maxPts, pts)),
    max: maxPts,
    deal_psm_sar: Math.round(dealPsmSAR),
    market_avg_psm_sar: Math.round(marketPsm),
    ratio: +ratio.toFixed(3),
    district: latestMarketRow.district,
    data_quarter: `Q${latestMarketRow.quarter_number} ${latestMarketRow.year_number}`,
  };
}

/**
 * P2 — Market Momentum (20 pts).
 * Uses the two most-separated data points to compute average quarterly PSM
 * growth. The PSM values are already in the market observation's currency,
 * which we assume is consistent within a country (the import pipeline keeps
 * country-currency consistent per observation). FX is not applied here
 * because momentum is a ratio of two same-currency PSMs.
 */
function scoreP2(marketRows) {
  const maxPts = 20;
  if (!marketRows || marketRows.length < 2) {
    return { pts: 8, max: maxPts, note: "insufficient_trend_data" };
  }

  const oldest = marketRows[0];
  const newest = marketRows[marketRows.length - 1];
  const oldPsm = Number(oldest.average_price_per_sqm);
  const newPsm = Number(newest.average_price_per_sqm);
  if (oldPsm <= 0 || newPsm <= 0) return { pts: 8, max: maxPts, note: "invalid_psm_values" };

  const quartersElapsed = (newest.year_number - oldest.year_number) * 4
    + (newest.quarter_number - oldest.quarter_number);
  if (quartersElapsed <= 0) return { pts: 8, max: maxPts, note: "single_period" };

  const quarterlyReturn = Math.pow(newPsm / oldPsm, 1 / quartersElapsed) - 1;

  const pts = Math.round(linearInterp(quarterlyReturn, [
    [0.03, maxPts],
    [0.00, 12],
    [-0.01, 8],
    [-0.03, 2],
    [-0.06, 0],
  ]));

  return {
    pts: Math.max(0, Math.min(maxPts, pts)),
    max: maxPts,
    quarterly_return_pct: +(quarterlyReturn * 100).toFixed(2),
    from: `Q${oldest.quarter_number} ${oldest.year_number} (${Math.round(oldPsm)} PSM)`,
    to: `Q${newest.quarter_number} ${newest.year_number} (${Math.round(newPsm)} PSM)`,
    quarters_elapsed: quartersElapsed,
  };
}

/**
 * P3 — Market Liquidity (15 pts).
 * Based on the latest quarter's transaction count for the district + type.
 * Uses a log scale with a country-specific saturation point (Riyadh tier-1
 * markets see ~250/quarter; Greek islands ~120; etc.).
 */
function scoreP3(latestMarketRow, baseline) {
  const maxPts = 15;
  if (!latestMarketRow?.transaction_count) {
    return { pts: 3, max: maxPts, note: "no_transaction_data" };
  }

  const txns = Number(latestMarketRow.transaction_count);
  if (txns <= 0) return { pts: 3, max: maxPts, transaction_count: 0 };

  const saturation = Math.max(10, baseline.liquidityScale);
  const scale = Math.min(1, Math.log10(txns + 1) / Math.log10(saturation + 1));
  const pts = 3 + Math.round(scale * (maxPts - 3));

  return {
    pts: Math.max(0, Math.min(maxPts, pts)),
    max: maxPts,
    transaction_count: txns,
    liquidity_saturation: saturation,
    data_quarter: `Q${latestMarketRow.quarter_number} ${latestMarketRow.year_number}`,
  };
}

/**
 * P4 — Listing Evidence Quality (20 pts).
 */
function scoreP4(candidate) {
  const maxPts = 20;
  let pts = 0;
  const details = {};

  if (candidate.area_sqm && Number(candidate.area_sqm) > 0) {
    pts += 5; details.area_sqm = Number(candidate.area_sqm);
  } else {
    details.area_sqm = null;
  }

  const bedrooms = candidate.bedroom_count ?? candidate.bedrooms ?? candidate.bedroomCount ?? null;
  if (bedrooms && Number(bedrooms) > 0) {
    pts += 4; details.bedroom_count = Number(bedrooms);
  } else {
    details.bedroom_count = null;
  }

  const photoRefs = Array.isArray(candidate.photo_refs_json) ? candidate.photo_refs_json : [];
  const realPhotos = photoRefs.filter(
    (url) =>
      typeof url === "string" &&
      /^https?:\/\//i.test(url) &&
      !/\.(svg|gif)(?:$|[?#])/i.test(url) &&
      !/\/assets\/my_bayut/i.test(url) &&
      !/placeholder|logo\.(?:png|jpg)/i.test(url),
  );
  details.photo_count = realPhotos.length;
  if (realPhotos.length >= 3) pts += 5;
  else if (realPhotos.length >= 1) pts += 2;

  const price = Number(candidate.asking_price || 0);
  const area = Number(candidate.area_sqm || 0);
  if (price > 0 && area > 0) { pts += 3; details.psm_computable = true; }
  else { details.psm_computable = false; }

  if (candidate.source_url && /^https?:\/\//i.test(String(candidate.source_url))) {
    pts += 3; details.has_source_url = true;
  } else {
    details.has_source_url = false;
  }

  return { pts: Math.max(0, Math.min(maxPts, pts)), max: maxPts, details };
}

/**
 * P5 — Budget Position (15 pts).
 *
 * Three regimes, all measured against the SAR-normalised asking price:
 *   - Over budget_max  → 0 pts (deal disqualifies on price).
 *   - Inside [min,max] → score scales by headroom under the cap, so a
 *     deal at the bottom of the band reads as "lots of room", and one
 *     at the very top reads as "tight".
 *   - Below budget_min → partial credit only. A buyer asking for a
 *     "6–12M AED apartment" doesn't really want a 1M studio: it
 *     usually signals off-mandate inventory or stale legacy data. We
 *     award a small bounded reward proportional to how close the deal
 *     is to the floor, never full marks.
 *
 * The mandate budget may be in any supported currency; both the asking
 * price and the budget are converted to SAR before the comparison.
 */
function scoreP5(askingPriceSAR, budgetMinSAR, budgetMaxSAR, currencyMeta) {
  const maxPts = 15;
  if (!askingPriceSAR || askingPriceSAR <= 0) {
    return { pts: 0, max: maxPts, note: "no_asking_price" };
  }
  if (!budgetMaxSAR || budgetMaxSAR <= 0) {
    return { pts: 7, max: maxPts, note: "no_budget_range" };
  }
  if (askingPriceSAR > budgetMaxSAR) {
    return {
      pts: 0,
      max: maxPts,
      note: "over_budget",
      asking_sar: Math.round(askingPriceSAR),
      budget_max_sar: Math.round(budgetMaxSAR),
      ...currencyMeta,
    };
  }

  const bMin = budgetMinSAR && budgetMinSAR > 0 && budgetMinSAR < budgetMaxSAR ? budgetMinSAR : 0;

  if (bMin > 0 && askingPriceSAR < bMin) {
    // Below floor: bounded reward based on closeness to the floor.
    // closeness = askingPriceSAR / bMin maps [0..bMin] → [0..1].
    // We cap the reward at 40% of the pillar so a clearly off-mandate
    // deal can never out-score a properly-banded one.
    const closeness = Math.max(0, Math.min(1, askingPriceSAR / bMin));
    const pts = Math.round(closeness * (maxPts * 0.4));
    return {
      pts,
      max: maxPts,
      note: "below_budget_floor",
      asking_sar: Math.round(askingPriceSAR),
      budget_min_sar: Math.round(bMin),
      budget_max_sar: Math.round(budgetMaxSAR),
      floor_distance_pct: Math.round((1 - closeness) * 100),
      ...currencyMeta,
    };
  }

  const window = budgetMaxSAR - bMin;
  if (window <= 0) {
    return { pts: 7, max: maxPts, note: "degenerate_budget_window" };
  }

  const headroomFraction = (budgetMaxSAR - askingPriceSAR) / window;
  const pts = Math.round(Math.max(0, Math.min(1, headroomFraction)) * maxPts);

  return {
    pts,
    max: maxPts,
    asking_sar: Math.round(askingPriceSAR),
    budget_max_sar: Math.round(budgetMaxSAR),
    budget_min_sar: Math.round(bMin),
    headroom_pct: Math.round(headroomFraction * 100),
    ...currencyMeta,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function linearInterp(x, anchors) {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0]);
  if (x <= sorted[0][0]) return sorted[0][1];
  if (x >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1];
  for (let i = 0; i < sorted.length - 1; i++) {
    const [x0, y0] = sorted[i];
    const [x1, y1] = sorted[i + 1];
    if (x >= x0 && x <= x1) {
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return sorted[sorted.length - 1][1];
}

function resolveCountryCode(candidate, mandate) {
  const fromCandidate = candidate?.country_code || candidate?.countryCode || null;
  if (fromCandidate) return String(fromCandidate).toUpperCase();
  const targets = Array.isArray(mandate?.target_country_codes) ? mandate.target_country_codes : [];
  if (targets.length === 1 && targets[0]) return String(targets[0]).toUpperCase();
  return "SA";
}

function resolveListingCurrency(candidate, countryCode) {
  if (candidate?.currency) return String(candidate.currency).toUpperCase();
  switch ((countryCode || "SA").toUpperCase()) {
    case "AE": return "AED";
    case "TR": return "TRY";
    case "GR":
    case "ES":
      return "EUR";
    default:
      return "SAR";
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Compute the Investment Quality Score for a candidate opportunity.
 *
 * @param {object} opts
 * @param {object} opts.candidate  — row from acquisition_candidate_opportunities
 * @param {object} opts.mandate    — row from acquisition_mandates (for budget + targets)
 * @param {object} opts.supabase   — Supabase client
 * @returns {Promise<object>} score breakdown
 */
export async function computeInvestmentScore({ candidate, mandate, supabase }) {
  const countryCode = resolveCountryCode(candidate, mandate);
  const baseline = getCountryBaseline(countryCode);
  const listingCurrency = resolveListingCurrency(candidate, countryCode);
  const fxRateToSAR = getFxRateToSAR(listingCurrency) ?? 1;

  const askingPriceNative = Number(candidate.asking_price || 0);
  const askingPriceSAR = convertToSAR(askingPriceNative, listingCurrency) ?? askingPriceNative;
  const areaSqm = Number(candidate.area_sqm || 0);
  const dealPsmSAR = askingPriceSAR > 0 && areaSqm > 0 ? askingPriceSAR / areaSqm : null;

  const budget = mandate?.budget_range_json && typeof mandate.budget_range_json === "object"
    ? mandate.budget_range_json
    : {};
  const budgetCurrency = mandate?.budget_currency
    ? String(mandate.budget_currency).toUpperCase()
    : "SAR";
  const budgetMaxNative = Number(budget.max || budget.maximum || 0);
  const budgetMinNative = Number(budget.min || budget.minimum || 0);
  const budgetMaxSAR = convertToSAR(budgetMaxNative, budgetCurrency) ?? budgetMaxNative;
  const budgetMinSAR = convertToSAR(budgetMinNative, budgetCurrency) ?? budgetMinNative;

  const districtRaw = candidate.district || "";
  const propertyTypeRaw = candidate.property_type || "";
  const rawMarketRows = await fetchMarketRows(supabase, districtRaw, propertyTypeRaw, countryCode);

  // Market observations are stored in the country's native currency
  // (SAR for SA, AED for AE, EUR for ES/GR, TRY for TR). The deal PSM
  // we compare against is already SAR-normalized, so we must normalise
  // the market PSM the same way before P1 computes its ratio. P2
  // momentum uses ratios of same-currency PSMs and is unaffected; P3
  // only reads transaction_count so it's unaffected too. We still
  // normalise the rows once here so downstream pillars don't need to
  // know about currency at all.
  const marketCurrency = resolveListingCurrency(null, countryCode);
  const marketFxToSAR = getFxRateToSAR(marketCurrency) ?? 1;
  const marketRows = rawMarketRows.map((row) => ({
    ...row,
    average_price_per_sqm: row.average_price_per_sqm != null
      ? Number(row.average_price_per_sqm) * marketFxToSAR
      : row.average_price_per_sqm,
    min_price_per_sqm: row.min_price_per_sqm != null
      ? Number(row.min_price_per_sqm) * marketFxToSAR
      : row.min_price_per_sqm,
    max_price_per_sqm: row.max_price_per_sqm != null
      ? Number(row.max_price_per_sqm) * marketFxToSAR
      : row.max_price_per_sqm,
  }));

  const latestMarketRow = marketRows.length
    ? marketRows[marketRows.length - 1]
    : null;

  const p1 = scoreP1(dealPsmSAR, latestMarketRow, baseline);
  const p2 = scoreP2(marketRows);
  const p3 = scoreP3(latestMarketRow, baseline);
  const p4 = scoreP4(candidate);
  const p5 = scoreP5(askingPriceSAR, budgetMinSAR, budgetMaxSAR, {
    listing_currency: listingCurrency,
    budget_currency: budgetCurrency,
    fx_rate_to_sar: fxRateToSAR,
  });
  const p6 = await scoreLocationQuality({ candidate, mandate }).catch(() => ({
    pts: 3,
    max: 15,
    note: "location_score_unavailable",
  }));

  const rawTotal = p1.pts + p2.pts + p3.pts + p4.pts + p5.pts + p6.pts;
  const maxPoints = p1.max + p2.max + p3.max + p4.max + p5.max + p6.max;
  const total = Math.round(rawTotal / maxPoints * 100);

  return {
    total: Math.max(0, Math.min(100, total)),
    raw_total: Math.round(rawTotal),
    max_points: maxPoints,
    country_code: countryCode,
    country_label: baseline.label,
    listing_currency: listingCurrency,
    fx_rate_to_sar: fxRateToSAR,
    breakdown: {
      p1_price_efficiency: p1,
      p2_market_momentum: p2,
      p3_market_liquidity: p3,
      p4_evidence_quality: p4,
      p5_budget_position: p5,
      p6_location_quality: p6,
    },
    market_district_matched: latestMarketRow?.district ?? null,
    district_lookup_input: districtRaw,
    scored_at: new Date().toISOString(),
  };
}
