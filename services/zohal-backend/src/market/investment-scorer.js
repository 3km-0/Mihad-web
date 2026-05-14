/**
 * Investment Quality Score (IQS) — 5-pillar deal-quality scoring system.
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
 * Normalization language note:
 *   Listing sources (Bayut, Aqar) may emit district names as:
 *     • Clean Arabic ("العارض")
 *     • Noisy Arabic ("العارض 87715769 - بيوت شاهد الفيديو")
 *     • English transliterations ("Al Arid", "Alarid", "Al-Arid")
 *   Market observations use clean Arabic.
 *   The lookup pipeline strips noise → normalizes Arabic orthography →
 *   maps common English names to Arabic → tries ILIKE in the DB.
 *   Extend DISTRICT_EN_TO_AR for new districts as data grows.
 */

import { scoreLocationQuality } from "./location-scorer.js";

// ---------------------------------------------------------------------------
// District normalization
// ---------------------------------------------------------------------------

/**
 * Common English/transliterated Riyadh district names → canonical Arabic.
 * Keys must be lowercase and ASCII-only (will be matched after lowercasing).
 * Add new pairs here whenever a new mismatch is discovered.
 */
const DISTRICT_EN_TO_AR = {
  // Al Arid variants
  "al arid": "العارض",
  "alarid": "العارض",
  "al-arid": "العارض",
  "al aarid": "العارض",
  "al aared": "العارض",
  "al'arid": "العارض",
  "alaared": "العارض",
  // Narjis
  "narjis": "النرجس",
  "al narjis": "النرجس",
  "narjes": "النرجس",
  // Malqa
  "malqa": "الملقا",
  "al malqa": "الملقا",
  "almalqa": "الملقا",
  // Hittin
  "hittin": "حطين",
  "hitteen": "حطين",
  "hatin": "حطين",
  "hattin": "حطين",
  // Yasmin
  "yasmin": "الياسمين",
  "al yasmin": "الياسمين",
  "yasmeen": "الياسمين",
  "al yasmeen": "الياسمين",
  // Qirowaan
  "qirowaan": "القيروان",
  "al qirowaan": "القيروان",
  "qeerawan": "القيروان",
  // Hamra
  "hamra": "الحمراء",
  "al hamra": "الحمراء",
  "al hamraa": "الحمراء",
  // Nakheel
  "nakheel": "النخيل",
  "al nakheel": "النخيل",
  "al nakheel": "النخيل",
  // Sahafa
  "sahafa": "الصحافة",
  "al sahafa": "الصحافة",
  // Rimal
  "rimal": "الرمال",
  "al rimal": "الرمال",
  // Hazm
  "hazm": "الحزم",
  "al hazm": "الحزم",
  // Rawdah
  "rawdah": "الروضة",
  "al rawdah": "الروضة",
  "rowdah": "الروضة",
  // Rahmaniya
  "rahmaniya": "الرحمانية",
  "al rahmaniya": "الرحمانية",
  // Rabi
  "al rabi": "الربيع",
  "al rabee": "الربيع",
  // Sulaymaniya
  "sulaymaniya": "السليمانية",
  "al sulaymaniya": "السليمانية",
  // Shohada
  "al shohada": "الشهداء",
  "shohada": "الشهداء",
  // Izdihar
  "izdihar": "الإزدهار",
  "al izdihar": "الإزدهار",
  // Salam
  "al salam": "السلام",
  "salam": "السلام",
  // Rabwa
  "al rabwa": "الربوة",
  "rabwa": "الربوة",
  // Jaradiya
  "al jaradiya": "الجرادية",
  "jaradiya": "الجرادية",
  // Jundaria
  "jundaria": "الجنادرية",
  "al jundaria": "الجنادرية",
  "janadriyah": "الجنادرية",
};

