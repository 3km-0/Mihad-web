import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AqarBrowsingAdapter } from "../src/adapters/aqar.js";
import { BayutBrowsingAdapter } from "../src/adapters/bayut.js";
import { __test as workerTest, runAdapter } from "../src/worker.js";

test("Aqar adapter parses search cards and detail page into candidate", () => {
  const searchHtml = `
    <a href="/123456">Villa in North Riyadh SAR 3,200,000 area 360 sqm</a>
    <a href="https://example.com/ignore">Ignore</a>
  `;
  const cards = AqarBrowsingAdapter.parseSearchResults(searchHtml);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].source, "aqar");
  assert.match(cards[0].source_url, /aqar\.fm/);

  const detail = AqarBrowsingAdapter.parseListingDetail(`
    <h1>Villa district Al Arid Riyadh</h1>
    <p>Villa for sale SAR 3,200,000 area 360 sqm 5 beds 4 baths</p>
    <script type="application/ld+json">{"@type":"Residence","geo":{"latitude":24.81321,"longitude":46.63842}}</script>
    <img src="/icons/v2/aqar-logo.svg" />
    <img src="/photo.jpg" />
    <img data-src="https://images.aqar.fm/webp/750x0/props/photo-2.webp" />
    <img srcset="/photo-3.jpg 480w, /photo-3-large.jpg 960w" />
  `, cards[0].source_url);

  assert.equal(detail.source, "aqar");
  assert.equal(detail.asking_price, 3200000);
  assert.equal(detail.latitude, 24.81321);
  assert.equal(detail.longitude, 46.63842);
  assert.equal(detail.location_precision, "exact");
  assert.equal(detail.location_source, "listing_json");
  assert.equal(detail.area_sqm, 360);
  assert.equal(detail.bedroom_count, 5);
  assert.deepEqual(detail.photo_refs_json, [
    "https://sa.aqar.fm/photo.jpg",
    "https://images.aqar.fm/webp/750x0/props/photo-2.webp",
    "https://sa.aqar.fm/photo-3.jpg",
    "https://sa.aqar.fm/photo-3-large.jpg",
  ]);
  assert.ok(detail.source_fingerprint);
});

test("adapter uses district location only as fallback when exact coordinates are absent", () => {
  const detail = BayutBrowsingAdapter.parseListingDetail(`
    <h1>Villa district Hittin Riyadh</h1>
    <section>Price SAR 4m area 420 sqm 6 bedrooms 5 bathrooms</section>
  `, "https://www.bayut.sa/en/property/details-1.html");

  assert.equal(detail.latitude, undefined);
  assert.equal(detail.longitude, undefined);
  assert.equal(detail.location_precision, "district");
  assert.equal(detail.location_source, "district_fallback");
  assert.match(detail.map_query, /Hittin, Riyadh/);
});

test("runAdapter passes network coordinate hints into detail parsing", async () => {
  const artifactDir = await mkdtemp(join(tmpdir(), "zohal-browser-artifacts-"));
  process.env.ACQUISITION_BROWSER_ARTIFACT_DIR = artifactDir;
  const responseHandlers = new Set();
  const page = {
    on(event, handler) {
      if (event === "response") responseHandlers.add(handler);
    },
    off(event, handler) {
      if (event === "response") responseHandlers.delete(handler);
    },
    async goto(url) {
      this.url = url;
      for (const handler of responseHandlers) {
        handler({
          url: () => `${url}/api`,
          headers: () => ({ "content-type": "application/json" }),
          request: () => ({ resourceType: () => "xhr" }),
          text: async () => JSON.stringify({ lat: 24.721111, lng: 46.671222 }),
        });
      }
    },
    async waitForTimeout() {},
    async content() {
      return this.url.includes("detail")
        ? "<html><h1>Villa district Al Arid Riyadh</h1><p>SAR 3,200,000 area 360 sqm</p></html>"
        : "<html><a href='https://example.test/detail'>listing</a></html>";
    },
    async screenshot() {},
    async close() {},
  };
  const browser = {
    async newContext() {
      return {
        async newPage() {
          return page;
        },
        async close() {},
      };
    },
  };
  const adapter = {
    source: "fixture",
    buildSearchUrl() {
      return "https://example.test/search";
    },
    parseSearchResults() {
      return [{ source_url: "https://example.test/detail", title: "Fixture" }];
    },
    parseListingDetail(html, sourceUrl, context = {}) {
      assert.equal(context.location_hints.length, 1);
      return {
        source: "fixture",
        source_url: sourceUrl,
        source_fingerprint: "fixture_location",
        title: "Fixture",
        latitude: context.location_hints[0].latitude,
        longitude: context.location_hints[0].longitude,
        location_precision: context.location_hints[0].location_precision,
        location_source: context.location_hints[0].location_source,
      };
    },
  };

  const result = await runAdapter({
    adapter,
    mandate: {},
    searchRun: { id: "search_run_location", limits_json: {} },
    limits: workerTest.normalizeLimits({}),
    browser,
  });

  assert.equal(result.candidates[0].latitude, 24.721111);
  assert.equal(result.candidates[0].longitude, 46.671222);
  assert.equal(result.candidates[0].location_source, "network_api");
});

