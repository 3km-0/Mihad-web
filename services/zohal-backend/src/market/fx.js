/**
 * Foreign exchange normalization for the cross-border IQS scorer.
 *
 * Mihad price comparisons happen in SAR so that buy-box headroom, momentum, and
 * price efficiency can be compared across UAE, Turkey, Greece, Spain, and Saudi
 * Arabia on a common scale. For MVP we ship hard-coded SAR baselines; live FX
 * is a later cron-driven enhancement.
 *
 * Refresh cadence: rates are refreshed manually each quarter against published
 * Saudi Central Bank (SAMA) and major spot quotes. See
 * `Zohal-web/docs/investment-scoring.md` for the documented refresh process.
 */

const SAR_BASELINES = Object.freeze({
  SAR: 1,
  AED: 1.02,
  EUR: 4.04,
  TRY: 0.105,
  USD: 3.75,
  GBP: 4.7,
});

const LAST_REFRESHED = "2026-05-15";

export function listSupportedCurrencies() {
  return Object.keys(SAR_BASELINES);
}

export function getFxRateToSAR(currency) {
  if (!currency) return 1;
  const code = String(currency).trim().toUpperCase();
  return SAR_BASELINES[code] ?? null;
}

/**
 * Convert an arbitrary cash value to SAR. Returns null if the currency is not
 * supported or the value is invalid. Callers should treat a null as a signal
 * to fall back to the no-FX behaviour rather than silently scoring a zero.
 */
export function convertToSAR(value, currency) {
  if (value == null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const rate = getFxRateToSAR(currency);
  if (rate == null) return null;
  return numeric * rate;
}

export function fxBaselineMeta() {
  return {
    last_refreshed: LAST_REFRESHED,
    baselines: { ...SAR_BASELINES },
    base_currency: "SAR",
  };
}
