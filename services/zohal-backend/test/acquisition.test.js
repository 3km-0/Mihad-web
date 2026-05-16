import test from "node:test";
import assert from "node:assert/strict";
import {
  buildScreeningOutput,
  buildSourceFingerprint,
  normalizeSearchLimits,
  normalizeSources,
  __test,
} from "../src/handlers/acquisition.js";
import { computeInvestmentScore } from "../src/market/investment-scorer.js";
import { runAndPersistUnderwriting } from "../src/underwriting/persistence.js";

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

class Query {
  constructor(db, table) {
    this.db = db;
    this.table = table;
    this.filters = [];
    this.pending = null;
    this.limitCount = null;
  }

  select() {
    return this;
  }

  insert(payload) {
    const rows = (Array.isArray(payload) ? payload : [payload]).map((row) => ({
      id: row.id || makeId(this.table),
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
      ...row,
    }));
    this.db[this.table] ||= [];
    this.db[this.table].push(...rows);
    this.pending = Array.isArray(payload) ? rows : rows[0];
    return this;
  }

  upsert(payload, options = {}) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const conflicts = String(options.onConflict || "id").split(",").map((field) => field.trim());
    const saved = rows.map((row) => {
      this.db[this.table] ||= [];
      const existing = this.db[this.table].find((candidate) =>
        conflicts.every((field) => candidate[field] === row[field])
      );
      if (existing) {
        Object.assign(existing, row, { updated_at: new Date().toISOString() });
        return existing;
      }
      const next = {
        id: row.id || makeId(this.table),
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
        ...row,
      };
      this.db[this.table].push(next);
      return next;
    });
    this.pending = Array.isArray(payload) ? saved : saved[0];
    return this;
  }

  update(payload) {
    this.pendingUpdate = payload;
    return this;
  }

  eq(field, value) {
    this.filters.push({ field, value });
    return this;
  }

  neq(field, value) {
    this.filters.push({ field, value, op: "neq" });
    return this;
  }

  in(field, values) {
    this.filters.push({ field, values: new Set(values || []), op: "in" });
    return this;
  }

  ilike(field, pattern) {
    this.filters.push({ field, pattern, op: "ilike" });
    return this;
  }

  order() {
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  _matches(row) {
    return this.filters.every((filter) => {
      if (filter.op === "in") return filter.values.has(row[filter.field]);
      if (filter.op === "neq") return row[filter.field] !== filter.value;
      if (filter.op === "ilike") {
        const escaped = String(filter.pattern || "")
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/%/g, ".*")
          .replace(/_/g, ".");
        return new RegExp(`^${escaped}$`, "i").test(String(row[filter.field] || ""));
      }
      return row[filter.field] === filter.value;
    });
  }

  _rows() {
    let rows = [...(this.db[this.table] || [])].filter((row) => this._matches(row));
    if (this.pendingUpdate) {
      rows = rows.map((row) => Object.assign(row, this.pendingUpdate, { updated_at: new Date().toISOString() }));
      this.pending = rows.length === 1 ? rows[0] : rows;
    }
    if (this.limitCount !== null) rows = rows.slice(0, this.limitCount);
    return rows;
  }

  async single() {
    if (this.pending) return { data: Array.isArray(this.pending) ? this.pending[0] : this.pending, error: null };
    const rows = this._rows();
    return { data: rows[0] || null, error: rows[0] ? null : new Error("not found") };
  }

  async maybeSingle() {
    if (this.pending) return { data: Array.isArray(this.pending) ? this.pending[0] : this.pending, error: null };
    const rows = this._rows();
    return { data: rows[0] || null, error: null };
  }

  then(resolve, reject) {
    const result = this.pending
      ? { data: this.pending, error: null }
      : { data: this._rows(), error: null };
    return Promise.resolve(result).then(resolve, reject);
  }
}

function createMockSupabase(seed = {}) {
  const db = { ...seed };
  return {
    db,
    from(table) {
      return new Query(db, table);
    },
  };
}

test("acquisition helpers normalize sources, limits, and fingerprints", () => {
  assert.deepEqual(normalizeSources(["aqar", "bad", "bayut", "aqar"]), ["aqar", "bayut"]);
  assert.deepEqual(
    normalizeSearchLimits({ max_result_pages_per_source: 9, per_run_timeout_ms: 1 }),
    {
      max_result_pages_per_source: 3,
      max_detail_pages_per_source: 8,
      per_source_timeout_ms: 45000,
      per_run_timeout_ms: 30000,
      retry_transient_failures: true,
    },
  );
  assert.equal(
    buildSourceFingerprint({ source: "aqar", source_url: "https://a.example/1" }).length,
    64,
  );
});

test("candidate screening returns the standard output shape", () => {
  const output = buildScreeningOutput({
    title: "Villa in Riyadh",
    asking_price: 3200000,
    city: "Riyadh",
    district: "Al Arid",
    property_type: "villa",
    area_sqm: 350,
    photo_refs_json: ["https://example.com/photo-1.jpg"],
  }, {
    budget_range_json: { max: 4000000 },
  });

  assert.equal(output.decision, "pursue");
  assert.equal(output.confidence, "high");
  assert.equal(output.nextAction.type, "create_workspace");
  assert(Array.isArray(output.evidenceBackedFacts));
  assert(Array.isArray(output.missingInformation));
});