test("Aqar adapter recognizes Arabic sale villa cards", () => {
  const cards = AqarBrowsingAdapter.parseSearchResults(`
    <a href="/987654321">فيلا للبيع في حي العارض، الرياض 3,400,000 ريال 375 م²</a>
    <a href="/555555">شقة للايجار في الرياض 120,000 ريال 140 م²</a>
  `);

  assert.equal(cards.length, 1);
  assert.match(cards[0].title, /العارض/);
});

test("Aqar adapter builds district-specific public filter URLs", () => {
  const url = AqarBrowsingAdapter.buildSearchUrl({
    buy_box_json: {
      property_type: "villa",
      city: "Riyadh",
      district: "Al Arid",
    },
  });

  assert.match(decodeURIComponent(url), /\/فلل-للبيع\/الرياض\/شمال-الرياض\/حي-العارض/);
});

test("Bayut adapter ignores fallback/similar-property pages", () => {
  const cards = BayutBrowsingAdapter.parseSearchResults(`
    <h1>Sorry, we couldn't find the page</h1>
    <h2>Similar Properties</h2>
    <a href="/en/property/details-999.html">A notable apartment in Jeddah SAR 900000</a>
  `);

  assert.equal(cards.length, 0);
});

test("Bayut adapter parses search cards and detail page into candidate", () => {
  const searchHtml = `
    <a href="/en/property/details-1.html">Villa for-sale in Riyadh SAR 4m</a>
    <a href="/العقار/تفاصيل-2.html"></a>
  `;
  const cards = BayutBrowsingAdapter.parseSearchResults(searchHtml);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].source, "bayut");

  const detail = BayutBrowsingAdapter.parseListingDetail(`
    <h1>Villa district Hittin Riyadh</h1>
    <section>Price SAR 4m area 420 sqm 6 bedrooms 5 bathrooms</section>
  `, cards[0].source_url);

  assert.equal(detail.source, "bayut");
  assert.equal(detail.asking_price, 4000000);
  assert.equal(detail.area_sqm, 420);
  assert.equal(detail.property_type, "villa");
});

