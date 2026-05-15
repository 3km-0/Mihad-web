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
    // Property Finder is fronted by AWS WAF Bot Control, which issues a
    // JS challenge (HTTP 202 with `x-amzn-waf-action: challenge`) on
    // first request. Chromium clears it in ~3-6 seconds.
    //
    // We deliberately avoid `waitUntil: "networkidle"` here because PF
    // pages keep loading analytics/CMP beacons indefinitely and never
    // reach idle. Instead we wait until listing anchors appear in the
    // DOM (the WAF challenge has cleared at that point) and pad a
    // small safety margin before snapshotting.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: limits.per_source_timeout_ms });
    try {
      await page.waitForSelector("a[href*='/plp/']", { timeout: 12_000 });
    } catch {
      // Best-effort: WAF challenge or empty results. Continue and let
      // parseSearchResults emit a drift signal if cards_seen=0.
    }
    await page.waitForTimeout(1200);
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
    // Detail URL shapes accepted (Property Finder rolled out a `/buy/`
    // path segment around 2026; both shapes still resolve):
    //   /en/plp/apartment-for-sale-...-12345678.html         (legacy)
    //   /en/plp/buy/apartment-for-sale-...-12345678.html     (current)
    // We allow `/` and `-` inside the slug and anchor on a trailing
    // numeric listing id immediately before the `.html` extension.
    return extractLinks(html, baseUrl, /propertyfinder\.(ae|sa|qa|bh|eg)/i)
      .filter((link) => /\/plp\/(?:[\w/-]+\/)?[\w-]+-\d{6,}\.html?(?:$|[?#])/i.test(link.url))
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
    // Start with a text-regex candidate so we have a baseline if the
    // Next.js payload is absent (older revisions, partial WAF render).
    const candidate = candidateFromTextWithLocale({
      source: "property_finder",
      sourceUrl: absoluteUrl(url, HOSTS.AE),
      title,
      text,
      countryCode,
      defaultCurrency,
    });

    // Preferred path: PF embeds the full listing payload in a Next.js
    // hydration script. It contains canonical price/size/location data
    // and avoids the text-regex bugs (e.g. "Handover 2026" being read
    // as an area, listing tower prefix bleeding into city). When this
    // succeeds we overwrite the corresponding text-derived fields.
    const structured = extractPropertyFinderNextData(html);
    if (structured) {
      applyPropertyFinderStructured(candidate, structured, defaultCurrency);
    }
    // URL slug is a deterministic secondary signal for city/community
    // (PF slugs follow apartment-for-sale-{city}-{community}-...). Use
    // it only to fill gaps left by structured data.
    applyPropertyFinderUrlSlug(candidate, url);

    // If structured data already gave us exact coordinates we trust it
    // (PF's NEXT_DATA coords are authoritative). Otherwise fall back
    // to the worker's generic location hint extractor.
    if (candidate.location_source !== "property_finder_next_data") {
      applyLocationMetadata(candidate, chooseBestLocationMetadata([
        ...(Array.isArray(context.location_hints) ? context.location_hints : []),
        extractLocationMetadata(html, {
          source: "listing_json",
          district: candidate.district,
          city: candidate.city,
          address: candidate.address,
        }),
      ]));
    }

    // Photo extraction: prefer the structured `property.images.property[]`
    // array from NEXT_DATA. The generic `extractPhotoRefs` (used as a
    // fallback) walks every <img>/srcset on the page and ends up
    // picking PF's nav-header banner before the actual listing photos
    // - which makes every cockpit card render with the same hero
    // image. Filter out PF site assets and agent logos defensively.
    const structuredPhotos = structured ? extractPropertyFinderPhotos(structured) : null;
    if (structuredPhotos && structuredPhotos.length > 0) {
      candidate.photo_refs_json = structuredPhotos.slice(0, 8);
    } else {
      candidate.photo_refs_json = filterListingPhotos(extractPhotoRefs(html, HOSTS.AE, 12)).slice(0, 8);
    }
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

// PF embeds three asset paths that the generic <img> walker keeps
// picking up before any real listing photo:
//   growth.propertyfinder.com/static/...        (site-wide nav banners)
//   media/images/client_logos/...                (agent branding chip)
//   /icons/, /static/, /assets/                  (UI furniture)
// They render as the hero image in every cockpit card, which is what
// makes five distinct listings look identical at a glance. This
// filter is intentionally allowlist-friendly: anything served from
// PF's listing CDN (static.shared.propertyfinder.ae/media/images/listing
// or graph-images.propertyfinder.ae or new-projects-media.propertyfinder.com)
// passes through.
const PHOTO_REJECT_PATTERNS = [
  /growth\.propertyfinder\.com\/static\//i,
  /\/nav_header_banner/i,
  /\/client_logos\//i,
  /\/icons\//i,
  /\/static\//i,
  /\/assets\//i,
];

export function filterListingPhotos(urls) {
  if (!Array.isArray(urls)) return [];
  return urls.filter((url) => {
    const str = String(url || "");
    if (!str) return false;
    return !PHOTO_REJECT_PATTERNS.some((pattern) => pattern.test(str));
  });
}

// Extracts the canonical listing photo URLs from PF's NEXT_DATA
// `property.images` payload. Real shape (verified):
//   property.images = {
//     property: [
//       { small, medium, full, thumbnail, classification_label, ... },
//       ...
//     ],
//     // sometimes also: floor_plans, agent_logo, etc.
//   }
// We prefer the `medium` (~668x452) variant because that's what the
// cockpit card thumbnail expects, and fall back through full → small
// → thumbnail so a partial payload still yields one URL per photo.
export function extractPropertyFinderPhotos(property) {
  if (!property || typeof property !== "object") return null;
  const raw = property.images;
  let list = null;
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object" && Array.isArray(raw.property)) {
    list = raw.property;
  } else {
    return null;
  }
  const urls = [];
  for (const entry of list) {
    if (!entry) continue;
    if (typeof entry === "string") {
      urls.push(entry);
      continue;
    }
    const candidate = entry.medium || entry.full || entry.small || entry.thumbnail || entry.url;
    if (candidate) urls.push(String(candidate));
  }
  return filterListingPhotos(urls);
}

// Pulls the Next.js hydration payload out of a Property Finder detail
// page. Returns null if the script tag is missing or unparseable so
// callers can fall back to text parsing.
export function extractPropertyFinderNextData(html) {
  const match = String(html || "").match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    const property = data?.props?.pageProps?.propertyResult?.property;
    return property && typeof property === "object" ? property : null;
  } catch {
    return null;
  }
}

// Overlays canonical fields from PF's NEXT_DATA `property` object onto
// a candidate built from text. Each field is guarded so partial
// payloads (e.g. price hidden behind broker sign-in) only fill what
// they actually contain.
export function applyPropertyFinderStructured(candidate, property, defaultCurrency = "AED") {
  if (!property || typeof property !== "object") return;

  const priceValue = property?.price?.value;
  if (Number.isFinite(Number(priceValue)) && Number(priceValue) > 0) {
    candidate.asking_price = String(Number(priceValue));
    const currency = String(property?.price?.currency || defaultCurrency).toUpperCase();
    candidate.limited_evidence_snapshot_json = {
      ...candidate.limited_evidence_snapshot_json,
      currency,
      price_source: "property_finder_next_data",
    };
  }

  const sizeUnit = String(property?.size?.unit || "").toLowerCase();
  const sizeValue = Number(property?.size?.value);
  if (Number.isFinite(sizeValue) && sizeValue > 0) {
    // PF stores area in sqft for UAE; convert to sqm so downstream
    // baselines (price per sqm) stay consistent across countries.
    if (sizeUnit === "sqft" || sizeUnit === "ft2") {
      candidate.area_sqm = Math.round(sizeValue * 0.092903);
    } else {
      candidate.area_sqm = Math.round(sizeValue);
    }
  } else if (candidate.area_sqm && candidate.area_sqm >= 1900 && candidate.area_sqm <= 2100) {
    // Heuristic cleanup: text-regex sometimes captures a 4-digit year
    // like "Handover 2026" as area. If structured data is missing but
    // the prior value looks like a year, drop it instead of misleading
    // the IQS calculator.
    candidate.area_sqm = null;
  }

  if (Number.isFinite(Number(property.bedrooms)) && Number(property.bedrooms) >= 0) {
    candidate.bedroom_count = Number(property.bedrooms);
  }
  if (Number.isFinite(Number(property.bathrooms)) && Number(property.bathrooms) >= 0) {
    candidate.bathroom_count = Number(property.bathrooms);
  }

  if (property.property_type && !candidate.property_type) {
    candidate.property_type = String(property.property_type).toLowerCase();
  }

  // Location payload shape (verified against propertyfinder.ae):
  //   location.path_name = "Dubai, Jumeirah, Jumeirah Bay Island, Bulgari Resort & Residences"
  //   location.full_name = "Bulgari Resort & Residences 6, Bulgari Resort & Residences, Jumeirah Bay Island, Jumeirah, Dubai"
  //   location.coordinates = { lat, lon }
  // path_name is ordered city -> ... -> tower; we want the FIRST
  // segment as city and the most-specific named segment as district.
  const loc = property.location;
  if (loc && typeof loc === "object") {
    const pathName = String(loc.path_name || "").trim();
    if (pathName) {
      const parts = pathName.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 1) candidate.city = parts[0];
      if (parts.length >= 3) candidate.district = parts[2];
      else if (parts.length >= 2) candidate.district = parts[1];
    }
    if (!candidate.address && loc.full_name) {
      candidate.address = String(loc.full_name);
    }
    const lat = Number(loc?.coordinates?.lat);
    const lon = Number(loc?.coordinates?.lon ?? loc?.coordinates?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      candidate.latitude = lat;
      candidate.longitude = lon;
      candidate.location_precision = "exact";
      candidate.location_source = "property_finder_next_data";
    }
  }
}

