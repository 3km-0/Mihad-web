# Investment Quality Score (IQS)

> **Status:** Live as of May 2026. Cross-border (SA / AE / TR / GR / ES) as of the Mihad pivot. Computed at promotion time; backfillable for existing deals.

## Purpose

The Investment Quality Score answers: **"How good an investment is this deal — relative to the market?"**

The previous mandate-fit score only checked whether a listing _matched_ the buy-box (city / district / type / budget). If it passed all four filters it scored 100/100. Every real listing from a properly-tuned search run landed at 100 — no differentiation.

IQS replaces that with a 6-pillar system that compares each deal to **real market benchmarks** from `acquisition_market_observations`. As of the Mihad pivot the scorer is country-aware: Saudi Arabia is one supported market alongside the United Arab Emirates, Türkiye, Greece, and Spain. Listings denominated in foreign currencies are converted to SAR before pillar scoring so cross-border deals are directly comparable.

---

## Score range

**0 – 100 total**, composed of six pillars. Higher = better investment.

| Pillar | Weight | Data source |
|--------|--------|-------------|
| P1 — Price Efficiency vs Market | 30 pts | SAR-normalized PSM vs district quarterly average |
| P2 — Market Momentum | 20 pts | Quarterly PSM trend, multi-period |
| P3 — Market Liquidity | 15 pts | Recent transaction count vs country saturation |
| P4 — Listing Evidence Quality | 20 pts | Completeness of scraped data |
| P5 — Budget Position | 15 pts | SAR-normalized headroom within mandate budget range |
| P6 — Location Quality | 15 pts | Coordinate confidence + nearby amenity density |

---

## Pillar detail

### P1 — Price Efficiency vs Market (30 pts)

Computes `deal_psm = asking_price / area_sqm` and compares it to the district's latest average PSM from market observations.

| Price / Market ratio | Points |
|---|---|
| ≤ 0.70 (≥30% below market) | 30 |
| 1.00 (at market) | 18 |
| 1.25 (25% premium) | 6 |
| ≥ 1.50 (50%+ premium) | 0 |

Linearly interpolated between anchors.

**Edge case — land area data:** Bayut often reports plot/land area rather than built-up floor area as the primary size metric. A villa with PSM below 1 500 SAR/m² is flagged as `suspect_land_area_psm` and the pillar score is halved (uncertainty discount) rather than inflated.

If no market data is found for the district, a neutral **10 pts** is awarded.

### P2 — Market Momentum (20 pts)

Uses the oldest and newest `acquisition_market_observations` rows for the district to compute a quarterly CAGR:

```
quarterly_return = (psm_newest / psm_oldest)^(1 / quarters_elapsed) - 1
```

| Quarterly return | Points |
|---|---|
| ≥ +3% | 20 |
| 0% | 12 |
| −1% | 8 |
| −3% | 2 |
| ≤ −6% | 0 |

If only one data point exists (no trend), **8 pts** (neutral-negative, uncertainty penalty).

### P3 — Market Liquidity (15 pts)

Based on the latest quarter's `transaction_count` for the district. Uses a log₁₀ scale so thin markets aren't penalised linearly.

```
pts = 3 + round(12 × log10(txns + 1) / log10(251))
```

| Transaction count | Points |
|---|---|
| 250+ | 15 |
| 100 | ~13 |
| 50 | ~11 |
| 10 | ~8 |
| 0 / no data | 3 |

### P4 — Listing Evidence Quality (20 pts)

Rewards complete, verifiable listing data that makes deeper diligence possible.

| Signal | Points |
|---|---|
| `area_sqm` present | +5 |
| `bedroom_count` present | +4 |
| ≥3 real photos | +5 (≥1 photo: +2) |
| Price + area both available (PSM computable) | +3 |
| Live source URL | +3 |

Photo filter: excludes SVG, GIF, Bayut asset/placeholder logos (`/assets/my_bayut…`).

### P5 — Budget Position (15 pts)

How deep is the asking price within the mandate budget window? More headroom = more negotiation leverage.

```
headroom = (budget_max - asking_price) / (budget_max - budget_min)
pts = round(headroom × 15)
```

- Asking price above `budget_max`: **0 pts**
- No budget range configured: **7 pts** (neutral)

---

## Country normalization & currency

The scorer derives the country in this order: explicit `candidate.country_code`, single-element `mandate.target_country_codes`, default `SA`. The country selects:

- The district normalizer (`src/market/district-normalizers/{sa,ae,tr,gr,es}.js`) used for the ILIKE lookup against `acquisition_market_observations.district`.
- The country baseline (`src/market/country-baselines.js`) used for P3 liquidity saturation and the P1 suspicious-PSM floor.
- The default property type when the listing source omits it (apartment dominant in Dubai, villa in Greek islands, etc.).

Currency conversion lives in `src/market/fx.js`. Hard-coded SAR baselines (`SAR_BASELINES`) are refreshed manually each quarter against SAMA and major spot quotes. The `LAST_REFRESHED` constant in the module is the source of truth for the refresh date. Live FX is a planned cron and explicitly out of scope for the MVP.

> **Refresh process:** edit `SAR_BASELINES` and `LAST_REFRESHED` in `fx.js`; commit; redeploy the `zohal-backend` Cloud Run service. P2 (momentum) is a ratio and is therefore unaffected by stale FX; P1 and P5 absorb any drift, so a stale rate primarily distorts cross-country comparability, not internal ranking.

