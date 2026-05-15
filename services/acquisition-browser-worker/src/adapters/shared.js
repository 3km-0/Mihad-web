import { createHash } from "node:crypto";

export function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function boundedTextSnapshot(html, limit = 1200) {
  return redactSensitiveText(stripTags(html)).slice(0, Math.max(120, Math.min(3000, Number(limit) || 1200)));
}

export function stripTags(html) {
  return normalizeText(String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

export function redactSensitiveText(value) {
  return normalizeText(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/(?:\+?966|0)?\s*5(?:[\s.-]?\d){8}\b/g, "[redacted-sa-mobile]")
    .replace(/\b(?:\+?\d[\s.-]?){9,15}\b/g, "[redacted-phone]");
}

export function absoluteUrl(url, baseUrl) {
  const raw = normalizeText(url);
  if (!raw) return "";
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return raw;
  }
}

export function parseNumber(value) {
  const match = normalizeText(value).replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function finiteCoordinate(value, min, max) {
  const normalized = String(value ?? "").replace(/[^\d.+-]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return Math.round(parsed * 1_000_000) / 1_000_000;
}

function coordinatePair(latitude, longitude) {
  const lat = finiteCoordinate(latitude, -90, 90);
  const lng = finiteCoordinate(longitude, -180, 180);
  if (lat === null || lng === null) return null;
  return { latitude: lat, longitude: lng };
}

function precisionRank(value) {
  const rank = { unknown: 0, city: 1, district: 2, address_geocoded: 3, exact: 4 };
  return rank[value] || 0;
}

export function chooseBestLocationMetadata(items = []) {
  return items
    .filter(Boolean)
    .sort((left, right) => precisionRank(right.location_precision) - precisionRank(left.location_precision))[0] || null;
}

function compactLocationMetadata(value = {}) {
  if (!value || typeof value !== "object") return null;
  const pair = coordinatePair(value.latitude ?? value.lat, value.longitude ?? value.lng ?? value.lon);
  const precision = pair ? "exact" : normalizeText(value.location_precision || value.precision || "");
  const source = normalizeText(value.location_source || value.source || "");
  const metadata = {
    ...(pair || {}),
    location_precision: pair ? "exact" : (["address_geocoded", "district", "city", "unknown"].includes(precision) ? precision : "unknown"),
    location_source: source || (pair ? "listing_json" : "fallback"),
    address: normalizeText(value.address || value.address_text || value.location_text) || null,
    map_query: normalizeText(value.map_query || value.query) || (pair ? `${pair.latitude},${pair.longitude}` : null),
  };
  if (!pair && metadata.location_precision === "exact") metadata.location_precision = "unknown";
  return Object.fromEntries(Object.entries(metadata).filter(([, item]) => item !== null && item !== ""));
}

function traverseForLocation(value, source, results, depth = 0) {
  if (!value || depth > 8) return;
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 200)) traverseForLocation(item, source, results, depth + 1);
    return;
  }
  if (typeof value !== "object") return;
  const pair = coordinatePair(
    value.latitude ?? value.lat ?? value.geo?.latitude ?? value.location?.latitude ?? value.coordinates?.latitude,
    value.longitude ?? value.lng ?? value.lon ?? value.geo?.longitude ?? value.location?.longitude ?? value.coordinates?.longitude,
  );
  if (pair) {
    results.push(compactLocationMetadata({
      ...pair,
      location_precision: "exact",
      location_source: source,
      address: value.address || value.name || value.title || value.locationName,
    }));
  }
  for (const item of Object.values(value)) traverseForLocation(item, source, results, depth + 1);
}

function parseJsonLocationBlocks(text, source) {
  const results = [];
  for (const match of String(text || "").matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      traverseForLocation(JSON.parse(match[1]), "listing_json", results);
    } catch {
      // Keep scanning other blocks.
    }
  }
  for (const match of String(text || "").matchAll(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      traverseForLocation(JSON.parse(match[1]), "listing_json", results);
    } catch {
      // Keep scanning other blocks.
    }
  }
  for (const match of String(text || "").matchAll(/(?:latitude|lat)["']?\s*:\s*["']?(-?\d+(?:\.\d+)?)["']?[\s\S]{0,180}?(?:longitude|lng|lon)["']?\s*:\s*["']?(-?\d+(?:\.\d+)?)["']?/gi)) {
    const pair = coordinatePair(match[1], match[2]);
    if (pair) results.push(compactLocationMetadata({ ...pair, location_precision: "exact", location_source: source }));
  }
  for (const match of String(text || "").matchAll(/(?:longitude|lng|lon)["']?\s*:\s*["']?(-?\d+(?:\.\d+)?)["']?[\s\S]{0,180}?(?:latitude|lat)["']?\s*:\s*["']?(-?\d+(?:\.\d+)?)["']?/gi)) {
    const pair = coordinatePair(match[2], match[1]);
    if (pair) results.push(compactLocationMetadata({ ...pair, location_precision: "exact", location_source: source }));
  }
  return results;
}