test("mandate fit ranks matching candidates and passes hard mismatches", () => {
  const mandate = {
    buy_box_json: { property_type: "villa", city: "Riyadh", district: "Al Arid" },
    target_locations_json: ["Al Arid", "North Riyadh"],
    budget_range_json: { max: 4000000 },
  };
  const fit = __test.buildMandateFit({
    title: "فيلا للبيع في حي العارض الرياض",
    asking_price: 3400000,
    city: "Riyadh",
    district: "Al Arid",
    property_type: "villa",
  }, mandate);
  assert.equal(fit.score, 100);

  const mismatch = buildScreeningOutput({
    title: "Apartment in Jeddah",
    asking_price: 900000,
    city: "Jeddah",
    district: "Al Rawdah",
    property_type: "apartment",
    area_sqm: 120,
    photo_refs_json: ["https://example.com/photo-1.jpg"],
  }, mandate);

  assert.equal(mismatch.decision, "pass");
  assert.deepEqual(mismatch.fit.hard_mismatches, ["city", "property_type"]);
});

test("candidate screening watches weak district/budget fits instead of treating them as ranked matches", () => {
  const output = buildScreeningOutput({
    title: "Villa district Hittin Riyadh",
    asking_price: 5200000,
    city: "Riyadh",
    district: "Hittin",
    property_type: "villa",
    area_sqm: 420,
    photo_refs_json: ["https://example.com/photo-1.jpg"],
  }, {
    buy_box_json: { property_type: "villa", city: "Riyadh", district: "Al Arid" },
    target_locations_json: ["Al Arid"],
    budget_range_json: { max: 4000000 },
  });

  assert.equal(output.decision, "watch");
  assert.equal(output.fit.over_budget, true);
  assert(output.fit.score < 70);
});

test("candidate screening creates a gated broker contact diligence item", () => {
  const output = buildScreeningOutput({
    title: "Villa in Riyadh",
    asking_price: 3200000,
    city: "Riyadh",
    district: "Al Arid",
    property_type: "villa",
    area_sqm: 350,
    photo_refs_json: ["photo-1"],
    limited_evidence_snapshot_json: {
      contact_access: { status: "requires_sign_in", reason: "broker_contact_gated" },
    },
  }, {
    budget_range_json: { max: 4000000 },
  });

  assert(
    output.missingInformation.some((item) =>
      item.type === "needs_contact_access" &&
      item.title === "Broker contact requires marketplace access"
    ),
  );
});

test("mandate creation writes acquisition_mandates", async () => {
  const supabase = createMockSupabase();
  const mandate = await __test.createMandate(supabase, {
    workspace_id: "ws_1",
    user_id: "user_1",
    title: "North Riyadh villas",
    buy_box: { property_type: "villa" },
    target_locations: ["North Riyadh"],
    budget_range: { max: 4000000 },
  });

  assert.equal(mandate.workspace_id, "ws_1");
  assert.equal(supabase.db.acquisition_mandates.length, 1);
});

test("first active mandate is free and additional active mandates require payment or approval", async () => {
  const supabase = createMockSupabase({
    profiles: [{
      id: "user_1",
      subscription_tier: "free",
      subscription_status: "active",
    }],
  });

  await __test.createMandate(supabase, {
    workspace_id: "ws_1",
    user_id: "user_1",
    title: "First free mandate",
  });

  await assert.rejects(
    () => __test.createMandate(supabase, {
      workspace_id: "ws_2",
      user_id: "user_1",
      title: "Second mandate",
    }),
    /Additional active mandates require a paid plan or admin approval/,
  );

  supabase.db.profiles[0].subscription_tier = "pro";
  const paidMandate = await __test.createMandate(supabase, {
    workspace_id: "ws_2",
    user_id: "user_1",
    title: "Paid mandate",
  });
  assert.equal(paidMandate.workspace_id, "ws_2");

  supabase.db.profiles[0].subscription_tier = "free";
  const approvedMandate = await __test.createMandate(supabase, {
    workspace_id: "ws_3",
    user_id: "user_1",
    title: "Approved mandate",
    confidence_json: { access: { additional_mandate_approved: true } },
  });
  assert.equal(approvedMandate.workspace_id, "ws_3");
});

test("workspace search-run route helper creates a mandate when needed and queues sourcing", async () => {
  const previousLocation = process.env.GCP_TASKS_LOCATION;
  delete process.env.GCP_TASKS_LOCATION;
  try {
    const supabase = createMockSupabase({
      workspaces: [{
        id: "ws_1",
        owner_id: "user_1",
        org_id: null,
        name: "North Riyadh mandate",
        analysis_brief: "Villa in North Riyadh; SAR 3M-5M",
      }],
    });

    const result = await __test.createWorkspaceSearchRun({
      supabase,
      req: { headers: { host: "example.test" } },
      requestId: "req_1",
      workspaceId: "ws_1",
      userId: "user_1",
      body: {
        instruction: "Prioritize villas with renovation upside.",
        sources: ["aqar", "bayut"],
      },
    });

    assert.equal(supabase.db.acquisition_mandates.length, 1);
    assert.equal(supabase.db.acquisition_search_runs.length, 1);
    assert.equal(result.search_run.workspace_id, "ws_1");
    assert.deepEqual(result.search_run.sources_json, ["aqar", "bayut"]);
    assert.equal(result.search_run.query_description, "Prioritize villas with renovation upside.");
    assert.equal(result.queue.enqueued, false);
  } finally {
    if (previousLocation === undefined) delete process.env.GCP_TASKS_LOCATION;
    else process.env.GCP_TASKS_LOCATION = previousLocation;
  }
});

