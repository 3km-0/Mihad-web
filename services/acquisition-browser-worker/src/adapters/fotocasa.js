// Fotocasa (Spain) browsing adapter.
//
// Public URL shapes used:
//   Search: https://www.fotocasa.es/es/comprar/{segment}/{city}/todas-las-zonas/l
//   Detail: https://www.fotocasa.es/es/comprar/vivienda/{city}/{features}/{id}/d
//
// Notes for operators:
// - Fotocasa serves a server-rendered HTML page that embeds the full
//   `realEstate` object for the active listing inline (price, surface,
//   rooms, lat/lng, address). The search page embeds a `realEstates`
//   array. We rely on those inline JSON fragments rather than client-side
//   hydration.
// - Fotocasa does NOT use DataDome / aggressive bot challenges at the
//   public search endpoints (verified Friday May 15, 2026). If that
//   changes we record `drift_signal: cards_seen_but_no_candidates_created`
//   and the operator should rotate to a fallback ES portal.
// - All prices are in EUR. Some listings expose only ranges (rentals etc);
//   we ignore those and rely on the strict numeric `price` field.

import {
  absoluteUrl,
  applyLocationMetadata,
  candidateFromTextWithLocale,
  chooseBestLocationMetadata,
  detectContactGate,
  detectVisibleContact,
  extractLocationMetadata,
  extractPhotoRefs,
  normalizeText,
  stripTags,
} from "./shared.js";

const BASE_URL = "https://www.fotocasa.es";

function buyBox(mandate = {}) {
  return mandate.buy_box_json && typeof mandate.buy_box_json === "object" ? mandate.buy_box_json : {};
}

function locationsList(mandate = {}) {
  return Array.isArray(mandate.target_locations_json) ? mandate.target_locations_json : [];
}

function asciiSlug(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function citySlug(mandate = {}) {
  const box = buyBox(mandate);
  const candidates = [box.city, box.district, locationsList(mandate)[0], mandate.target_city];
  for (const candidate of candidates) {
    const slug = asciiSlug(candidate);
    if (slug) return slug;
  }
  return "madrid";
}

function propertySegment(mandate = {}) {
  // Fotocasa segments map asset type to URL slugs:
  //   /comprar/viviendas/            general homes-for-sale (default)
  //   /comprar/casas-y-villas/       houses + villas
  //   /comprar/locales/              commercial
  //   /comprar/terrenos/             land
  const value = normalizeText(buyBox(mandate).property_type || buyBox(mandate).asset_type || "").toLowerCase();
  if (/villa|house|chalet|casa/i.test(value)) return "casas-y-villas";
  if (/commercial|retail|office|local/i.test(value)) return "locales";
  if (/land|plot|terreno/i.test(value)) return "terrenos";
  return "viviendas";
}

function fotocasaSearchPath(mandate = {}) {
  return `/es/comprar/${propertySegment(mandate)}/${citySlug(mandate)}/todas-las-zonas/l`;
}

function buildSearchUrl(mandate, limits = {}) {
  const url = new URL(fotocasaSearchPath(mandate), BASE_URL);
  const box = buyBox(mandate);
  const minPrice = Number(box.budget_min_native ?? box.budget_min_eur ?? box.budget_min ?? NaN);
  const maxPrice = Number(box.budget_max_native ?? box.budget_max_eur ?? box.budget_max ?? NaN);
  if (Number.isFinite(minPrice) && minPrice > 0) url.searchParams.set("precioMin", String(Math.round(minPrice)));
  if (Number.isFinite(maxPrice) && maxPrice > 0) url.searchParams.set("precioMax", String(Math.round(maxPrice)));
  if (limits.page && Number(limits.page) > 1) {
    // Fotocasa pagination uses a /N path suffix on the search path.
    url.pathname = `${url.pathname}/${Number(limits.page)}`;
  }
  return url.toString();
}

// Extract listing detail URLs from the search HTML. Fotocasa embeds them
// in both the rendered HTML and the inline `realEstates` array; the URL
// shape `/comprar/vivienda/{city}/{features}/{numeric-id}` is stable.
function extractListingUrls(html) {
  const seen = new Set();
  const out = [];
  const pattern = /\/(?:es\/)?comprar\/(?:vivienda|casa|piso|atico|chalet|local|terreno)\/[a-z0-9-]+\/[a-z0-9-]+\/(\d{6,})(?:\/d)?/gi;
  let match;
  while ((match = pattern.exec(html))) {
    // Normalise to canonical `/es/comprar/{segment}/{city}/{features}/{id}/d`.
    const raw = match[0];
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const canonical = raw.startsWith("/es/") ? raw : `/es${raw.startsWith("/") ? "" : "/"}${raw}`;
    out.push(canonical.endsWith("/d") ? canonical : `${canonical}/d`);
    if (out.length >= 60) break;
  }
  return out;
}

// Pull a numeric field from an inline JSON object using the field name as
// an anchor. Returns null if the field is missing or non-numeric.
function pickNumber(text, fieldName) {
  const re = new RegExp(`"${fieldName}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`);
  const match = String(text || "").match(re);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function pickString(text, fieldName) {
  const re = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const match = String(text || "").match(re);
  if (!match) return null;
  // Decode the JS-escaped fragment back to a usable string.
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1];
  }
}