## District name normalisation

Listing sources emit district names in multiple forms:
- Saudi Arabia: clean Arabic (`"العارض"`), noisy Arabic with portal suffixes (`"العارض 87715769 - بيوت شاهد الفيديو"`), English transliterations (`"Al Arid"`).
- Other markets: mixed casing and diacritics (`"Beşiktaş"` / `"besiktas"`, `"Marbella oeste"`, `"αθηνα"` vs `"athens"`).

### Pipeline (in `src/market/investment-scorer.js`)

1. **Noise stripping** — chop at first digit run, dash/em-dash, parenthesis, or Latin-word start.
2. **Country-keyed lookup** — `getDistrictMap(country)` returns the country-specific `DISTRICT_EN_TO_AR` table. For SA the canonical form is Arabic; for AE/TR/GR/ES it is a canonical Latin label that matches the row stored in `acquisition_market_observations.district`.
3. **Arabic orthography normalisation** — only applied when the country is SA: remove diacritics, normalise alef variants (أإآ→ا), alef maqsura (ى→ي), taa marbuta (ة→ه).
4. **DB lookup** — `country_code` equality plus ILIKE `%normalized_term%` on `acquisition_market_observations.district`.

**To add a new district:** edit the appropriate country module under `src/market/district-normalizers/`. Each module exports a `DISTRICT_EN_TO_AR` map (the name is preserved for backwards-compatibility; for non-SA markets the value is the canonical Latin label).

---

## Storage

Scores are stored in `acquisition_opportunities.metadata_json`:

```json
{
  "investment_score": 63,
  "investment_score_breakdown": {
    "total": 63,
    "country_code": "SA",
    "country_label": "Saudi Arabia",
    "listing_currency": "SAR",
    "fx_rate_to_sar": 1,
    "breakdown": {
      "p1_price_efficiency": { "pts": 18, "max": 30, "deal_psm_sar": 9350, "market_avg_psm_sar": 7366, "ratio": 1.27 },
      "p2_market_momentum":  { "pts": 8,  "max": 20, "quarterly_return_pct": -0.71 },
      "p3_market_liquidity": { "pts": 13, "max": 15, "transaction_count": 218, "liquidity_saturation": 251 },
      "p4_evidence_quality": { "pts": 16, "max": 20, "details": { "area_sqm": 236 } },
      "p5_budget_position":  { "pts": 8,  "max": 15, "headroom_pct": 60, "listing_currency": "SAR", "budget_currency": "SAR", "fx_rate_to_sar": 1 },
      "p6_location_quality": { "pts": 9,  "max": 15 }
    },
    "market_district_matched": "العارض",
    "scored_at": "2026-05-11T05:38:00.000Z"
  }
}
```

The UI reads `metadata_json.investment_score` first; falls back to legacy `score`/`fit_score` keys for demo seeds.

---

## Backfilling existing deals

```bash
cd Zohal-web/services/zohal-backend

# Dry run (no writes):
node scripts/backfill-investment-scores.mjs \
  --workspace-id <cockpit-workspace-uuid> \
  --dry-run

# Apply:
node scripts/backfill-investment-scores.mjs \
  --workspace-id <cockpit-workspace-uuid>

# Re-score even if already scored:
node scripts/backfill-investment-scores.mjs \
  --workspace-id <cockpit-workspace-uuid> \
  --force
```

---

## Future roadmap

The following signals are planned but not yet in production:

| Signal | Pillar | Data needed |
|--------|--------|-------------|
| **Google Maps proximity** — distance to major roads, malls, hospitals | New P6 (~10 pts) | Google Maps Distance Matrix API |
| **Gross rental yield estimate** | New P7 (~10 pts) | District-level rental rate from market data or scraping |
| **Listing age / days-on-market** | P4 augmentation | Listing creation date from source metadata |
| **Image quality ML score** | P4 augmentation | Vision model on photo URLs |
| **Price history delta** | P1 augmentation | Multi-period price tracking on the same listing URL |
| **Renovation budget stress test** | P5 augmentation | Capex estimate from renovation agent |
| **Comparable sales distance** | P1 augmentation | Geo-spatial join with transaction records |

When implementing new pillars, re-weight proportionally so the total remains 0–100. Document anchor points and fallback values for missing data in this file.

---

## Files

| File | Role |
|---|---|
| `services/zohal-backend/src/market/investment-scorer.js` | Scorer core: normalization + 6 pillars, country-keyed |
| `services/zohal-backend/src/market/fx.js` | SAR FX baselines and `convertToSAR` helper |
| `services/zohal-backend/src/market/country-baselines.js` | Per-country defaults: default property type, liquidity saturation, PSM floor |
| `services/zohal-backend/src/market/district-normalizers/{sa,ae,tr,gr,es}.js` | Country-specific district lookup tables |
| `services/zohal-backend/src/handlers/acquisition.js` | Calls scorer in `promoteCandidate` |
| `services/zohal-backend/scripts/backfill-investment-scores.mjs` | CLI backfill tool |
| `src/app/(app)/workspaces/[id]/page.tsx` | UI reads `investment_score` via `rawScoreFor` |
