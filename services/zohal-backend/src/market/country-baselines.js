/**
 * Per-country baselines used by the cross-border IQS scorer.
 *
 * - `defaultPropertyType` is the dominant property type when the listing source
 *   does not provide one (Dubai = apartment, Greek islands = villa, etc.).
 * - `liquidityScale` gives the saturation transaction count that maps to the
 *   top of P3. Riyadh sees ~250 txns/quarter in tier-1 districts; Athens runs
 *   thinner; Spanish coastal markets are seasonal.
 * - `psmFloorSAR` flags listings whose SAR-normalized PSM falls below this
 *   value as suspect (often plot-area errors in scrapers).
 */

const COUNTRY_BASELINES = Object.freeze({
  SA: {
    defaultPropertyType: "villa",
    liquidityScale: 251,
    psmFloorSAR: 2500,
    label: "Saudi Arabia",
  },
  AE: {
    defaultPropertyType: "apartment",
    liquidityScale: 200,
    psmFloorSAR: 4000,
    label: "United Arab Emirates",
  },
  TR: {
    defaultPropertyType: "apartment",
    liquidityScale: 180,
    psmFloorSAR: 1500,
    label: "Türkiye",
  },
  GR: {
    defaultPropertyType: "villa",
    liquidityScale: 120,
    psmFloorSAR: 5000,
    label: "Greece",
  },
  ES: {
    defaultPropertyType: "apartment",
    liquidityScale: 150,
    psmFloorSAR: 5500,
    label: "Spain",
  },
});

const DEFAULT_BASELINE = COUNTRY_BASELINES.SA;

export function getCountryBaseline(countryCode) {
  if (!countryCode) return DEFAULT_BASELINE;
  const code = String(countryCode).trim().toUpperCase();
  return COUNTRY_BASELINES[code] ?? DEFAULT_BASELINE;
}

export function listSupportedCountries() {
  return Object.keys(COUNTRY_BASELINES);
}
