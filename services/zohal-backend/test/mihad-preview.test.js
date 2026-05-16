import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMihadAnonymousPreview,
  fallbackPreviewCards,
  previewCardsFromCandidates,
} from "../src/mihad/preview.js";

test("anonymous preview strips source URLs and broker contact details", () => {
  const cards = previewCardsFromCandidates([
    {
      title: "Apartment in North Riyadh",
      city: "Riyadh",
      district: "Al Arid",
      asking_price: 1250000,
      property_type: "apartment",
      area_sqm: 130,
      source: "aqar",
      source_url: "https://example.test/listing/secret",
      phone_number: "+966500000000",
    },
  ]);

  assert.equal(cards.length, 1);
  assert.equal(cards[0].preview_kind, "live_preview");
  assert.equal(cards[0].note, "1,250,000 SAR · 130 sqm · Aqar");
  assert(!JSON.stringify(cards[0]).includes("source_url"));
  assert(!JSON.stringify(cards[0]).includes("+966"));
});

test("anonymous preview falls back without creating durable acquisition rows when worker is unavailable", async () => {
  const priorWorker = process.env.ACQUISITION_BROWSER_WORKER_URL;
  const priorToken = process.env.INTERNAL_FUNCTION_JWT;
  delete process.env.ACQUISITION_BROWSER_WORKER_URL;
  process.env.INTERNAL_FUNCTION_JWT = "test-token";

  const result = await buildMihadAnonymousPreview({
    locale: "en",
    intent: {
      target_country_codes: ["SA"],
      city: ["Riyadh"],
      districts: ["North Riyadh"],
      property_type: "apartment",
      currency: "SAR",
    },
    requestId: "preview-test",
  });

  assert.equal(result.live_preview, false);
  assert.equal(result.reason, "browser_worker_not_configured");
  assert.equal(result.preview_cards[0].preview_kind, "sample_preview");

  if (priorWorker === undefined) delete process.env.ACQUISITION_BROWSER_WORKER_URL;
  else process.env.ACQUISITION_BROWSER_WORKER_URL = priorWorker;
  if (priorToken === undefined) delete process.env.INTERNAL_FUNCTION_JWT;
  else process.env.INTERNAL_FUNCTION_JWT = priorToken;
});

test("sample preview is explicit search-lane copy, not a real listing", () => {
  const cards = fallbackPreviewCards({
    city: ["Dubai"],
    districts: ["Jumeirah"],
    property_type: "villa",
  }, "en");
  assert.match(cards[0].title, /Search lane/);
  assert.equal(cards[0].preview_kind, "sample_preview");
});
