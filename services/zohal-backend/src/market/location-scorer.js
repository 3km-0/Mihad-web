const GOOGLE_MAPS_API_KEY = String(
  process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    "",
).trim();

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value) {
  return String(value || "").trim();
}

function locationFrom(row = {}) {
  const metadata = row.metadata_json && typeof row.metadata_json === "object" ? row.metadata_json : {};
  const snapshot = row.limited_evidence_snapshot_json && typeof row.limited_evidence_snapshot_json === "object"
    ? row.limited_evidence_snapshot_json
    : {};
  const location = {
    ...(metadata.location && typeof metadata.location === "object" ? metadata.location : {}),
    ...(snapshot.location && typeof snapshot.location === "object" ? snapshot.location : {}),
  };
  const latitude = num(row.latitude ?? row.lat ?? metadata.latitude ?? metadata.lat ?? location.latitude ?? location.lat);
  const longitude = num(row.longitude ?? row.lng ?? row.lon ?? metadata.longitude ?? metadata.lng ?? metadata.lon ?? location.longitude ?? location.lng ?? location.lon);
  return {
    latitude,
    longitude,
    precision: text(row.location_precision || metadata.location_precision || location.location_precision),
    source: text(row.location_source || metadata.location_source || location.location_source),
    map_query: text(row.map_query || metadata.map_query || location.map_query),
    district: text(row.district || metadata.district || location.district),
    city: text(row.city || metadata.city || location.city),
  };
}

function baseLocationPoints(location) {
  if (location.latitude !== null && location.longitude !== null) return 5;
  if (location.precision === "address_geocoded") return 4;
  if (location.district) return 3;
  if (location.city) return 2;
  return 1;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) return null;
    return await response.json().catch(() => null);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeQuery(query) {
  if (!GOOGLE_MAPS_API_KEY || !query) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
  const json = await fetchJson(url);
  const location = json?.results?.[0]?.geometry?.location;
  const latitude = num(location?.lat);
  const longitude = num(location?.lng);
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude, precision: "address_geocoded", source: "google_geocoding" };
}

function amenityBreakdown(places = []) {
  const counts = {
    daily_needs: 0,
    mobility: 0,
    education: 0,
    healthcare: 0,
    leisure: 0,
  };
  for (const place of places) {
    const types = Array.isArray(place.types) ? place.types : [];
    if (types.some((type) => ["supermarket", "grocery_store", "shopping_mall"].includes(type))) counts.daily_needs += 1;
    if (types.some((type) => ["transit_station", "bus_station", "parking"].includes(type))) counts.mobility += 1;
    if (types.some((type) => ["school", "university"].includes(type))) counts.education += 1;
    if (types.some((type) => ["hospital", "doctor", "pharmacy"].includes(type))) counts.healthcare += 1;
    if (types.some((type) => ["park", "gym", "restaurant", "cafe"].includes(type))) counts.leisure += 1;
  }
  return counts;
}

function amenityPoints(counts) {
  return Object.values(counts).reduce((total, count) => total + Math.min(1.2, count * 0.4), 0);
}

async function nearbyPlaces(location) {
  if (!GOOGLE_MAPS_API_KEY || location.latitude === null || location.longitude === null) return null;
  const response = await fetchJson("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "places.id,places.types,places.location",
    },
    body: JSON.stringify({
      includedTypes: [
        "supermarket",
        "shopping_mall",
        "school",
        "hospital",
        "pharmacy",
        "park",
        "restaurant",
        "cafe",
        "transit_station",
      ],
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude: location.latitude, longitude: location.longitude },
          radius: 1600,
        },
      },
    }),
  });
  return Array.isArray(response?.places) ? response.places : [];
}

export async function scoreLocationQuality({ candidate = {}, mandate = {} } = {}) {
  let location = locationFrom(candidate);
  if ((location.latitude === null || location.longitude === null) && location.map_query) {
    const geocoded = await geocodeQuery(location.map_query);
    if (geocoded) location = { ...location, ...geocoded };
  }
  const max = 15;
  const coordinatePts = baseLocationPoints(location);
  if (!GOOGLE_MAPS_API_KEY || location.latitude === null || location.longitude === null) {
    return {
      pts: coordinatePts,
      max,
      note: GOOGLE_MAPS_API_KEY ? "no_coordinate_for_maps_analysis" : "google_maps_api_not_configured",
      precision: location.precision || (location.district ? "district" : "unknown"),
      source: location.source || "fallback",
    };
  }

  const places = await nearbyPlaces(location);
  if (!places) {
    return {
      pts: coordinatePts,
      max,
      note: "google_maps_analysis_unavailable",
      precision: location.precision || "exact",
      source: location.source || "listing_coordinate",
    };
  }
  const counts = amenityBreakdown(places);
  const amenityPts = Math.min(6, amenityPoints(counts));
  const mandateLocationBonus = Array.isArray(mandate.target_locations_json) && mandate.target_locations_json.length ? 2 : 1;
  const pts = Math.round(Math.min(max, coordinatePts + amenityPts + mandateLocationBonus));
  return {
    pts,
    max,
    precision: location.precision || "exact",
    source: location.source || "listing_coordinate",
    amenities: counts,
    nearby_place_count: places.length,
    radius_m: 1600,
  };
}

export const __test = {
  amenityBreakdown,
  baseLocationPoints,
  locationFrom,
};
