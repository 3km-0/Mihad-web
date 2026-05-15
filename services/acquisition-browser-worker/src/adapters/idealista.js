// Idealista (Spain) browsing adapter.
// Public URL shape used: https://www.idealista.com/en/venta-viviendas/{city}/
// Listing detail URLs: https://www.idealista.com/en/inmueble/{id}/
//
// Notes for operators:
// - Idealista heavily uses bot detection. This adapter sticks to public
//   listing/search pages and avoids any authenticated session. If
//   listings are gated we record contact_access=requires_sign_in and
//   move on; we do NOT attempt to scrape phone/email.
// - Prices on idealista.com use European thousand separators
//   (e.g. "650.000 €"). parsePriceWithCurrency handles this.
// - Detail URLs include a stable numeric id used for fingerprinting.

import {
  absoluteUrl,
  applyLocationMetadata,
  candidateFromTextWithLocale,
  chooseBestLocationMetadata,
  detectContactGate,
  detectVisibleContact,
  extractLocationMetadata,
  extractLinks,
  extractPhotoRefs,
  normalizeText,
  stripTags,
} from "./shared.js";

const BASE_URL = "https://www.idealista.com";

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
  const value = normalizeText(buyBox(mandate).property_type || "").toLowerCase();
  // Idealista uses /en/venta-viviendas/ for homes-for-sale broadly, and
  // /en/venta-locales/ for commercial. Default to homes.
  if (/commercial|retail|office|local/i.test(value)) return "venta-locales";
  if (/land|plot|terreno/i.test(value)) return "venta-suelo";
  return "venta-viviendas";
}

function idealistaSearchPath(mandate = {}) {
  return `/en/${propertySegment(mandate)}/${citySlug(mandate)}/`;
}

export const IdealistaBrowsingAdapter = {
  source: "idealista",
  countryCode: "ES",
  defaultCurrency: "EUR",
  buildSearchUrl(mandate, limits = {}) {
    const url = new URL(idealistaSearchPath(mandate), BASE_URL);
    if (limits.page && Number(limits.page) > 1) {
      url.pathname = `${url.pathname}pagina-${Number(limits.page)}.htm`;
    }
    return url.toString();
  },
  async applySearchFilters(page, mandate, limits = {}) {
    // Idealista's search UI is brittle and gated by anti-bot challenges.
    // Public path navigation is the most reliable approach.
    const url = new URL(idealistaSearchPath(mandate), BASE_URL).toString();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: limits.per_source_timeout_ms });
    await page.waitForTimeout(800);
    return {
      url: page.url(),
      html: await page.content(),
      mode: "public_path",
      warnings: [],
    };
  },
  parseSearchResults(html, baseUrl = BASE_URL) {
    const stripped = stripTags(html);
    if (/no hay resultados|no results|0 anuncios|0 listings/i.test(stripped)) return [];
    const seen = new Set();
    return extractLinks(html, baseUrl, /idealista\.com/i)
      .filter((link) => /\/inmueble\/\d+\/?$/i.test(link.url))
      .filter((link) => {
        if (seen.has(link.url)) return false;
        seen.add(link.url);
        return true;
      })
      .slice(0, 30)
      .map((link) => ({
        source: "idealista",
        source_url: link.url,
        title: normalizeText(link.text) || "Idealista listing",
      }));
  },
  parseListingDetail(html, url, context = {}) {
    const titleMatch = String(html || "").match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = stripTags(titleMatch ? titleMatch[1] : "") || "Idealista listing";
    const text = stripTags(html);
    const candidate = candidateFromTextWithLocale({
      source: "idealista",
      sourceUrl: absoluteUrl(url, BASE_URL),
      title,
      text,
      countryCode: "ES",
      defaultCurrency: "EUR",
    });
    applyLocationMetadata(candidate, chooseBestLocationMetadata([
      ...(Array.isArray(context.location_hints) ? context.location_hints : []),
      extractLocationMetadata(html, {
        source: "listing_json",
        district: candidate.district,
        city: candidate.city,
        address: candidate.address,
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
