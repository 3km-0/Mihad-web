import test from "node:test";
import assert from "node:assert/strict";
import { scoreLocationQuality, __test } from "../src/market/location-scorer.js";

test("location scorer treats exact coordinates as stronger than district fallback without Maps API", async () => {
  const exact = await scoreLocationQuality({
    candidate: {
      latitude: 24.81321,
      longitude: 46.63842,
      location_precision: "exact",
      location_source: "listing_json",
    },
  });
  const district = await scoreLocationQuality({
    candidate: {
      district: "Al Arid",
      city: "Riyadh",
      location_precision: "district",
      location_source: "district_fallback",
    },
  });

  assert.equal(exact.max, 15);
  assert(exact.pts > district.pts);
  assert.equal(district.precision, "district");
});

test("location scorer groups nearby place amenities", () => {
  const counts = __test.amenityBreakdown([
    { types: ["supermarket", "store"] },
    { types: ["school"] },
    { types: ["hospital"] },
    { types: ["park"] },
    { types: ["transit_station"] },
  ]);

  assert.deepEqual(counts, {
    daily_needs: 1,
    mobility: 1,
    education: 1,
    healthcare: 1,
    leisure: 1,
  });
});