test("listing intake creates and screens a candidate without search run", async () => {
  const supabase = createMockSupabase();
  const result = await __test.createListingCandidate(supabase, {
    workspace_id: "ws_1",
    user_id: "user_1",
    source_url: "https://example.com/listing/1",
    title: "Villa district Al Arid Riyadh",
    asking_price: 3200000,
    city: "Riyadh",
    district: "Al Arid",
    property_type: "villa",
    area_sqm: 350,
    photo_refs_json: ["photo-1"],
  });

  assert.equal(result.screening.decision, "pursue");
  assert.equal(result.candidate.status, "pursue");
  assert.equal(supabase.db.acquisition_candidate_opportunities.length, 1);
  assert(supabase.db.acquisition_claims.length >= 1);
});

test("candidate promotion creates opportunity, scenario, copied claims, and events", async () => {
  const supabase = createMockSupabase();
  const result = await __test.createListingCandidate(supabase, {
    workspace_id: "ws_1",
    source_url: "https://example.com/listing/2",
    title: "Villa district Hittin Riyadh",
    asking_price: 3800000,
    city: "Riyadh",
    district: "Hittin",
    property_type: "villa",
    area_sqm: 420,
    photo_refs_json: ["https://example.com/photo-1.jpg"],
    latitude: 24.81321,
    longitude: 46.63842,
    location_precision: "exact",
    location_source: "listing_json",
  });

  const promoted = await __test.promoteCandidate(supabase, result.candidate.id);

  assert.equal(promoted.candidate.status, "promoted");
  assert.equal(promoted.opportunity.stage, "workspace_created");
  assert.equal(promoted.opportunity.source_channel, "user_provided_listing");
  assert.deepEqual(promoted.opportunity.metadata_json.photo_refs, ["https://example.com/photo-1.jpg"]);
  assert.equal(promoted.opportunity.metadata_json.latitude, 24.81321);
  assert.equal(promoted.opportunity.metadata_json.longitude, 46.63842);
  assert.equal(promoted.opportunity.metadata_json.location_precision, "exact");
  assert.equal(promoted.opportunity.metadata_json.location_source, "listing_json");
  assert.equal(supabase.db.acquisition_opportunities.length, 1);
  assert.equal(supabase.db.properties?.length || 0, 0);
  assert.equal(supabase.db.acquisition_scenarios.length, 1);
  assert.equal(supabase.db.acquisition_events.length, 2);
  assert(
    supabase.db.acquisition_claims.some((claim) => claim.opportunity_id === promoted.opportunity.id),
  );
});

test("buildCrossListingSignature collapses near-identical listings to the same key", () => {
  const { buildCrossListingSignature } = __test;
  // Same tower, same price, same beds, area drifts by 1 sqm — collide.
  const sigA = buildCrossListingSignature({
    city: "Dubai",
    district: "Jumeirah Bay Island",
    asking_price: 38000000,
    area_sqm: 243,
    bedroom_count: 3,
    property_type: "apartment",
  });
  const sigB = buildCrossListingSignature({
    city: "DUBAI",
    district: "  Jumeirah Bay Island  ",
    asking_price: 38050000,
    area_sqm: 244,
    bedroom_count: 3,
    property_type: "apartment",
  });
  assert.ok(sigA && sigB);
  assert.equal(sigA, sigB);

  // Same tower, very different price (155M Burj Al Arab unit) — distinct.
  const sigC = buildCrossListingSignature({
    city: "Dubai",
    district: "Jumeirah Bay Island",
    asking_price: 155000000,
    area_sqm: 1083,
    bedroom_count: 5,
    property_type: "apartment",
  });
  assert.notEqual(sigA, sigC);

  // Too sparse — should refuse to sign.
  const sigSparse = buildCrossListingSignature({
    city: "Dubai",
    district: "",
    asking_price: null,
    area_sqm: null,
    bedroom_count: 3,
    property_type: "apartment",
  });
  assert.equal(sigSparse, null);
});

test("promoteCandidate attaches cross-listings instead of duplicating opportunities", async () => {
  const supabase = createMockSupabase();
  // First listing: canonical.
  const a = await __test.createListingCandidate(supabase, {
    workspace_id: "ws_dedup",
    source_url: "https://propertyfinder.ae/.../bulgari-6-87049697.html",
    title: "Bulgari Resort Marina View",
    asking_price: 38000000,
    city: "Dubai",
    district: "Jumeirah Bay Island",
    property_type: "apartment",
    area_sqm: 243,
    bedroom_count: 3,
    photo_refs_json: ["https://example.com/a1.jpg"],
  });
  const promotedA = await __test.promoteCandidate(supabase, a.candidate.id);
  assert.equal(promotedA.cross_listing_attached, undefined);
  assert.equal(promotedA.opportunity.stage, "workspace_created");
  assert.equal(supabase.db.acquisition_opportunities.length, 1);

  // Second listing: same tower, same price band, same beds, ±1 sqm.
  // Different broker, different photos. Should attach, not duplicate.
  const b = await __test.createListingCandidate(supabase, {
    workspace_id: "ws_dedup",
    source_url: "https://propertyfinder.ae/.../bulgari-6-84904354.html",
    title: "Bulgari Resort Skyline View",
    asking_price: 38000000,
    city: "Dubai",
    district: "Jumeirah Bay Island",
    property_type: "apartment",
    area_sqm: 244,
    bedroom_count: 3,
    photo_refs_json: ["https://example.com/b1.jpg"],
  });
  const promotedB = await __test.promoteCandidate(supabase, b.candidate.id);
  assert.equal(promotedB.cross_listing_attached, true);
  assert.equal(promotedB.cross_listing_of, promotedA.opportunity.id);
  // Still only one canonical opportunity.
  assert.equal(supabase.db.acquisition_opportunities.length, 1);
  // The canonical opportunity now carries one cross-listing entry.
  const canonical = supabase.db.acquisition_opportunities[0];
  assert.equal(canonical.metadata_json.cross_listings?.length, 1);
  assert.equal(canonical.metadata_json.cross_listings[0].candidate_id, b.candidate.id);
  // The dedup'd candidate is still marked promoted and linked to the canonical opp.
  assert.equal(promotedB.candidate.status, "promoted");
  assert.equal(promotedB.candidate.promoted_opportunity_id, promotedA.opportunity.id);

  // Third listing: same tower but 155M Lighthouse penthouse — genuinely
  // distinct, must NOT attach.
  const c = await __test.createListingCandidate(supabase, {
    workspace_id: "ws_dedup",
    source_url: "https://propertyfinder.ae/.../bulgari-lighthouse-84904267.html",
    title: "Bulgari Lighthouse Burj Al Arab View",
    asking_price: 155000000,
    city: "Dubai",
    district: "Jumeirah Bay Island",
    property_type: "apartment",
    area_sqm: 1083,
    bedroom_count: 5,
    photo_refs_json: ["https://example.com/c1.jpg"],
  });
  const promotedC = await __test.promoteCandidate(supabase, c.candidate.id);
  assert.equal(promotedC.cross_listing_attached, undefined);
  assert.equal(supabase.db.acquisition_opportunities.length, 2);
});

