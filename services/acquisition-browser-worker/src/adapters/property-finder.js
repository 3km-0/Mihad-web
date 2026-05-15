// Property Finder browsing adapter.
// Covers UAE (propertyfinder.ae) and Saudi Arabia (propertyfinder.sa) for
// the Mihad MVP. Other Property Finder domains (Qatar, Bahrain, Egypt) can
// be added by extending the host selection in pickBaseUrl().
//
// Public URL shape:
//   https://www.propertyfinder.ae/en/search?l=1&c=1&fu=0&rp=y
//   https://www.propertyfinder.sa/en/search?c=1
//
// Listing detail URLs:
//   https://www.propertyfinder.ae/en/plp/buy-properties-for-sale-{id}.html
//
// Currency:
//   AE → AED, SA → SAR. Currency is recorded in the snapshot for
//   IQS conversion to SAR via fx.js.

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

const HOSTS = {
  AE: "https://www.propertyfinder.ae",
  SA: "https://www.propertyfinder.sa",
};

const DEFAULT_CURRENCY = {
  AE: "AED",
  SA: "SAR",
};

function buyBox(mandate = {}) {
  return mandate.buy_box_json && typeof mandate.buy_box_json === "object" ? mandate.buy_box_json : {};
}

function targetCountries(mandate = {}) {
  if (Array.isArray(mandate.target_country_codes) && mandate.target_country_codes.length > 0) {
    return mandate.target_country_codes
      .map((code) => String(code || "").toUpperCase())
      .filter((code) => HOSTS[code]);
  }
  return [];
}

function pickCountryCode(mandate = {}) {
  const targets = targetCountries(mandate);
  if (targets.length > 0) return targets[0];
  // Default to UAE for cross-border buyers; SA buyers fall through aqar/bayut.
  return "AE";
}

function pickBaseUrl(mandate = {}) {
  return HOSTS[pickCountryCode(mandate)] || HOSTS.AE;
}

function searchPath(mandate = {}) {
  // c=1 → for sale. fu=0 → unfurnished filter off. rp=y → results paginated.
  const box = buyBox(mandate);
  const params = new URLSearchParams();
  params.set("c", "1");
  if (box.property_type) {
    const value = String(box.property_type).toLowerCase();
    if (/apartment|flat|شقة/.test(value)) params.set("t", "1");
    else if (/villa|townhouse|فيلا/.test(value)) params.set("t", "35");
    else if (/land|plot|أرض/.test(value)) params.set("t", "5");
  }
  return `/en/search?${params.toString()}`;
}

export const PropertyFinderBrowsingAdapter = {
  source: "property_finder",
  countryCode: "AE",
  defaultCurrency: "AED",
  buildSearchUrl(mandate, limits = {}) {
    const baseUrl = pickBaseUrl(mandate);
    const url = new URL(searchPath(mandate), baseUrl);
    if (limits.page && Number(limits.page) > 1) {
      url.searchParams.set("page", String(limits.page));
    }
    return url.toString();
  },
  async applySearchFilters(page, mandate, limits = {}) {
    const baseUrl = pickBaseUrl(mandate);
    const url = new URL(searchPath(mandate), baseUrl).toString();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: limits.per_source_timeout_ms });
    await page.waitForTimeout(800);
    return {
      url: page.url(),
      html: await page.content(),
      mode: "public_path",
      warnings: [],
    };
  },
  parseSearchResults(html, baseUrl = HOSTS.AE) {
    const stripped = stripTags(html);
    if (/no properties|no results|0 results/i.test(stripped)) return [];
    const seen = new Set();
    return extractLinks(html, baseUrl, /propertyfinder\.(ae|sa|qa|bh|eg)/i)
      .filter((link) => /\/plp\/[a-z0-9-]*-\d{4,}\.html?(?:$|[?#])/i.test(link.url))
      .filter((link) => {
        if (seen.has(link.url)) return false;
        seen.add(link.url);
        return true;
      })
      .slice(0, 30)
      .map((link) => ({
        source: "property_finder",
        source_url: link.url,
        title: normalizeText(link.text) || "Property Finder listing",
      }));
  },
  parseListingDetail(html, url, context = {}) {
    const titleMatch = String(html || "").match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = stripTags(titleMatch ? titleMatch[1] : "") || "Property Finder listing";
    const text = stripTags(html);
    const parsed = new URL(url, HOSTS.AE);
    const host = parsed.host;
    const countryCode = host.endsWith(".sa") ? "SA" : host.endsWith(".qa") ? "QA" : host.endsWith(".bh") ? "BH" : host.endsWith(".eg") ? "EG" : "AE";
    const defaultCurrency = DEFAULT_CURRENCY[countryCode] || "AED";
    const candidate = candidateFromTextWithLocale({
      source: "property_finder",
      sourceUrl: absoluteUrl(url, HOSTS.AE),
      title,
      text,
      countryCode,
      defaultCurrency,
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
    candidate.photo_refs_json = extractPhotoRefs(html, HOSTS.AE, 8);
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