function parseMapUrlLocation(text) {
  const results = [];
  for (const match of String(text || "").matchAll(/[@?&=/](-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)(?:[,/?&#"']|%2C)/g)) {
    const pair = coordinatePair(match[1], match[2]);
    if (pair) results.push(compactLocationMetadata({ ...pair, location_precision: "exact", location_source: "map_url" }));
  }
  return results;
}

export function extractLocationMetadata(text, { source = "listing_json", district = null, city = null, address = null } = {}) {
  const exact = chooseBestLocationMetadata([
    ...parseJsonLocationBlocks(text, source),
    ...parseMapUrlLocation(text),
  ]);
  if (exact?.latitude !== undefined && exact?.longitude !== undefined) return exact;
  const fallbackAddress = normalizeText(address);
  if (fallbackAddress) {
    return compactLocationMetadata({
      location_precision: "address_geocoded",
      location_source: "address_text",
      address: fallbackAddress,
      map_query: [fallbackAddress, city].filter(Boolean).join(", "),
    });
  }
  const fallbackDistrict = normalizeText(district);
  const fallbackCity = normalizeText(city);
  if (fallbackDistrict || fallbackCity) {
    return compactLocationMetadata({
      location_precision: fallbackDistrict ? "district" : "city",
      location_source: fallbackDistrict ? "district_fallback" : "city_fallback",
      map_query: [fallbackDistrict, fallbackCity].filter(Boolean).join(", "),
    });
  }
  return compactLocationMetadata({ location_precision: "unknown", location_source: "fallback" });
}

export function applyLocationMetadata(candidate, metadata) {
  const location = compactLocationMetadata(metadata);
  if (!candidate || !location) return candidate;
  if (location.latitude !== undefined && location.longitude !== undefined) {
    candidate.latitude = location.latitude;
    candidate.longitude = location.longitude;
  }
  candidate.location_precision = location.location_precision;
  candidate.location_source = location.location_source;
  if (location.address) candidate.address = location.address;
  if (location.map_query) candidate.map_query = location.map_query;
  candidate.limited_evidence_snapshot_json = {
    ...(candidate.limited_evidence_snapshot_json || {}),
    location,
  };
  return candidate;
}

export function parsePrice(text) {
  const rawMultiline = String(text || "");
  const raw = normalizeText(rawMultiline);
  const normalized = raw.replace(/,/g, "");
  const million = normalized.match(/(\d+(?:\.\d+)?)\s*(m|mn|million|مليون)/i);
  if (million) return Math.round(Number(million[1]) * 1_000_000);
  const currencyPatterns = [
    /(?:sar|ريال|ر\.س|§|⃁)\s*([\d,]{5,})/i,
    /([\d,]{5,})\s*(?:sar|ريال|ر\.س|§|⃁)/i,
  ];
  for (const line of rawMultiline.split(/\s*\n+\s*/)) {
    for (const pattern of currencyPatterns) {
      const match = line.match(pattern);
      if (match) return Number(match[1].replace(/,/g, ""));
    }
  }
  for (const pattern of currencyPatterns) {
    const match = raw.match(pattern);
    if (match) return Number(match[1].replace(/,/g, ""));
  }
  const fallback = normalized.match(/\b(\d{5,})\b/i);
  return fallback ? Number(fallback[1]) : null;
}

// Currency-aware price parser for non-Saudi markets. Handles:
//   AED (United Arab Emirates) — "AED 1,500,000" or "1,500,000 AED" or "د.إ 1.5m"
//   EUR (Spain, Greece) — "650.000 €", "€650,000", "650,000 EUR"
//   TRY (Türkiye) — "1.500.000 ₺", "1,500,000 TL"
// Returns { amount, currency } where amount is a plain number in the source
// currency. Returns { amount: null, currency: null } when nothing matches.
export function parsePriceWithCurrency(text, { defaultCurrency = null } = {}) {
  const rawMultiline = String(text || "");
  const raw = normalizeText(rawMultiline);
  // European thousand separator is '.' so we cannot blindly strip dots.
  // Strategy: detect currency first, then normalize numerics in a
  // currency-appropriate way.
  const currencyHints = [
    { code: "AED", patterns: [/(?:aed|د\.إ|درهم)\s*([\d.,\s]{4,})/i, /([\d.,\s]{4,})\s*(?:aed|د\.إ|درهم)/i] },
    { code: "SAR", patterns: [/(?:sar|ريال|ر\.س)\s*([\d.,\s]{4,})/i, /([\d.,\s]{4,})\s*(?:sar|ريال|ر\.س)/i] },
    { code: "EUR", patterns: [/(?:eur|€)\s*([\d.,\s]{4,})/i, /([\d.,\s]{4,})\s*(?:eur|€)/i] },
    { code: "TRY", patterns: [/(?:try|tl|₺)\s*([\d.,\s]{4,})/i, /([\d.,\s]{4,})\s*(?:try|tl|₺)/i] },
    { code: "USD", patterns: [/(?:usd|\$)\s*([\d.,\s]{4,})/i, /([\d.,\s]{4,})\s*(?:usd|\$)/i] },
    { code: "GBP", patterns: [/(?:gbp|£)\s*([\d.,\s]{4,})/i, /([\d.,\s]{4,})\s*(?:gbp|£)/i] },
  ];

  function normalizeNumeric(rawValue, currency) {
    const cleaned = String(rawValue).replace(/\s+/g, "");
    // For EUR/TRY/SAR the convention is often '.' as thousand separator.
    // For AED/USD/GBP the convention is ',' as thousand separator.
    // We pick based on currency, with a fallback heuristic for ambiguity.
    const europeanStyle = ["EUR", "TRY"].includes(currency);
    let candidate = cleaned;
    if (europeanStyle) {
      // 650.000,50 → 650000.50; 650.000 → 650000
      if (candidate.includes(",")) {
        candidate = candidate.replace(/\./g, "").replace(",", ".");
      } else {
        candidate = candidate.replace(/\./g, "");
      }
    } else {
      // 1,500,000.50 → 1500000.50; 1,500,000 → 1500000
      candidate = candidate.replace(/,/g, "");
    }
    const num = Number(candidate);
    return Number.isFinite(num) ? num : null;
  }

  // Look for "1.5m" / "2 million" first. The (?![\dA-Za-z²³]) lookahead
  // prevents matching "120 m²" (area) or "100 mb" (bedrooms/etc) — the
  // multiplier suffix must be followed by whitespace, punctuation, or
  // end-of-string, not another letter or superscript digit.
  const millionMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(m|mn|million)(?![\dA-Za-z²³])/i);
  if (millionMatch) {
    const numeric = Number(String(millionMatch[1]).replace(",", "."));
    if (Number.isFinite(numeric) && numeric > 0) {
      for (const { code, patterns } of currencyHints) {
        if (patterns.some((pat) => pat.test(raw))) {
          return { amount: Math.round(numeric * 1_000_000), currency: code };
        }
      }
      if (defaultCurrency) {
        return { amount: Math.round(numeric * 1_000_000), currency: defaultCurrency };
      }
    }
  }

  for (const { code, patterns } of currencyHints) {
    for (const pattern of patterns) {
      const match = raw.match(pattern);
      if (!match) continue;
      const numeric = normalizeNumeric(match[1], code);
      if (Number.isFinite(numeric) && numeric > 1_000) {
        return { amount: numeric, currency: code };
      }
    }
  }

  if (defaultCurrency) {
    const amount = parsePrice(raw);
    if (Number.isFinite(amount) && amount > 0) {
      return { amount, currency: defaultCurrency };
    }
  }

  return { amount: null, currency: null };
}

export function sourceFingerprint({ source, sourceUrl, title, district, askingPrice }) {
  return createHash("sha256")
    .update([
      normalizeText(source).toLowerCase(),
      normalizeText(sourceUrl).toLowerCase().replace(/\/+$/, ""),
      normalizeText(title).toLowerCase(),
      normalizeText(district).toLowerCase(),
      normalizeText(askingPrice),
    ].join("|"))
    .digest("hex");
}

export function detectPropertyType(text) {
  const value = normalizeText(text).toLowerCase();
  if (/(villa|فيلا|فلل|فلة)/i.test(value)) return "villa";
  if (/(apartment|flat|شقة)/i.test(value)) return "apartment";
  if (/(land|plot|أرض|ارض)/i.test(value)) return "land";
  if (/(building|عمارة|مبنى)/i.test(value)) return "building";
  if (/(office|retail|commercial|مكتب|تجاري)/i.test(value)) return "commercial";
  return null;
}

export function detectCity(text) {
  const value = normalizeText(text);
  if (/(riyadh|الرياض)/i.test(value)) return "Riyadh";
  if (/(jeddah|جدة)/i.test(value)) return "Jeddah";
  if (/(dammam|الدمام)/i.test(value)) return "Dammam";
  if (/(khobar|الخبر)/i.test(value)) return "Khobar";
  return null;
}

export function detectDistrict(text) {
  const value = normalizeText(text);
  const arabic = value.match(/حي\s+([^,،\n]{2,36})/u);
  if (arabic) return normalizeText(arabic[1]);
  const english = value.match(/\b(?:district|neighborhood|neighbourhood)\s*[:\-]?\s*([\p{L}\p{N}\s-]{2,36})/iu);
  if (english) return normalizeText(english[1]);
  const bayutLocation = value.match(/\b([A-Z][A-Za-z\s-]{2,30}),\s*(?:North|South|East|West|Central)?\s*Riyadh\b/);
  return bayutLocation ? normalizeText(bayutLocation[1]) : null;
}

export function detectContactGate(html) {
  const text = stripTags(html).toLowerCase();
  const patterns = [
    /sign\s*in[^.]{0,80}(phone|contact|whatsapp|agent|broker)/i,
    /log\s*in[^.]{0,80}(phone|contact|whatsapp|agent|broker)/i,
    /(phone|contact|whatsapp|agent|broker)[^.]{0,80}(sign\s*in|log\s*in)/i,
    /(رقم|الهاتف|واتساب|تواصل|اتصل)[^.]{0,80}(تسجيل|الدخول)/i,
    /(تسجيل|الدخول)[^.]{0,80}(رقم|الهاتف|واتساب|تواصل|اتصل)/i,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

export function detectVisibleContact(html) {
  const text = stripTags(html);
  const hasPhone = /(?:\+?966|0)?\s*5(?:[\s.-]?\d){8}\b/.test(text) ||
    /\b(?:\+?\d[\s.-]?){9,15}\b/.test(text);
  const hasWhatsApp = /whatsapp|واتساب|واتس/i.test(text);
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  if (!hasPhone && !hasWhatsApp && !hasEmail) return null;
  return {
    status: "available_via_authenticated_session",
    phone_visible: hasPhone,
    whatsapp_visible: hasWhatsApp,
    email_visible: hasEmail,
    raw_contact_storage: "not_stored",
  };
}

export function extractPhotoRefs(html, baseUrl, limit = 8) {
  const refs = [];
  const seen = new Set();
  const add = (raw) => {
    const url = absoluteUrl(raw, baseUrl);
    if (!url || seen.has(url)) return;
    if (!/^https?:\/\//i.test(url)) return;
    if (/\.(svg|gif)(?:$|[?#])/i.test(url)) return;
    if (/(logo|icon|avatar|user|placeholder|sprite|grid)\.(?:png|jpe?g|webp|svg)/i.test(url)) return;
    if (!/\.(?:png|jpe?g|webp|avif)(?:$|[?#])/i.test(url)) return;
    seen.add(url);
    refs.push(url);
  };
  for (const match of String(html || "").matchAll(/<img\b[^>]*(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi)) {
    add(match[1]);
  }
  for (const match of String(html || "").matchAll(/<img\b[^>]*(?:srcset|data-srcset)=["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(",")) {
      add(candidate.trim().split(/\s+/)[0]);
    }
  }
  for (const match of String(html || "").matchAll(/\b(?:image|photo|thumbnail|url)\b["']?\s*[:=]\s*["']([^"']+\.(?:png|jpe?g|webp|avif)(?:\?[^"']*)?)["']/gi)) {
    add(match[1]);
  }
  for (const match of String(html || "").matchAll(/["'](https?:\/\/[^"']+\.(?:png|jpe?g|webp|avif)(?:\?[^"']*)?)["']/gi)) {
    add(match[1]);
  }
  return refs.slice(0, Math.max(0, Number(limit) || 8));
}

export function extractLinks(html, baseUrl, sourceHostPattern) {
  const links = [];
  const seen = new Set();
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(String(html || "")))) {
    const url = absoluteUrl(match[1], baseUrl);
    if (!url || seen.has(url)) continue;
    if (sourceHostPattern && !sourceHostPattern.test(url)) continue;
    seen.add(url);
    links.push({ url, text: stripTags(match[2]) });
  }
  return links;
}

export function candidateFromText({ source, sourceUrl, title, text, capturedAt = new Date().toISOString() }) {
  const content = normalizeText(`${title || ""} ${text || ""}`);
  const askingPrice = parsePrice(content);
  const area = content.match(/(\d+(?:\.\d+)?)\s*(sqm|sq\.?\s*m\.?|m2|m²|م2|م²|متر)/i);
  const beds = content.match(/(\d+)\s*(bed|beds|bedroom|غرف|غرفة)/i);
  const baths = content.match(/(\d+)\s*(bath|bathroom|دورات|حمام)/i);
  const propertyType = detectPropertyType(content);
  const district = detectDistrict(content);
  const city = detectCity(content);
  const candidate = {
    source,
    source_url: sourceUrl,
    title: normalizeText(title) || normalizeText(content).slice(0, 80),
    asking_price: askingPrice,
    city,
    district,
    property_type: propertyType,
    area_sqm: area ? Number(area[1]) : null,
    bedroom_count: beds ? Number(beds[1]) : null,
    bathroom_count: baths ? Number(baths[1]) : null,
    short_description: redactSensitiveText(text).slice(0, 500) || null,
    terms_policy: "unknown",
    captured_at: capturedAt,
    limited_evidence_snapshot_json: {
      text: redactSensitiveText(text).slice(0, 1200),
      source_url: sourceUrl,
      captured_at: capturedAt,
    },
  };
  candidate.source_fingerprint = sourceFingerprint({
    source,
    sourceUrl,
    title: candidate.title,
    district: candidate.district,
    askingPrice,
  });
  return candidate;
}

// Country/currency-aware candidate builder for non-Saudi marketplaces.
// Stamps country_code, currency, and the raw native price into the
// limited_evidence_snapshot_json so downstream IQS scoring can convert to SAR.
// Falls back to candidateFromText behavior when country/currency are unknown.
export function candidateFromTextWithLocale({
  source,
  sourceUrl,
  title,
  text,
  countryCode,
  defaultCurrency = null,
  cityHint = null,
  districtHint = null,
  capturedAt = new Date().toISOString(),
}) {
  const content = normalizeText(`${title || ""} ${text || ""}`);
  const { amount, currency } = parsePriceWithCurrency(content, { defaultCurrency });
  const area = content.match(/(\d+(?:[,.]\d+)*(?:\.\d+)?)\s*(sqm|sq\.?\s*m\.?|m2|m²|م2|م²|متر|metros?)/i);
  const beds = content.match(/(\d+)\s*(bed|beds|bedroom|dorm|habitaciones|γκαρ|yatak|غرف|غرفة)/i);
  const baths = content.match(/(\d+)\s*(bath|bathroom|baño|banyo|μπάν|دورات|حمام)/i);
  const propertyType = detectPropertyType(content);
  const districtFallback = detectDistrict(content);
  const cityFallback = detectCity(content);
  const areaValue = area ? Number(String(area[1]).replace(/,/g, "")) : null;
  const candidate = {
    source,
    source_url: sourceUrl,
    title: normalizeText(title) || normalizeText(content).slice(0, 80),
    asking_price: amount,
    city: cityHint || cityFallback,
    district: districtHint || districtFallback,
    property_type: propertyType,
    area_sqm: Number.isFinite(areaValue) ? areaValue : null,
    bedroom_count: beds ? Number(beds[1]) : null,
    bathroom_count: baths ? Number(baths[1]) : null,
    short_description: redactSensitiveText(text).slice(0, 500) || null,
    terms_policy: "unknown",
    captured_at: capturedAt,
    limited_evidence_snapshot_json: {
      text: redactSensitiveText(text).slice(0, 1200),
      source_url: sourceUrl,
      captured_at: capturedAt,
      country_code: countryCode || null,
      currency: currency || defaultCurrency || null,
      asking_price_native: amount,
    },
  };
  candidate.source_fingerprint = sourceFingerprint({
    source,
    sourceUrl,
    title: candidate.title,
    district: candidate.district,
    askingPrice: amount,
  });
  return candidate;
}