test("acquisition report payload ranks by investment score and structured top_n", async () => {
  const supabase = createMockSupabase({
    acquisition_mandates: [{
      id: "mandate_1",
      workspace_id: "ws_1",
      status: "active",
      title: "North Riyadh villas",
      buy_box_json: { property_type: "villa" },
      target_locations_json: ["Riyadh"],
      budget_range_json: { max: 5000000 },
    }],
    acquisition_search_runs: [],
    acquisition_opportunities: [
      {
        id: "opp_fit",
        workspace_id: "ws_1",
        title: "High fit, lower IQS",
        stage: "workspace_created",
        metadata_json: { fit_score: 95, investment_score: 74, asking_price: 3300000 },
      },
      {
        id: "opp_iqs",
        workspace_id: "ws_1",
        title: "Best investment score",
        stage: "watch",
        metadata_json: {
          fit_score: 70,
          investment_score: 93,
          asking_price: 3000000,
          location: {
            latitude: 24.721111,
            longitude: 46.671222,
            location_precision: "exact",
            location_source: "network_api",
          },
        },
      },
      {
        id: "opp_tail",
        workspace_id: "ws_1",
        title: "Third option",
        stage: "workspace_created",
        metadata_json: { fit_score: 82, investment_score: 61, asking_price: 3100000 },
      },
    ],
    acquisition_candidate_opportunities: [],
    acquisition_claims: [],
    acquisition_diligence_items: [],
    acquisition_scenarios: [],
    acquisition_deal_desk_notes: [],
  });

  const payload = await __test.buildAcquisitionReportPayload(supabase, "ws_1", {
    top_n: 2,
    presentation: { include_ai_analysis: false, hidden_sections: ["renovation"] },
  });

  assert.equal(payload.artifact_kind, "acquisition_report");
  assert.equal(payload.report.title, "North Riyadh villas Acquisition Report");
  assert.equal(payload.presentation.top_n, 2);
  assert.equal(payload.presentation.include_ai_analysis, false);
  assert.deepEqual(payload.ranked_candidates.map((row) => row.title), [
    "Best investment score",
    "High fit, lower IQS",
  ]);
  assert.equal(payload.ranked_candidates[0].latitude, 24.721111);
  assert.equal(payload.ranked_candidates[0].longitude, 46.671222);
  assert.equal(payload.ranked_candidates[0].location_precision, "exact");
  assert.equal(payload.ranked_candidates[0].location_source, "network_api");
  assert.doesNotMatch(payload.ranked_candidates[0].map_query, /Riyadh/);
});