// Extract the substring containing the active listing's `realEstate`
// JSON object by walking balanced braces. The detail page may have
// `district` / `city` keys outside this block (related listings,
// breadcrumbs) — scoping reads to the realEstate object avoids those
// false positives.
function extractRealEstateBlock(html) {
  const text = String(html || "");
  const marker = '"realEstate":{';
  const start = text.indexOf(marker);
  if (start < 0) return null;
  let depth = 0;
  let i = start + marker.length - 1;
  let inString = false;
  let escape = false;
  for (; i < text.length; i += 1) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start + marker.length - 1, i + 1);
    }
    // Safety bound: realEstate blocks are typically <30KB. If we
    // walk further than 80KB without closing, bail out and let
    // callers fall back to text-regex extraction.
    if (i - start > 80_000) return null;
  }
  return null;
}

function extractRealEstateAddress(scope) {
  const district =
    pickString(scope, "district") ||
    pickString(scope, "districtName") ||
    null;
  const neighborhood =
    pickString(scope, "neighborhood") ||
    pickString(scope, "neighbourhood") ||
    null;
  const city = pickString(scope, "city") || pickString(scope, "municipality") || null;
  const province = pickString(scope, "province") || null;
  return { district, neighborhood, city, province };
}

export const FotocasaBrowsingAdapter = {
  source: "fotocasa",
  countryCode: "ES",
  defaultCurrency: "EUR",
  buildSearchUrl,
  async applySearchFilters(page, mandate, limits = {}) {
    // Public path navigation with query params is the most reliable
    // approach. Fotocasa's filter UI is a heavy SPA that's slower than
    // just reading the SSR'd results page.
    const url = buildSearchUrl(mandate, limits);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: limits.per_source_timeout_ms });
    await page.waitForTimeout(700);
    return {
      url: page.url(),
      html: await page.content(),
      mode: "public_path",
      warnings: [],
    };
  },
  parseSearchResults(html, baseUrl = BASE_URL) {
    const stripped = stripTags(html);
    if (/0 resultados|no hay resultados|no results found/i.test(stripped)) return [];
    const urls = extractListingUrls(html);
    return urls.slice(0, 30).map((path) => ({
      source: "fotocasa",
      source_url: absoluteUrl(path, baseUrl),
      title: "Fotocasa listing",
    }));
  },
  parseListingDetail(html, url, context = {}) {
    const titleMatch = String(html || "").match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = stripTags(titleMatch ? titleMatch[1] : "") || "Fotocasa listing";
    const text = stripTags(html);
    const candidate = candidateFromTextWithLocale({
      source: "fotocasa",
      sourceUrl: absoluteUrl(url, BASE_URL),
      title,
      text,
      countryCode: "ES",
      defaultCurrency: "EUR",
    });
    // Fotocasa exposes structured fields inline. Scope reads to the
    // active `realEstate` JSON block so we don't pick up stray
    // `district`/`city` values from breadcrumbs or related-listing
    // widgets elsewhere on the page.
    const scope = extractRealEstateBlock(html) || html;
    const price = pickNumber(scope, "price");
    if (price && price > 0) {
      candidate.asking_price = String(price);
      candidate.limited_evidence_snapshot_json = {
        ...candidate.limited_evidence_snapshot_json,
        asking_price_native: price,
        currency: "EUR",
      };
    }
    const surface = pickNumber(scope, "surface");
    if (surface && surface > 0) candidate.area_sqm = surface;
    const rooms = pickNumber(scope, "rooms");
    if (rooms && rooms > 0) candidate.bedroom_count = rooms;
    const bathrooms = pickNumber(scope, "bathrooms");
    if (bathrooms && bathrooms > 0) candidate.bathroom_count = bathrooms;
    const address = extractRealEstateAddress(scope);
    if (address.district) candidate.district = address.district;
    else if (address.neighborhood) candidate.district = address.neighborhood;
    if (address.city) candidate.city = address.city;
    applyLocationMetadata(candidate, chooseBestLocationMetadata([
      ...(Array.isArray(context.location_hints) ? context.location_hints : []),
      extractLocationMetadata(html, {
        source: "listing_json",
        district: candidate.district,
        city: candidate.city,
        address: address.neighborhood
          ? `${address.neighborhood}${address.city ? `, ${address.city}` : ""}`
          : candidate.address,
      }),
    ]));
    candidate.photo_refs_json = extractPhotoRefs(html, BASE_URL, 8);
    if (detectContactGate(html)) {
      candidate.limited_evidence_snapshot_json = {
        ...candidate.limited_evidence_snapshot_json,
        contact_access: {
          status: "requires_sign_in",
          reason: "broker_contact_gated",
        },
      };
      candidate.contact_access_json = candidate.limited_evidence_snapshot_json.contact_access;
    } else {
      const visibleContact = detectVisibleContact(html);
      if (visibleContact) {
        candidate.limited_evidence_snapshot_json = {
          ...candidate.limited_evidence_snapshot_json,
          contact_access: visibleContact,
        };
        candidate.contact_access_json = candidate.limited_evidence_snapshot_json.contact_access;
      }
    }
    return candidate;
  },
};