test("Bayut adapter builds district-specific Arabic marketplace filter URLs", () => {
  const url = BayutBrowsingAdapter.buildSearchUrl({
    buy_box_json: {
      property_type: "villa",
      city: "Riyadh",
      district: "Al Arid",
    },
  });

  assert.match(decodeURIComponent(url), /\/للبيع\/فلل\/الرياض\/شمال-الرياض\/العارض\//);
});

test("adapter marks gated marketplace contact as missing access metadata", () => {
  const detail = AqarBrowsingAdapter.parseListingDetail(`
    <h1>Villa district Al Arid Riyadh</h1>
    <p>Villa for sale SAR 3,200,000 area 360 sqm 5 beds 4 baths</p>
    <button>Sign in to view broker WhatsApp contact</button>
  `, "https://sa.aqar.fm/123456");

  assert.equal(detail.contact_access_json.status, "requires_sign_in");
  assert.equal(detail.limited_evidence_snapshot_json.contact_access.reason, "broker_contact_gated");
});

test("suppressed listing URLs are removed before detail fetch", () => {
  const cards = [
    { source: "aqar", source_url: "https://sa.aqar.fm/123456?utm=test", title: "Rejected villa" },
    { source: "aqar", source_url: "https://sa.aqar.fm/789", title: "New villa" },
  ];
  const result = workerTest.filterSuppressedCards(cards, [
    { source: "aqar", source_url: "https://sa.aqar.fm/123456?utm=test#photos", status: "archived" },
  ], "aqar");

  assert.equal(result.suppressedCount, 1);
  assert.deepEqual(result.cards.map((card) => card.source_url), ["https://sa.aqar.fm/789"]);
});

test("runAdapter records bounded artifacts and drift warnings for empty result pages", async () => {
  const artifactDir = await mkdtemp(join(tmpdir(), "zohal-browser-artifacts-"));
  process.env.ACQUISITION_BROWSER_ARTIFACT_DIR = artifactDir;
  const page = {
    async goto(url) {
      this.url = url;
    },
    async waitForTimeout() {},
    async content() {
      return "<html><main>No listings here</main></html>";
    },
    async screenshot() {},
    async close() {},
  };
  const browser = {
    async newContext() {
      return {
        async newPage() {
          return page;
        },
        async close() {},
      };
    },
  };
  const adapter = {
    source: "fixture",
    buildSearchUrl() {
      return "https://example.test/search";
    },
    parseSearchResults() {
      return [];
    },
  };

  const result = await runAdapter({
    adapter,
    mandate: {},
    searchRun: { id: "search_run_1", limits_json: {} },
    limits: workerTest.normalizeLimits({}),
    browser,
  });

  assert.equal(result.adapter_run.status, "completed_with_warnings");
  assert.equal(result.adapter_run.error_json.drift_signal, "no_search_cards_extracted");
  assert.equal(result.adapter_run.limited_snapshot_refs_json.length, 1);
  assert.equal(result.adapter_run.limited_snapshot_refs_json[0].text, "No listings here");
});

test("runAdapter uses adapter-driven marketplace UI filters before parsing", async () => {
  const artifactDir = await mkdtemp(join(tmpdir(), "zohal-browser-artifacts-"));
  process.env.ACQUISITION_BROWSER_ARTIFACT_DIR = artifactDir;
  const page = {
    async screenshot() {},
    async close() {},
    async content() {
      return "<html></html>";
    },
  };
  const browser = {
    async newContext() {
      return {
        async newPage() {
          return page;
        },
        async close() {},
      };
    },
  };
  const adapter = {
    source: "fixture",
    buildSearchUrl() {
      return "https://example.test/fallback";
    },
    async applySearchFilters() {
      return {
        url: "https://example.test/ui-filtered",
        html: "<html><a href='/1'>Villa for sale SAR 1,000,000 200 sqm</a></html>",
        warnings: ["district_refined_by_ranker"],
      };
    },
    parseSearchResults(html, baseUrl) {
      assert.equal(baseUrl, "https://example.test/ui-filtered");
      assert.match(html, /Villa for sale/);
      return [];
    },
  };

  const result = await runAdapter({
    adapter,
    mandate: {},
    searchRun: { id: "search_run_2", limits_json: {} },
    limits: workerTest.normalizeLimits({}),
    browser,
  });

  assert.equal(result.adapter_run.error_json.search_mode, "ui_filter");
  assert.deepEqual(result.adapter_run.error_json.search_warnings, ["district_refined_by_ranker"]);
});

test("runAdapter loads configured storage-state auth and suppresses screenshots", async () => {
  const artifactDir = await mkdtemp(join(tmpdir(), "zohal-browser-artifacts-"));
  const authDir = await mkdtemp(join(tmpdir(), "zohal-browser-auth-"));
  const storageStatePath = join(authDir, "fixture.json");
  await writeFile(storageStatePath, JSON.stringify({ cookies: [], origins: [] }));
  process.env.ACQUISITION_BROWSER_ARTIFACT_DIR = artifactDir;
  process.env.ACQUISITION_BROWSER_AUTH_STATE_FIXTURE = storageStatePath;
  const page = {
    async screenshot() {
      throw new Error("screenshots should be skipped for authenticated contexts");
    },
    async close() {},
  };
  let receivedStorageState = null;
  const browser = {
    async newContext(options = {}) {
      receivedStorageState = options.storageState;
      return {
        async newPage() {
          return page;
        },
        async close() {},
      };
    },
  };
  const adapter = {
    source: "fixture",
    buildSearchUrl() {
      return "https://example.test/fallback";
    },
    async applySearchFilters() {
      return {
        url: "https://example.test/ui-filtered",
        html: "<html><main>Call +966 55 123 4567</main></html>",
      };
    },
    parseSearchResults() {
      return [];
    },
  };

  const result = await runAdapter({
    adapter,
    mandate: {},
    searchRun: { id: "search_run_3", limits_json: {} },
    limits: workerTest.normalizeLimits({}),
    browser,
  });

  delete process.env.ACQUISITION_BROWSER_AUTH_STATE_FIXTURE;
  assert.equal(receivedStorageState, storageStatePath);
  assert.equal(result.adapter_run.error_json.auth_mode, "storage_state");
  assert.equal(result.adapter_run.screenshot_refs_json.length, 0);
  assert.equal(result.adapter_run.limited_snapshot_refs_json.at(-1).text, "Call [redacted-sa-mobile]");
});

test("worker run limits clamp unsafe values", () => {
  assert.deepEqual(
    workerTest.normalizeLimits({
      max_result_pages_per_source: 99,
      max_detail_pages_per_source: -1,
      per_source_timeout_ms: 1,
      per_run_timeout_ms: 999999,
    }),
    {
      max_result_pages_per_source: 3,
      max_detail_pages_per_source: 1,
      per_source_timeout_ms: 10000,
      per_run_timeout_ms: 300000,
    },
  );
});

test("defaultSourcesForMandate picks country-native adapters", async () => {
  const saSources = workerTest.defaultSourcesForMandate({ target_country_codes: ["SA"] });
  assert.deepEqual(saSources.sort(), ["aqar", "bayut", "property_finder"]);

  const aeSources = workerTest.defaultSourcesForMandate({ target_country_codes: ["AE"] });
  assert.deepEqual(aeSources, ["property_finder"]);

  const esSources = workerTest.defaultSourcesForMandate({ target_country_codes: ["ES"] });
  assert.deepEqual(esSources, ["idealista"]);

  const crossBorder = workerTest.defaultSourcesForMandate({ target_country_codes: ["AE", "ES"] });
  assert.deepEqual(new Set(crossBorder), new Set(["property_finder", "idealista"]));

  const trGr = workerTest.defaultSourcesForMandate({ target_country_codes: ["TR", "GR"] });
  // TR and GR have no native adapter yet; fall back to legacy SA scrapers
  // so the worker still emits a search run (operators rely on CSV ingest).
  assert.deepEqual(trGr.sort(), ["aqar", "bayut"]);

  const empty = workerTest.defaultSourcesForMandate({});
  assert.deepEqual(empty, ["aqar", "bayut"]);
});

test("Idealista adapter parses search cards from /inmueble/{id}/ URLs", async () => {
  const { IdealistaBrowsingAdapter } = await import("../src/adapters/idealista.js");
  const html = `
    <a href="/en/inmueble/12345678/">Piso en venta Salamanca Madrid 650.000 €</a>
    <a href="/en/inmueble/87654321/">Apartamento Chamberí 420.000 €</a>
    <a href="/en/news/some-article/">Not a listing</a>
  `;
  const cards = IdealistaBrowsingAdapter.parseSearchResults(html, "https://www.idealista.com/en/venta-viviendas/madrid/");
  assert.equal(cards.length, 2);
  assert.equal(cards[0].source, "idealista");
  assert.match(cards[0].source_url, /idealista\.com\/en\/inmueble\/12345678/);
});

test("Idealista adapter records EUR currency and ES country on listing detail", async () => {
  const { IdealistaBrowsingAdapter } = await import("../src/adapters/idealista.js");
  const detail = IdealistaBrowsingAdapter.parseListingDetail(`
    <h1>Apartment for sale in Salamanca Madrid</h1>
    <p>Bright 120 m² apartment with 3 dormitorios and 2 baños. 650.000 € — Idealista reference 12345678.</p>
  `, "https://www.idealista.com/en/inmueble/12345678/");
  assert.equal(detail.source, "idealista");
  assert.equal(detail.asking_price, 650000);
  assert.equal(detail.limited_evidence_snapshot_json.country_code, "ES");
  assert.equal(detail.limited_evidence_snapshot_json.currency, "EUR");
  assert.equal(detail.limited_evidence_snapshot_json.asking_price_native, 650000);
  assert.equal(detail.area_sqm, 120);
  assert.equal(detail.bedroom_count, 3);
  assert.ok(detail.source_fingerprint);
});

test("Idealista buildSearchUrl picks city slug from mandate buy box", async () => {
  const { IdealistaBrowsingAdapter } = await import("../src/adapters/idealista.js");
  const url = IdealistaBrowsingAdapter.buildSearchUrl({
    buy_box_json: { city: "Madrid", property_type: "apartment" },
  });
  assert.match(url, /idealista\.com\/en\/venta-viviendas\/madrid\//);
});

test("PropertyFinder adapter parses /plp/ listing cards", async () => {
  const { PropertyFinderBrowsingAdapter } = await import("../src/adapters/property-finder.js");
  const html = `
    <a href="/en/plp/buy-properties-for-sale-1234567.html">Luxury apartment in Downtown Dubai AED 2,500,000</a>
    <a href="/en/plp/buy-properties-for-sale-7654321.html">Townhouse in JVC AED 1,800,000</a>
    <a href="/en/news/article">Not a listing</a>
  `;
  const cards = PropertyFinderBrowsingAdapter.parseSearchResults(html, "https://www.propertyfinder.ae/en/search?c=1");
  assert.equal(cards.length, 2);
  assert.equal(cards[0].source, "property_finder");
  assert.match(cards[0].source_url, /propertyfinder\.ae\/en\/plp\//);
});

test("PropertyFinder adapter records AED for .ae and SAR for .sa detail pages", async () => {
  const { PropertyFinderBrowsingAdapter } = await import("../src/adapters/property-finder.js");
  const aeDetail = PropertyFinderBrowsingAdapter.parseListingDetail(`
    <h1>Apartment for sale in Downtown Dubai</h1>
    <p>1,250 sqm apartment. AED 2,500,000.</p>
  `, "https://www.propertyfinder.ae/en/plp/buy-properties-for-sale-1234567.html");
  assert.equal(aeDetail.source, "property_finder");
  assert.equal(aeDetail.asking_price, 2500000);
  assert.equal(aeDetail.limited_evidence_snapshot_json.country_code, "AE");
  assert.equal(aeDetail.limited_evidence_snapshot_json.currency, "AED");
  assert.equal(aeDetail.area_sqm, 1250);

  const saDetail = PropertyFinderBrowsingAdapter.parseListingDetail(`
    <h1>Villa in Riyadh</h1>
    <p>520 sqm villa. SAR 3,500,000.</p>
  `, "https://www.propertyfinder.sa/en/plp/buy-properties-for-sale-9876543.html");
  assert.equal(saDetail.source, "property_finder");
  assert.equal(saDetail.asking_price, 3500000);
  assert.equal(saDetail.limited_evidence_snapshot_json.country_code, "SA");
  assert.equal(saDetail.limited_evidence_snapshot_json.currency, "SAR");
});

test("PropertyFinder buildSearchUrl honors mandate target country", async () => {
  const { PropertyFinderBrowsingAdapter } = await import("../src/adapters/property-finder.js");
  const aeUrl = PropertyFinderBrowsingAdapter.buildSearchUrl({ target_country_codes: ["AE"] });
  assert.match(aeUrl, /propertyfinder\.ae/);
  const saUrl = PropertyFinderBrowsingAdapter.buildSearchUrl({ target_country_codes: ["SA"] });
  assert.match(saUrl, /propertyfinder\.sa/);
});

test("parsePriceWithCurrency handles European thousand separators and AED", async () => {
  const { parsePriceWithCurrency } = await import("../src/adapters/shared.js");
  assert.deepEqual(parsePriceWithCurrency("Listed at 650.000 €"), { amount: 650000, currency: "EUR" });
  assert.deepEqual(parsePriceWithCurrency("€ 1.250.000"), { amount: 1250000, currency: "EUR" });
  assert.deepEqual(parsePriceWithCurrency("AED 2,500,000 — exclusive"), { amount: 2500000, currency: "AED" });
  assert.deepEqual(parsePriceWithCurrency("Price 1,800,000 AED"), { amount: 1800000, currency: "AED" });
  assert.deepEqual(parsePriceWithCurrency("1.500.000 TL"), { amount: 1500000, currency: "TRY" });
  assert.deepEqual(parsePriceWithCurrency("£450,000 in London"), { amount: 450000, currency: "GBP" });
  assert.deepEqual(parsePriceWithCurrency("Reference 12345 in description", { defaultCurrency: "EUR" }), { amount: 12345, currency: "EUR" });
  assert.deepEqual(parsePriceWithCurrency("no price here"), { amount: null, currency: null });
});