test("weekly acquisition report creation is idempotent by mandate period", async () => {
  const supabase = createMockSupabase({
    acquisition_mandates: [{
      id: "mandate_1",
      workspace_id: "ws_1",
      status: "active",
      title: "Weekly mandate",
      buy_box_json: {},
      target_locations_json: [],
      budget_range_json: {},
    }],
    acquisition_search_runs: [],
    acquisition_opportunities: [{
      id: "opp_1",
      workspace_id: "ws_1",
      title: "Weekly candidate",
      stage: "workspace_created",
      metadata_json: {
        investment_score: 88,
        asking_price: 3000000,
        acquisition_price: 2950000,
        area_sqm: 360,
        property_type: "villa",
        city: "Riyadh",
        district: "Al Arid",
        latitude: 24.81321,
        longitude: 46.63842,
        location_precision: "exact",
        location_source: "listing_json",
      },
      renovation_capex_json: { base_total: 180000, low_total: 130000, high_total: 260000 },
    }],
    acquisition_candidate_opportunities: [],
    acquisition_claims: [],
    acquisition_diligence_items: [],
    acquisition_scenarios: [],
    acquisition_deal_desk_reports: [],
    acquisition_deal_desk_notes: [],
  });

  const first = await __test.createAcquisitionReport(supabase, "ws_1", {
    mandate_id: "mandate_1",
    report_period: "2026-W20",
    schedule_kind: "weekly",
  }, { requestId: "req_1", idempotent: true });
  const second = await __test.createAcquisitionReport(supabase, "ws_1", {
    mandate_id: "mandate_1",
    report_period: "2026-W20",
    schedule_kind: "weekly",
  }, { requestId: "req_2", idempotent: true });

  assert.equal(first.report_id, second.report_id);
  assert.equal(second.idempotent, true);
  assert.equal(supabase.db.acquisition_deal_desk_reports.length, 1);
  assert.equal(supabase.db.acquisition_deal_desk_reports[0].artifact_kind, "acquisition_report");
  assert.equal(supabase.db.acquisition_deal_desk_reports[0].presentation_json.top_n, 5);
  assert.equal(supabase.db.acquisition_scenarios.length, 1);
  const reportPayload = supabase.db.acquisition_deal_desk_reports[0].payload_json;
  assert.equal(reportPayload.computed_outputs.underwriting_runs, 1);
  assert(Number.isFinite(reportPayload.ranked_candidates[0].modeled_yield_pct));
  assert.equal(reportPayload.ranked_candidates[0].economics_snapshot.status, "complete");
  assert(reportPayload.ranked_candidates[0].economics_snapshot.headline_metrics.equity_required > 0);
  assert(reportPayload.ranked_candidates[0].economics_snapshot.cash_flow.annual.length >= 1);
  assert.equal(reportPayload.ranked_candidates[0].economics_snapshot.return_sensitivity[1].label, "Base");
  assert.equal(reportPayload.ranked_candidates[0].location_source, "listing_json");
  assert.equal(supabase.db.acquisition_opportunities[0].metadata_json.location_analysis.max, 15);
});

test("free weekly reports pause after the second report until buyer is qualified", async () => {
  const baseMandate = {
    id: "mandate_1",
    workspace_id: "ws_1",
    user_id: "user_1",
    status: "active",
    title: "Free weekly mandate",
    buy_box_json: {},
    target_locations_json: [],
    budget_range_json: {},
  };
  const supabase = createMockSupabase({
    profiles: [{
      id: "user_1",
      subscription_tier: "free",
      subscription_status: "active",
    }],
    acquisition_mandates: [baseMandate],
    acquisition_search_runs: [],
    acquisition_opportunities: [{
      id: "opp_1",
      workspace_id: "ws_1",
      title: "Weekly candidate",
      stage: "workspace_created",
      metadata_json: { investment_score: 80, asking_price: 3000000, property_type: "villa" },
    }],
    acquisition_candidate_opportunities: [],
    acquisition_claims: [],
    acquisition_diligence_items: [],
    acquisition_scenarios: [],
    acquisition_deal_desk_reports: [
      { id: "report_1", workspace_id: "ws_1", mandate_id: "mandate_1", report_period: "2026-W18", schedule_kind: "weekly", artifact_kind: "acquisition_report", status: "assembled" },
      { id: "report_2", workspace_id: "ws_1", mandate_id: "mandate_1", report_period: "2026-W19", schedule_kind: "weekly", artifact_kind: "acquisition_report", status: "assembled" },
    ],
    acquisition_deal_desk_notes: [],
    buyer_readiness_profiles: [],
  });

  const paused = await __test.createAcquisitionReport(supabase, "ws_1", {
    mandate_id: "mandate_1",
    report_period: "2026-W20",
    schedule_kind: "weekly",
  }, { requestId: "req_paused", idempotent: true });

  assert.equal(paused.status, "paused");
  assert.equal(paused.paused, true);
  assert.equal(paused.free_report_count, 2);
  assert.equal(supabase.db.acquisition_deal_desk_reports.length, 2);

  supabase.db.buyer_readiness_profiles.push({
    id: "profile_1",
    workspace_id: "ws_1",
    mandate_id: "mandate_1",
    readiness_level: 4,
    evidence_status: "verified",
    kyc_state: "buyer_verified",
    brokerage_status: "not_started",
  });

  const resumed = await __test.createAcquisitionReport(supabase, "ws_1", {
    mandate_id: "mandate_1",
    report_period: "2026-W20",
    schedule_kind: "weekly",
  }, { requestId: "req_resumed", idempotent: true });

  assert.equal(resumed.status, "assembled");
  assert.equal(supabase.db.acquisition_deal_desk_reports.length, 3);
});

test("manual listing intake records manual source metadata", async () => {
  const supabase = createMockSupabase();
  const result = await __test.createListingCandidate(supabase, {
    workspace_id: "ws_1",
    source: "manual_operator",
    manual_entry: true,
    title: "Manually added villa",
    asking_price: 3000000,
    city: "Riyadh",
    district: "Al Arid",
    property_type: "villa",
    area_sqm: 360,
  });

  const promoted = await __test.promoteCandidate(supabase, result.candidate.id);

  assert.equal(promoted.opportunity.source_channel, "manual_operator");
  assert.equal(promoted.opportunity.metadata_json.source, "manual_operator");
  assert.equal(promoted.opportunity.metadata_json.source_fingerprint, result.candidate.source_fingerprint);
  assert.equal(result.candidate.limited_evidence_snapshot_json.intake_mode, "manual_user_entry");
});