/**
 * Strip Arabic diacritics (tashkeel) and normalize common orthographic variants:
 *   - Alef variants (أ إ آ ٱ) → bare alef (ا)
 *   - Alef maqsura (ى) → yaa (ي)
 *   - Taa marbuta (ة) → haa (ه)
 *   - Waw with hamza (ؤ) → waw (و)
 *   - Yaa with hamza (ئ) → yaa (ي)
 *   - Hamza alone (ء) kept (usually part of meaning)
 */
function normalizeArabicOrthography(text) {
  if (!text) return "";
  return String(text)
    .replace(/[\u064B-\u065F\u0670]/g, "")  // diacritics (fatha, kasra, damma, etc.)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

/**
 * Remove Bayut/Aqar listing noise that gets appended to district fields.
 * Bayut examples:
 *   "العارض 87715769 - بيوت شاهد الفيديو"   → "العارض"
 *   "العارض (دانة الياسمين) – بناء شخصي و"  → "العارض"
 *   "العارض – واجهة شرقية ومسطح السعر"      → "العارض"
 * Strategy: chop at the first noise marker (digit run, dash, parenthesis, English word).
 */
function stripDistrictNoise(raw) {
  if (!raw) return "";
  let text = String(raw).trim();
  // Strip after: digit sequence (listing IDs), dash/em-dash, parenthesis, Latin word start
  text = text
    .replace(/\s+\d[\d,\s]{2,}.*$/, "")    // "العارض 87715769 …" → "العارض"
    .replace(/\s+[-–—]\s+.*$/, "")          // "العارض – واجهة …" → "العارض"
    .replace(/\s+[-–—].*$/, "")             // without space after dash
    .replace(/\s+\(.*$/, "")               // "(دانة …)"
    .replace(/\s+[A-Za-z].*$/, "");        // English suffix
  return text.trim();
}

/**
 * Produce a canonical lookup key for a district name, regardless of source language.
 * Returns a normalized Arabic string (or a normalized English key if Arabic mapping unknown).
 */
function canonicalDistrict(raw) {
  if (!raw) return "";
  const stripped = stripDistrictNoise(raw);
  const normalized = normalizeArabicOrthography(stripped).trim();

  // If it contains Arabic letters, use the normalized Arabic form
  if (/[\u0600-\u06FF]/.test(normalized)) return normalized;

  // Otherwise treat as English/transliterated — look up Arabic mapping
  const lower = stripped.toLowerCase().trim();
  const arabicForm = DISTRICT_EN_TO_AR[lower];
  if (arabicForm) return normalizeArabicOrthography(arabicForm);

  // No mapping — return normalized lowercase English as fallback key
  return lower.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Return all candidate lookup strings for a district name:
 * the canonical form plus any plausible equivalents for ILIKE matching.
 */
function districtLookupTerms(raw) {
  const canon = canonicalDistrict(raw);
  const terms = new Set([canon]);

  // If canon is Arabic and we have a reverse mapping, include it for safety
  // (market data is clean Arabic so this is usually not needed, but it doesn't hurt)
  const stripped = stripDistrictNoise(raw).toLowerCase().trim();
  const arabicFromEn = DISTRICT_EN_TO_AR[stripped];
  if (arabicFromEn) terms.add(normalizeArabicOrthography(arabicFromEn));

  // Some DBs store shortened forms — add without definite article (ال)
  for (const t of [...terms]) {
    if (t.startsWith("ا")) terms.add(t.slice(1));  // strip leading alef (bare ال removal)
  }

  return [...terms].filter(Boolean);
}

// ---------------------------------------------------------------------------
// Market data fetching
// ---------------------------------------------------------------------------

const MARKET_FETCH_TIMEOUT_MS = 5000;

/**
 * Normalise a property_type string so we can compare to market observation types.
 * Market data uses Arabic type labels (فيلا, شقه, etc.).
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
 * Fetch all market observation rows for a given district + property type from Supabase.
 * Returns rows ordered by year_number + quarter_number (oldest → newest).
 * Resilient: returns [] on timeout or error (scoring falls back to no-market-data mode).
 */
async function fetchMarketRows(supabase, districtRaw, propertyTypeRaw) {
  const terms = districtLookupTerms(districtRaw);
  const propType = canonicalPropertyType(propertyTypeRaw);

  // Build OR filter for district (case-insensitive, partial match to handle DB orthography)
  // We'll filter by the first term that returns results; try exact first, then broader.
  let rows = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MARKET_FETCH_TIMEOUT_MS);

    for (const term of terms) {
      if (!term) continue;
      const { data, error } = await supabase
        .from("acquisition_market_observations")
        .select("district, year_number, quarter_number, average_price_per_sqm, min_price_per_sqm, max_price_per_sqm, transaction_count, property_type")
        .ilike("district", `%${term}%`)
        .order("year_number", { ascending: true })
        .order("quarter_number", { ascending: true })
        .limit(20);
      if (error) continue;
      if (!data || data.length === 0) continue;

      // Filter by property type if data has it populated
      const typed = data.filter((r) => {
        if (!r.property_type) return true; // no type column → include all
        return canonicalPropertyType(r.property_type) === propType || propType === "";
      });
      if (typed.length > 0) { rows = typed; break; }
      // If no type match, use unfiltered (type column might be empty for older data)
      if (rows.length === 0) rows = data;
    }

    clearTimeout(timeout);
  } catch {
    // Timeout or network error — return empty, scorer will use fallback points
    rows = [];
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Pillar scorers
// ---------------------------------------------------------------------------

/**
 * P1 — Price Efficiency vs Market (30 pts).
 * Compares the deal's asking price per sqm (PSM) to the district's latest market average PSM.
 *
 * ratio < 0.70  → 30 pts  (>30% below market — strong value)
 * ratio = 1.00  → 18 pts  (at market)
 * ratio = 1.25  → 6 pts   (25% premium)
 * ratio ≥ 1.50  → 0 pts   (50%+ over market)
 *
 * Edge case: PSM < 2 500 SAR/m² for a Riyadh villa is very likely plot/land area
 * data (Bayut often reports plot size rather than built-up GFA). 2 500 is the
 * empirical floor of the lowest Riyadh district villa avg PSM in our market data.
 * We flag it and apply a 50% discount to the pillar score to avoid gaming.
 */
function scoreP1(dealPsm, latestMarketRow) {
  const maxPts = 30;
  if (!dealPsm || dealPsm <= 0 || !latestMarketRow?.average_price_per_sqm) {
    return { pts: 10, max: maxPts, note: "no_market_data", ratio: null };
  }

  const marketPsm = Number(latestMarketRow.average_price_per_sqm);
  if (marketPsm <= 0) return { pts: 10, max: maxPts, note: "market_psm_zero", ratio: null };

  const ratio = dealPsm / marketPsm;

  // Sanity: PSM below 2 500 SAR/m² for a villa → very likely plot/land area reported
  if (dealPsm < 2500) {
    const raw = linearInterp(ratio, [
      [0.70, maxPts], [1.00, 18], [1.25, 6], [1.50, 0],
    ]);
    return {
      pts: Math.round(raw * 0.5),   // halved due to data uncertainty
      max: maxPts,
      note: "suspect_land_area_psm",
      deal_psm: Math.round(dealPsm),
      market_avg_psm: Math.round(marketPsm),
      ratio: +ratio.toFixed(3),
    };
  }

  const pts = Math.round(linearInterp(ratio, [
    [0.70, maxPts], [1.00, 18], [1.25, 6], [1.50, 0],
  ]));

  return {
    pts: Math.max(0, Math.min(maxPts, pts)),
    max: maxPts,
    deal_psm: Math.round(dealPsm),
    market_avg_psm: Math.round(marketPsm),
    ratio: +ratio.toFixed(3),
    district: latestMarketRow.district,
    data_quarter: `Q${latestMarketRow.quarter_number} ${latestMarketRow.year_number}`,
  };
}

/**
 * P2 — Market Momentum (20 pts).
 * Uses the two most-separated data points to compute average quarterly PSM growth.
 *
 * > +3% per quarter  → 20 pts (strong appreciation)
 * 0–3% per quarter   → 12–20 pts (positive)
 * -1%–0% per quarter → 8–12 pts (flat)
 * -3%–-1%            → 2–8 pts  (declining)
 * < -3% per quarter  → 0–2 pts  (falling fast)
 */
function scoreP2(marketRows) {
  const maxPts = 20;
  if (!marketRows || marketRows.length < 2) {
    return { pts: 8, max: maxPts, note: "insufficient_trend_data" };
  }

  // Use oldest vs newest row
  const oldest = marketRows[0];
  const newest = marketRows[marketRows.length - 1];
  const oldPsm = Number(oldest.average_price_per_sqm);
  const newPsm = Number(newest.average_price_per_sqm);
  if (oldPsm <= 0 || newPsm <= 0) return { pts: 8, max: maxPts, note: "invalid_psm_values" };

  // Approximate quarters elapsed (year*4 + quarter)
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
    from: `Q${oldest.quarter_number} ${oldest.year_number} (${Math.round(oldPsm)} SAR/m²)`,
    to: `Q${newest.quarter_number} ${newest.year_number} (${Math.round(newPsm)} SAR/m²)`,
    quarters_elapsed: quartersElapsed,
  };
}

/**
 * P3 — Market Liquidity (15 pts).
 * Based on the latest quarter's transaction count for the district + type.
 * Uses a log-scale so thin markets aren't penalised linearly:
 *   250+ txns → 15 pts, 50 → ~10 pts, 10 → ~7 pts, 0 → 3 pts (uncertainty floor)
 */
function scoreP3(latestMarketRow) {
  const maxPts = 15;
  if (!latestMarketRow?.transaction_count) {
    return { pts: 3, max: maxPts, note: "no_transaction_data" };
  }

  const txns = Number(latestMarketRow.transaction_count);
  if (txns <= 0) return { pts: 3, max: maxPts, transaction_count: 0 };

  // log10(1) = 0 → 0 pts above floor; log10(251) ≈ 2.4 → full 12 pts above floor
  const scale = Math.min(1, Math.log10(txns + 1) / Math.log10(251));
  const pts = 3 + Math.round(scale * (maxPts - 3));

  return {
    pts: Math.max(0, Math.min(maxPts, pts)),
    max: maxPts,
    transaction_count: txns,
    data_quarter: `Q${latestMarketRow.quarter_number} ${latestMarketRow.year_number}`,
  };
}

/**
 * P4 — Listing Evidence Quality (20 pts).
 * Rewards complete, verifiable listing data that makes deeper diligence possible.
 *
 *   area_sqm available:           +5 pts
 *   bedroom_count available:      +4 pts
 *   ≥3 real photos:               +5 pts  (≥1 photo: +2 pts)
 *   price + area (PSM computable):+3 pts
 *   live source URL:              +3 pts
 */
function scoreP4(candidate) {
  const maxPts = 20;
  let pts = 0;
  const details = {};

  // Area
  if (candidate.area_sqm && Number(candidate.area_sqm) > 0) {
    pts += 5; details.area_sqm = Number(candidate.area_sqm);
  } else {
    details.area_sqm = null;
  }

  // Bedrooms — try multiple field names adapters may use
  const bedrooms = candidate.bedroom_count ?? candidate.bedrooms ?? candidate.bedroomCount ?? null;
  if (bedrooms && Number(bedrooms) > 0) {
    pts += 4; details.bedroom_count = Number(bedrooms);
  } else {
    details.bedroom_count = null;
  }

  // Real photos (exclude SVG, GIF, Bayut asset paths, placeholder/logo URLs)
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

  // PSM computable
  const price = Number(candidate.asking_price || 0);
  const area = Number(candidate.area_sqm || 0);
  if (price > 0 && area > 0) { pts += 3; details.psm_computable = true; }
  else { details.psm_computable = false; }

  // Source URL
  if (candidate.source_url && /^https?:\/\//i.test(String(candidate.source_url))) {
    pts += 3; details.has_source_url = true;
  } else {
    details.has_source_url = false;
  }

  return { pts: Math.max(0, Math.min(maxPts, pts)), max: maxPts, details };
}

/**
 * P5 — Budget Position (15 pts).
 * How deep is the asking price within the mandate budget window?
 * More headroom = more room to negotiate, lower leverage risk.
 *
 *   asking_price / budget_max ≤ 0.5 (bottom half) → 15 pts
 *   asking_price = budget_max                       → 0 pts
 *   asking_price > budget_max                       → 0 pts (hard disqualifier)
 *   No budget range info                            → 7 pts (neutral)
 */
function scoreP5(askingPrice, budgetMin, budgetMax) {
  const maxPts = 15;
  if (!askingPrice || askingPrice <= 0) {
    return { pts: 0, max: maxPts, note: "no_asking_price" };
  }
  if (!budgetMax || budgetMax <= 0) {
    return { pts: 7, max: maxPts, note: "no_budget_range" };
  }
  if (askingPrice > budgetMax) {
    return { pts: 0, max: maxPts, note: "over_budget", asking: askingPrice, budget_max: budgetMax };
  }

  const bMin = budgetMin && budgetMin > 0 && budgetMin < budgetMax ? budgetMin : 0;
  const window = budgetMax - bMin;
  if (window <= 0) {
    return { pts: 7, max: maxPts, note: "degenerate_budget_window" };
  }

  const headroomFraction = (budgetMax - askingPrice) / window;
  const pts = Math.round(Math.max(0, Math.min(1, headroomFraction)) * maxPts);

  return {
    pts,
    max: maxPts,
    asking_price: askingPrice,
    budget_max: budgetMax,
    budget_min: bMin,
    headroom_pct: Math.round(headroomFraction * 100),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Piecewise linear interpolation.
 * `anchors` is an array of [x, y] pairs sorted by x descending (highest x first
 * because ratios or returns are typically thought of high→low for score).
 * The function clamps outside the range.
 */
function linearInterp(x, anchors) {
  // Sort by x ascending for interpolation
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

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Compute the Investment Quality Score for a candidate opportunity.
 *
 * @param {object} opts
 * @param {object} opts.candidate  — row from acquisition_candidate_opportunities
 * @param {object} opts.mandate    — row from acquisition_mandates (for budget)
 * @param {object} opts.supabase   — Supabase client
 * @returns {Promise<{total: number, breakdown: object, market_district_matched: string|null}>}
 */
export async function computeInvestmentScore({ candidate, mandate, supabase }) {
  const askingPrice = Number(candidate.asking_price || 0);
  const areaSqm = Number(candidate.area_sqm || 0);
  const dealPsm = askingPrice > 0 && areaSqm > 0 ? askingPrice / areaSqm : null;

  const budget = mandate?.budget_range_json && typeof mandate.budget_range_json === "object"
    ? mandate.budget_range_json
    : {};
  const budgetMax = Number(budget.max || budget.maximum || 0);
  const budgetMin = Number(budget.min || budget.minimum || 0);

  // Fetch market data for this district + property type
  const districtRaw = candidate.district || "";
  const propertyTypeRaw = candidate.property_type || "";
  const marketRows = await fetchMarketRows(supabase, districtRaw, propertyTypeRaw);

  const latestMarketRow = marketRows.length
    ? marketRows[marketRows.length - 1]   // newest (highest year/quarter)
    : null;

  const p1 = scoreP1(dealPsm, latestMarketRow);
  const p2 = scoreP2(marketRows);
  const p3 = scoreP3(latestMarketRow);
  const p4 = scoreP4(candidate);
  const p5 = scoreP5(askingPrice, budgetMin, budgetMax);
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
