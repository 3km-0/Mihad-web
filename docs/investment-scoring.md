# Investment Quality Score (IQS)

> **Status:** Live as of May 2026. Computed at promotion time; backfillable for existing deals.

## Purpose

The Investment Quality Score answers: **"How good an investment is this deal — relative to the market?"**

The previous mandate-fit score only checked whether a listing _matched_ the buy-box (city / district / type / budget). If it passed all four filters it scored 100/100. Every real listing from a properly-tuned search run landed at 100 — no differentiation.

IQS replaces that with a 5-pillar system that compares each deal to **real market benchmarks** from `acquisition_market_observations`.

---

## Score range

**0 – 100 total**, composed of five pillars. Higher = better investment.

| Pillar | Weight | Data source |
|--------|--------|-------------|
| P1 — Price Efficiency vs Market | 30 pts | PSM vs district quarterly average |
| P2 — Market Momentum | 20 pts | Quarterly PSM trend, multi-period |
| P3 — Market Liquidity | 15 pts | Recent transaction count |
| P4 — Listing Evidence Quality | 20 pts | Completeness of scraped data |
| P5 — Budget Position | 15 pts | Headroom within mandate budget range |

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

## District name normalisation

Listing sources emit district names in multiple forms:
- Clean Arabic: `"العارض"`
- Noisy Arabic (Bayut): `"العارض 87715769 - بيوت شاهد الفيديو"` → stripped to `"العارض"`
- English transliterations (from mandate buy box): `"Al Arid"` → mapped to `"العارض"`

### Pipeline (in `src/market/investment-scorer.js`)

1. **Noise stripping** — chop at first digit run, dash/em-dash, parenthesis, or Latin-word start
2. **Arabic orthography normalisation** — remove diacritics, normalise alef variants (أإآ→ا), alef maqsura (ى→ي), taa marbuta (ة→ه)
3. **English→Arabic dictionary** — `DISTRICT_EN_TO_AR` maps ~40 common Riyadh transliteration variants to their canonical Arabic forms
4. **DB lookup** — ILIKE `%normalized_term%` on `acquisition_market_observations.district`

**To add a new district:** extend `DISTRICT_EN_TO_AR` in `investment-scorer.js` with both the exact transliteration and common spelling variants.

---

## Storage

Scores are stored in `acquisition_opportunities.metadata_json`:

```json
{
  "investment_score": 63,
  "investment_score_breakdown": {
    "total": 63,
    "breakdown": {
      "p1_price_efficiency": { "pts": 18, "max": 30, "deal_psm": 9350, "market_avg_psm": 7366, "ratio": 1.27 },
      "p2_market_momentum":  { "pts": 8,  "max": 20, "quarterly_return_pct": -0.71, ... },
      "p3_market_liquidity": { "pts": 13, "max": 15, "transaction_count": 218 },
      "p4_evidence_quality": { "pts": 16, "max": 20, "details": { "area_sqm": 236, ... } },
      "p5_budget_position":  { "pts": 8,  "max": 15, "headroom_pct": 60 }
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
| `services/zohal-backend/src/market/investment-scorer.js` | Scorer core: normalization + 5 pillars |
| `services/zohal-backend/src/handlers/acquisition.js` | Calls scorer in `promoteCandidate` |
| `services/zohal-backend/scripts/backfill-investment-scores.mjs` | CLI backfill tool |
| `src/app/(app)/workspaces/[id]/page.tsx` | UI reads `investment_score` via `rawScoreFor` |