test("marketplace promotion preserves portal source channel", async () => {
  const supabase = createMockSupabase();
  const result = await __test.createListingCandidate(supabase, {
    workspace_id: "ws_1",
    source: "property_finder",
    source_url: "https://www.propertyfinder.ae/en/plp/buy/apartment-for-sale-dubai-marina-12345678.html",
    title: "Dubai Marina apartment",
    asking_price: 2200000,
    city: "Dubai",
    district: "Dubai Marina",
    property_type: "apartment",
    area_sqm: 110,
  });

  const promoted = await __test.promoteCandidate(supabase, result.candidate.id);

  assert.equal(promoted.opportunity.source_channel, "property_finder");
  assert.equal(promoted.opportunity.metadata_json.original_source_channel, "property_finder");
});

test("investment scorer reads country and currency from limited evidence snapshot", async () => {
  const supabase = createMockSupabase({
    acquisition_market_observations: [
      {
        district: "Dubai Marina",
        year_number: 2025,
        quarter_number: 4,
        average_price_per_sqm: 48000,
        min_price_per_sqm: 42000,
        max_price_per_sqm: 56000,
        transaction_count: 85,
        property_type: "apartment",
        country_code: "AE",
      },
      {
        district: "Dubai Marina",
        year_number: 2026,
        quarter_number: 1,
        average_price_per_sqm: 50000,
        min_price_per_sqm: 44000,
        max_price_per_sqm: 59000,
        transaction_count: 110,
        property_type: "apartment",
        country_code: "AE",
      },
    ],
  });

  const score = await computeInvestmentScore({
    supabase,
    candidate: {
      source_url: "https://www.propertyfinder.ae/en/plp/buy/apartment-for-sale-dubai-marina-12345678.html",
      asking_price: 2_200_000,
      area_sqm: 110,
      district: "Dubai Marina",
      property_type: "apartment",
      photo_refs_json: ["https://example.com/photo-1.jpg", "https://example.com/photo-2.jpg", "https://example.com/photo-3.jpg"],
      limited_evidence_snapshot_json: {
        country_code: "AE",
        currency: "AED",
        asking_price_native: 2_200_000,
      },
    },
    mandate: {
      target_country_codes: ["AE", "ES"],
      budget_currency: "AED",
      budget_range_json: { min: 1_800_000, max: 3_000_000 },
    },
  });

  assert.equal(score.country_code, "AE");
  assert.equal(score.listing_currency, "AED");
  assert.equal(score.breakdown.p1_price_efficiency.market_avg_psm_sar, 51000);
  assert.equal(score.breakdown.p5_budget_position.budget_currency, "AED");
});

test("rejecting an opportunity archives its candidate so future upserts stay suppressed", async () => {
  const supabase = createMockSupabase();
  const result = await __test.createListingCandidate(supabase, {
    workspace_id: "ws_1",
    source: "aqar",
    source_url: "https://sa.aqar.fm/123456",
    title: "Villa district Al Arid Riyadh",
    asking_price: 3200000,
    city: "Riyadh",
    district: "Al Arid",
    property_type: "villa",
    area_sqm: 350,
  });
  const promoted = await __test.promoteCandidate(supabase, result.candidate.id);

  const rejected = await __test.updateOpportunityStage(supabase, promoted.opportunity.id, {
    stage: "archived",
    suppress_source: true,
  });
  const repeated = await __test.upsertCandidateDraft(supabase, {
    workspace_id: "ws_1",
    source: "aqar",
    source_url: "https://sa.aqar.fm/123456",
    title: "Villa district Al Arid Riyadh",
    asking_price: 3200000,
    city: "Riyadh",
    district: "Al Arid",
    property_type: "villa",
    area_sqm: 350,
  });

  assert.equal(rejected.stage, "archived");
  assert.equal(supabase.db.acquisition_candidate_opportunities[0].status, "archived");
  assert.equal(repeated.suppressed_by_workspace, true);
  assert.equal(supabase.db.acquisition_events.at(-1).event_type, "opportunity_rejected");
});

test("late pipeline stages require buyer qualification or admin override", async () => {
  const supabase = createMockSupabase({
    acquisition_opportunities: [{
      id: "opp_1",
      workspace_id: "ws_1",
      mandate_id: "mandate_1",
      stage: "workspace_created",
      metadata_json: {},
    }],
    buyer_readiness_profiles: [{
      id: "profile_1",
      workspace_id: "ws_1",
      mandate_id: "mandate_1",
      readiness_level: 2,
      evidence_status: "self_declared",
      kyc_state: "not_started",
      brokerage_status: "not_started",
      visit_readiness: "available this week",
    }],
    acquisition_events: [],
  });

  await assert.rejects(
    () => __test.updateOpportunityStage(supabase, "opp_1", { stage: "visit_requested" }),
    /Buyer readiness verification required/,
  );

  await __test.attachReadinessEvidence(supabase, "profile_1", { evidence_type: "identity", status: "verified" });
  await __test.attachReadinessEvidence(supabase, "profile_1", { evidence_type: "proof_of_funds", status: "verified" });
  await __test.attachReadinessEvidence(supabase, "profile_1", { evidence_type: "offer_readiness", status: "verified" });
  const advanced = await __test.updateOpportunityStage(supabase, "opp_1", { stage: "visit_requested" });
  assert.equal(advanced.stage, "visit_requested");

  supabase.db.buyer_readiness_profiles[0].readiness_level = 1;
  const overridden = await __test.updateOpportunityStage(supabase, "opp_1", {
    stage: "offer",
    admin_override: true,
    allow_admin_override: true,
    override_reason: "operator_manual_review",
  });
  assert.equal(overridden.stage, "offer");
  assert.equal(overridden.metadata_json.pipeline_gate.admin_override, true);
});