// Slug fallback for when NEXT_DATA is unavailable or missing the
// location object. PF slugs are highly structured:
//   /plp/buy/apartment-for-sale-{city}-{district}[-{sub}]-{tower}-{id}.html
// We extract city + district by walking the slug tokens between the
// asset prefix and the trailing numeric id. This is intentionally
// conservative: we only fill `candidate.city` / `candidate.district`
// if they are still empty after structured extraction.
export function applyPropertyFinderUrlSlug(candidate, url) {
  if (candidate.city && candidate.district) return;
  let pathname = "";
  try {
    pathname = new URL(url, HOSTS.AE).pathname;
  } catch {
    return;
  }
  const match = pathname.match(/\/plp\/(?:buy\/)?([a-z0-9-]+?)-\d{6,}\.html?$/i);
  if (!match) return;
  const slug = match[1];
  const assetMatch = slug.match(/^(apartment|villa|townhouse|land|plot|penthouse|duplex|studio|hotel-apartment)-for-(sale|rent)-(.+)$/);
  const remainder = assetMatch ? assetMatch[3] : slug;
  const tokens = remainder.split("-").filter(Boolean);
  if (tokens.length === 0) return;
  const KNOWN_CITIES = new Set([
    "dubai",
    "abu-dhabi",
    "abudhabi",
    "sharjah",
    "ajman",
    "ras-al-khaimah",
    "fujairah",
    "umm-al-quwain",
    "al-ain",
    "riyadh",
    "jeddah",
    "dammam",
    "khobar",
    "mecca",
    "medina",
  ]);
  let cityToken = tokens[0];
  let remainingStart = 1;
  if (cityToken === "abu" && tokens[1] === "dhabi") {
    cityToken = "abu-dhabi";
    remainingStart = 2;
  } else if (cityToken === "ras" && tokens[1] === "al" && tokens[2] === "khaimah") {
    cityToken = "ras-al-khaimah";
    remainingStart = 3;
  }
  if (KNOWN_CITIES.has(cityToken)) {
    if (!candidate.city) {
      candidate.city = cityToken
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
    if (!candidate.district && tokens.length > remainingStart) {
      const districtTokens = tokens.slice(remainingStart, Math.min(remainingStart + 2, tokens.length));
      candidate.district = districtTokens
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
  }
}
