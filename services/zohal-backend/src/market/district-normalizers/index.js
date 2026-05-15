/**
 * Country-keyed district normalizer registry for the cross-border IQS scorer.
 *
 * Each country module exports DISTRICT_EN_TO_AR — the key name is preserved
 * for legacy compatibility (the Saudi map used Arabic targets). For non-SA
 * markets the "AR" target is actually the canonical Latin label stored in
 * `acquisition_market_observations.district`.
 */

import { DISTRICT_EN_TO_AR as SA } from "./sa.js";
import { DISTRICT_EN_TO_AR as AE } from "./ae.js";
import { DISTRICT_EN_TO_AR as TR } from "./tr.js";
import { DISTRICT_EN_TO_AR as GR } from "./gr.js";
import { DISTRICT_EN_TO_AR as ES } from "./es.js";

const REGISTRY = Object.freeze({
  SA,
  AE,
  TR,
  GR,
  ES,
});

export function getDistrictMap(countryCode) {
  if (!countryCode) return SA;
  const code = String(countryCode).trim().toUpperCase();
  return REGISTRY[code] ?? SA;
}

export function listSupportedCountries() {
  return Object.keys(REGISTRY);
}