test("underwriting run persists versioned assumptions and outputs on base scenario", async () => {
  const supabase = createMockSupabase({
    workspaces: [{ id: "ws_1", owner_id: "user_1", org_id: null }],
    acquisition_opportunities: [{
      id: "opp_1",
      workspace_id: "ws_1",
      title: "Riyadh villa",
      metadata_json: {
        asking_price: 3200000,
        acquisition_price: 3100000,
        monthly_rent: 15417,
        property_type: "villa",
      },
      renovation_capex_json: {
        low_total: 180000,
        base_total: 260000,
        high_total: 420000,
      },
    }],
    acquisition_mandates: [{
      id: "mandate_1",
      workspace_id: "ws_1",
      budget_range_json: { max: 4000000 },
      buy_box_json: { property_type: "villa" },
      target_locations_json: ["Riyadh"],
    }],
    acquisition_scenarios: [],
  });

  const result = await runAndPersistUnderwriting({
    supabase,
    opportunityId: "opp_1",
    input: { mode: "quick", target_irr_pct: 8 },
    userId: "user_1",
  });

  assert.equal(result.underwriting.status, "complete");
  assert.equal(supabase.db.acquisition_scenarios.length, 1);
  const saved = supabase.db.acquisition_scenarios[0];
  assert.equal(saved.scenario_kind, "base");
  assert.equal(saved.assumptions_json.underwriting_engine_version, "underwriting/v1");
  assert.equal(saved.outputs_json.underwriting.underwriting_engine_version, "underwriting/v1");
  assert(saved.outputs_json.underwriting.summary.max_bid > 0);
});

test("underwriting run rejects users without workspace write access", async () => {
  const supabase = createMockSupabase({
    workspaces: [{ id: "ws_1", owner_id: "user_1", org_id: null }],
    acquisition_opportunities: [{
      id: "opp_1",
      workspace_id: "ws_1",
      metadata_json: { acquisition_price: 3100000, monthly_rent: 15000 },
      renovation_capex_json: { base_total: 200000 },
    }],
    acquisition_scenarios: [],
  });

  await assert.rejects(
    () => runAndPersistUnderwriting({
      supabase,
      opportunityId: "opp_1",
      input: { mode: "quick" },
      userId: "user_2",
    }),
    /workspace_write_access_denied/,
  );
});

test("buyer readiness profile computes transaction readiness from verified evidence", async () => {
  const supabase = createMockSupabase();
  const profile = await __test.createReadinessProfile(supabase, {
    workspace_id: "ws_1",
    user_id: "user_1",
    buyer_type: "individual",
    mandate_summary: "Villa in North Riyadh, SAR 3M-5M",
    funding_path: "cash",
    visit_readiness: "available this week",
  });

  const identity = await __test.attachReadinessEvidence(supabase, profile.id, {
    evidence_type: "identity",
    status: "verified",
    user_id: "operator_1",
    sensitivity_level: "identity",
  });
  await __test.attachReadinessEvidence(supabase, profile.id, {
    evidence_type: "proof_of_funds",
    status: "verified",
    user_id: "operator_1",
    sensitivity_level: "financial",
  });
  await __test.attachReadinessEvidence(supabase, profile.id, {
    evidence_type: "offer_readiness",
    status: "verified",
    user_id: "operator_1",
  });

  let recomputed = await __test.recomputeReadinessProfile(supabase, profile.id);
  assert.equal(recomputed.profile.readiness_level, 4);
  assert.equal(recomputed.profile.evidence_status, "verified");
  assert.equal(identity.status, "verified");

  await __test.createKycCase(supabase, {
    buyer_profile_id: profile.id,
    state: "brokerage_ready",
  });
  await __test.createBrokerageAgreement(supabase, {
    buyer_profile_id: profile.id,
    status: "active",
    effective_at: new Date(Date.now() - 1000).toISOString(),
  });
  recomputed = await __test.recomputeReadinessProfile(supabase, profile.id);
  assert.equal(recomputed.profile.readiness_level, 5);
  assert.equal(recomputed.profile.kyc_state, "brokerage_ready");
  assert.equal(recomputed.profile.brokerage_status, "signed");
});

test("document sharing grants default financial evidence to status-only", async () => {
  const supabase = createMockSupabase();
  const grant = await __test.createDocumentSharingGrant(supabase, {
    document_id: "doc_1",
    workspace_id: "ws_1",
    buyer_profile_id: "profile_1",
    purpose: "proof of funds readiness signal",
    document_kind: "financial",
    allowed_action: "share_document",
  });

  assert.equal(grant.share_mode, "status_only");
  assert.equal(grant.allowed_action, "share_document");
});

test("revokeBuyerPacketGrant flips the grant and logs a consent_revoked broker event", async () => {
  const supabase = createMockSupabase({
    document_sharing_grants: [{
      id: "grant_1",
      workspace_id: "ws_1",
      buyer_profile_id: "profile_1",
      granted_to_kind: "broker",
      granted_to_identifier: "broker_1",
      share_mode: "status_only",
      allowed_action: "share_status",
      purpose: "share_buyer_readiness_with_broker",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      revoked_at: null,
      revoked_reason: null,
      metadata_json: { buyer_packet_id: "packet_1" },
    }],
    broker_partners: [{
      id: "broker_1",
      display_name: "Test Broker",
      country_code: "AE",
      status: "active",
    }],
    broker_events: [],
  });

  const result = await __test.revokeBuyerPacketGrant(supabase, "grant_1", {
    reason: "revoked_by_buyer",
  });

  assert.equal(result.already_revoked, false);
  assert.ok(result.grant.revoked_at, "revoked_at should be set");
  assert.equal(result.grant.revoked_reason, "revoked_by_buyer");

  // Subsequent revoke should be idempotent (no double-billing the broker).
  const repeat = await __test.revokeBuyerPacketGrant(supabase, "grant_1", {
    reason: "revoked_by_buyer",
  });
  assert.equal(repeat.already_revoked, true);

  const events = supabase.db.broker_events || [];
  const consentRevokeEvents = events.filter((e) => e.event_type === "consent_revoked");
  assert.equal(consentRevokeEvents.length, 1, "exactly one consent_revoked event should be logged");
  assert.equal(consentRevokeEvents[0].broker_partner_id, "broker_1");
  assert.equal(consentRevokeEvents[0].metadata_json?.sharing_grant_id, "grant_1");
  assert.equal(consentRevokeEvents[0].metadata_json?.buyer_packet_id, "packet_1");
});

test("computeScorecardFromEvents penalises consent revocations under the compliance pillar", () => {
  const clean = __test.computeScorecardFromEvents([
    { event_type: "intro_sent" },
    { event_type: "first_response", response_latency_seconds: 600 },
  ]);
  const withRevocations = __test.computeScorecardFromEvents([
    { event_type: "intro_sent" },
    { event_type: "first_response", response_latency_seconds: 600 },
    { event_type: "consent_revoked" },
    { event_type: "consent_revoked" },
  ]);
  assert.ok(
    withRevocations.compliance_pts < clean.compliance_pts,
    "two consent revocations should reduce the compliance pillar",
  );
  assert.equal(withRevocations.inputs_json.consent_revocations, 2);
});

test("revokeBuyerPacketGrant rejects unknown grant ids with 404", async () => {
  const supabase = createMockSupabase({ document_sharing_grants: [] });
  await assert.rejects(
    () => __test.revokeBuyerPacketGrant(supabase, "11111111-1111-1111-1111-111111111111", {}),
    (err) => err.statusCode === 404 && /sharing_grant_not_found/.test(err.message),
  );
});

test("approval-gated actions require brokerage authority before execution", async () => {
  const supabase = createMockSupabase({
    buyer_readiness_profiles: [{
      id: "profile_1",
      workspace_id: "ws_1",
      buyer_type: "individual",
      mandate_summary: "North Riyadh villas",
      visit_readiness: "available this week",
      brokerage_status: "not_started",
      kyc_state: "not_started",
      evidence_status: "self_declared",
      readiness_level: 1,
    }],
  });
  const approval = await __test.createExternalActionApproval(supabase, {
    workspace_id: "ws_1",
    opportunity_id: "opp_1",
    buyer_profile_id: "profile_1",
    action_type: "send_outreach",
    draft_payload: { message: "Zohal represents a verified buyer mandate." },
  });

  await assert.rejects(
    () => __test.approveExternalAction(supabase, approval.id, { user_id: "operator_1" }),
    /Buyer readiness verification required/,
  );

  await __test.attachReadinessEvidence(supabase, "profile_1", { evidence_type: "identity", status: "verified" });
  await __test.attachReadinessEvidence(supabase, "profile_1", { evidence_type: "proof_of_funds", status: "verified" });
  await __test.attachReadinessEvidence(supabase, "profile_1", { evidence_type: "offer_readiness", status: "verified" });

  await assert.rejects(
    () => __test.approveExternalAction(supabase, approval.id, { user_id: "operator_1" }),
    /Active brokerage agreement required/,
  );

  await __test.createBrokerageAgreement(supabase, {
    buyer_profile_id: "profile_1",
    status: "active",
    effective_at: new Date(Date.now() - 1000).toISOString(),
  });
  const approved = await __test.approveExternalAction(supabase, approval.id, { user_id: "operator_1" });
  assert.equal(approved.approval_status, "approved");

  const executed = await __test.executeExternalAction(supabase, approved.id, { user_id: "operator_1" });
  assert.equal(executed.approval_status, "executed");
  assert.equal(supabase.db.acquisition_events.length, 1);
  assert.equal(supabase.db.acquisition_events[0].event_type, "external_action_executed");
});

test("high severity KYC flags restrict readiness", async () => {
  const supabase = createMockSupabase();
  const profile = await __test.createReadinessProfile(supabase, {
    workspace_id: "ws_1",
    buyer_type: "company",
    mandate_summary: "Residential acquisition mandate",
    visit_readiness: "available this week",
  });
  await __test.attachReadinessEvidence(supabase, profile.id, { evidence_type: "commercial_registration", status: "verified" });
  await __test.attachReadinessEvidence(supabase, profile.id, { evidence_type: "company_authorization", status: "verified" });
  await __test.attachReadinessEvidence(supabase, profile.id, { evidence_type: "beneficial_owner", status: "verified" });
  await __test.attachReadinessEvidence(supabase, profile.id, { evidence_type: "proof_of_funds", status: "verified" });
  await __test.attachReadinessEvidence(supabase, profile.id, { evidence_type: "offer_readiness", status: "verified" });
  const kyc = await __test.createKycCase(supabase, {
    buyer_profile_id: profile.id,
    state: "buyer_verified",
  });

  const flagged = await __test.createKycRiskFlag(supabase, kyc.kyc_case.id, {
    flag_type: "beneficial_owner_missing",
    severity: "high",
  });

  assert.equal(flagged.profile.kyc_state, "escalated");
  assert.equal(flagged.profile.readiness_level, 2);
});
