import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { canRouteOperator, handleMihadApi, isMihadApiRoute } from "../src/handlers/mihad-api.js";

const USER_ID = "00000000-0000-4000-8000-00000000a001";
const WORKSPACE_ID = "00000000-0000-4000-8000-00000000b001";

function makeId(table) {
  return `${table}_${crypto.randomUUID()}`;
}

class Query {
  constructor(db, table) {
    this.db = db;
    this.table = table;
    this.filters = [];
    this.limitCount = null;
    this.pending = null;
    this.pendingUpdate = null;
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

  order() {
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  _matches(row) {
    return this.filters.every((filter) => {
      if (filter.op === "neq") return row[filter.field] !== filter.value;
      if (filter.op === "in") return filter.values.has(row[filter.field]);
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
    return { data: rows[0] || null, error: rows[0] ? null : new Error(`${this.table}_not_found`) };
  }

  async maybeSingle() {
    if (this.pending) return { data: Array.isArray(this.pending) ? this.pending[0] : this.pending, error: null };
    return { data: this._rows()[0] || null, error: null };
  }

  then(resolve, reject) {
    const result = this.pending
      ? { data: this.pending, error: null }
      : { data: this._rows(), error: null };
    return Promise.resolve(result).then(resolve, reject);
  }
}

function createMockSupabase(seed = {}) {
  const db = {
    organizations: [],
    workspace_members: [],
    ...seed,
  };
  return {
    db,
    from(table) {
      return new Query(db, table);
    },
  };
}

function createRes() {
  return {
    status: null,
    body: null,
    headers: null,
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(value) {
      this.body = JSON.parse(value);
    },
  };
}

async function invoke(supabase, method, path, body = {}) {
  process.env.INTERNAL_FUNCTION_JWT = "test-internal-token";
  const res = createRes();
  await handleMihadApi(
    {
      method,
      url: path,
      headers: {
        "x-internal-function-jwt": "test-internal-token",
      },
    },
    res,
    {
      requestId: "req_test",
      readJsonBody: async () => body,
      supabase,
    },
  );
  return res;
}

function baseSupabase() {
  return createMockSupabase({
    workspaces: [{
      id: WORKSPACE_ID,
      owner_id: USER_ID,
      org_id: null,
      workspace_kind: "mihad_buyer_desk",
    }],
  });
}

test("Mihad API route matcher exposes the reset buyer workflow and not acquisition routes", () => {
  assert.equal(isMihadApiRoute("POST", "/api/mihad/v1/mandates"), true);
  assert.equal(isMihadApiRoute("POST", "/api/mihad/v1/activation-mandates"), true);
  assert.equal(isMihadApiRoute("POST", "/api/mihad/v1/activation-mandates/mandate_1/land-sourcing"), true);
  assert.equal(isMihadApiRoute("GET", "/api/mihad/v1/activation-mandates/mandate_1/represented-inventory"), true);
  assert.equal(isMihadApiRoute("POST", "/api/mihad/v1/activation-deals/option_1/prefab-estimate"), true);
  assert.equal(isMihadApiRoute("POST", "/api/mihad/v1/source-runs/run_1/execute"), true);
  assert.equal(isMihadApiRoute("POST", "/api/mihad/v1/rfqs/rfq_1/land-sourcing"), true);
  assert.equal(isMihadApiRoute("POST", "/api/acquisition/v1/workspaces/ws/search-runs"), false);
});

test("legacy public scout and acquisition intent routes are removed", () => {
  const repoRoot = join(import.meta.dirname, "..");
  const serverSource = readFileSync(join(repoRoot, "src/server.js"), "utf8");

  assert.equal(serverSource.includes("/internal/acquisition/intent/parse"), false);
  assert.equal(serverSource.includes("/internal/acquisition/intent/preview"), false);
  assert.equal(serverSource.includes("/internal/activation/concierge/parse"), false);
  assert.equal(serverSource.includes("handleWhatsappOrchestrate"), false);
  assert.equal(existsSync(join(repoRoot, "src/mihad/intent.js")), false);
  assert.equal(existsSync(join(repoRoot, "src/mihad/preview.js")), false);
});

test("mandate creation writes buyer entity, mandate, and prefab RFQ", async () => {
  const supabase = baseSupabase();
  const res = await invoke(supabase, "POST", "/api/mihad/v1/mandates", {
    user_id: USER_ID,
    workspace_id: WORKSPACE_ID,
    title: "Riyadh prefab family home",
    buyer_display_name: "E2E Buyer",
    target_country_codes: ["SA"],
    budget_range: { min: 400000, max: 900000, currency: "SAR" },
    rfq: {
      city: "Riyadh",
      land_status: "owned",
      prefab_category: "villa",
      target_size: { min_sqm: 140, max_sqm: 190 },
    },
  });

  assert.equal(res.status, 201);
  assert.equal(supabase.db.buyer_entities.length, 1);
  assert.equal(supabase.db.buyer_mandates.length, 1);
  assert.equal(supabase.db.rfqs.length, 1);
  assert.equal(res.body.mandate.title, "Riyadh prefab family home");
  assert.equal(res.body.rfq.vertical, "prefab");
});

test("activation land source run execution completes and manual sourced options require source attribution", async () => {
  const supabase = baseSupabase();
  supabase.db.buyer_mandates = [{ id: "mandate_1", workspace_id: WORKSPACE_ID, user_id: USER_ID, target_country_codes: ["SA"] }];
  supabase.db.rfqs = [{ id: "rfq_1", workspace_id: WORKSPACE_ID, mandate_id: "mandate_1" }];

  const created = await invoke(supabase, "POST", "/api/mihad/v1/source-runs", {
    user_id: USER_ID,
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    rfq_id: "rfq_1",
    query_text: "Riyadh prefab villa options",
    sources: ["manual"],
    trigger_kind: "activation_land_sourcing",
  });
  assert.equal(created.status, 202);

  const runId = created.body.source_run.id;
  const executed = await invoke(supabase, "POST", `/api/mihad/v1/source-runs/${runId}/execute`, {
    user_id: USER_ID,
  });
  assert.equal(executed.status, 200);
  assert.equal(executed.body.source_run.status, "completed");

  const option = await invoke(supabase, "POST", "/api/mihad/v1/sourced-options", {
    user_id: USER_ID,
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    rfq_id: "rfq_1",
    source_run_id: runId,
    source_kind: "supplier",
    source_name: "Najd Modular Homes",
    source_url: "https://supplier.example/najd-family-villa-180",
    title: "Najd Family Villa 180",
    price_amount: 780000,
    price_currency: "SAR",
    evidence_snapshot: { captured_from: "supplier_profile" },
  });
  assert.equal(option.status, 201);
  assert.equal(supabase.db.sourced_options.length, 1);
  assert.equal(supabase.db.option_sources.length, 1);
  assert.equal(supabase.db.option_sources[0].source_name, "Najd Modular Homes");
});

test("generic source run creation is no longer a public product entrypoint", async () => {
  const supabase = baseSupabase();
  supabase.db.buyer_mandates = [{ id: "mandate_1", workspace_id: WORKSPACE_ID, user_id: USER_ID, target_country_codes: ["SA"] }];

  const created = await invoke(supabase, "POST", "/api/mihad/v1/source-runs", {
    user_id: USER_ID,
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    query_text: "generic search",
  });
  assert.equal(created.status, 410);
  assert.equal(created.body.error, "generic_source_runs_disabled_use_activation_land_sourcing");
});

test("packet, sharing grant, revoke, and approval gate stay on derived/consent contracts", async () => {
  const supabase = baseSupabase();
  supabase.db.buyer_mandates = [{ id: "mandate_1", workspace_id: WORKSPACE_ID, user_id: USER_ID }];
  supabase.db.buyer_readiness_profiles = [{
    id: "profile_1",
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    buyer_type: "individual",
    readiness_level: 3,
    evidence_status: "partially_verified",
    verification_confidence: "medium",
    mandate_summary: "Prefab home in Riyadh",
    funding_path: "cash_ready",
  }];
  supabase.db.partners = [{
    id: "partner_1",
    partner_kind: "prefab_supplier",
    display_name: "Najd Modular Homes",
    country_code: "SA",
    status: "active",
  }];

  const packet = await invoke(supabase, "POST", "/api/mihad/v1/buyer-packets", {
    user_id: USER_ID,
    buyer_profile_id: "profile_1",
  });
  assert.equal(packet.status, 201);
  assert.equal(packet.body.buyer_packet.snapshot_json.raw_documents_included, false);
  assert.equal(packet.body.buyer_packet.snapshot_json.document_id, undefined);

  const grant = await invoke(supabase, "POST", `/api/mihad/v1/buyer-packets/${packet.body.buyer_packet.id}/grants`, {
    user_id: USER_ID,
    partner_id: "partner_1",
    purpose: "supplier_intro",
  });
  assert.equal(grant.status, 201);
  assert.equal(grant.body.sharing_grant.share_mode, "derived_only");

  const revoked = await invoke(supabase, "POST", `/api/mihad/v1/sharing-grants/${grant.body.sharing_grant.id}/revoke`, {
    user_id: USER_ID,
    revoked_reason: "test_revoked",
  });
  assert.equal(revoked.status, 200);
  assert.equal(revoked.body.sharing_grant.revoked_reason, "test_revoked");

  const approval = await invoke(supabase, "POST", "/api/mihad/v1/approval-gates", {
    user_id: USER_ID,
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    buyer_profile_id: "profile_1",
    partner_id: "partner_1",
    action_type: "supplier_intro",
    draft_payload: { intro: "Supplier introduction draft" },
  });
  assert.equal(approval.status, 201);
  assert.equal(approval.body.approval_gate.approval_status, "pending");
  assert.equal(supabase.db.approval_gates.length, 1);
});

test("operator hard stops block operator approval gates without explicit override", async () => {
  const supabase = baseSupabase();
  const blocked = canRouteOperator({
    hard_stops: ["no_tenant_commitment", "weak_fixed_cost_coverage"],
  });
  assert.equal(blocked.allowed, false);

  const approval = await invoke(supabase, "POST", "/api/mihad/v1/approval-gates", {
    user_id: USER_ID,
    workspace_id: WORKSPACE_ID,
    action_type: "operator_contact",
    draft_payload: {
      route_recommendation: "operator_candidate",
      activation_scoring: {
        hard_stops: ["no_tenant_commitment"],
      },
    },
  });
  assert.equal(approval.status, 409);
  assert.equal(approval.body.error, "operator_hard_stops_not_cleared");

  const override = await invoke(supabase, "POST", "/api/mihad/v1/approval-gates", {
    user_id: USER_ID,
    workspace_id: WORKSPACE_ID,
    action_type: "operator_contact",
    draft_payload: {
      route_recommendation: "operator_candidate",
      activation_scoring: {
        hard_stops: ["no_tenant_commitment"],
      },
      admin_override: {
        reviewer: USER_ID,
        reason: "Founder-reviewed trial exception",
      },
    },
  });
  assert.equal(override.status, 201);
  assert.equal(override.body.approval_gate.draft_payload_json.admin_override.reviewer, USER_ID);
  assert.deepEqual(override.body.approval_gate.draft_payload_json.admin_override.hard_stop_snapshot, ["no_tenant_commitment"]);
});

test("activation land sourcing creates operator source runs only from qualified tenant demand", async () => {
  const supabase = baseSupabase();
  supabase.db.buyer_mandates = [{ id: "mandate_1", workspace_id: WORKSPACE_ID, user_id: USER_ID, target_country_codes: ["SA"] }];
  supabase.db.rfqs = [{
    id: "rfq_qualified",
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    activation_party_type: "tenant",
    activation_score_json: { tenant_demand_score: 10 },
    metadata_json: {
      activation_request: {
        party_type: "tenant",
        city: "Riyadh",
        district: "Al Arid",
        business_activity: "vehicle_showroom",
        required_land_area_sqm: 1500,
      },
    },
    qualification_json: {},
  }];

  const created = await invoke(supabase, "POST", "/api/mihad/v1/rfqs/rfq_qualified/land-sourcing", {
    user_id: USER_ID,
  });
  assert.equal(created.status, 202);
  assert.equal(created.body.operator_only, true);
  assert.equal(created.body.source_run.trigger_kind, "activation_land_sourcing");
  assert.equal(created.body.source_run.rfq_id, "rfq_qualified");

  supabase.db.rfqs.push({
    id: "rfq_unqualified",
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    activation_party_type: "tenant",
    activation_score_json: { tenant_demand_score: 3 },
    metadata_json: { activation_request: { party_type: "tenant", city: "Riyadh" } },
    qualification_json: {},
  });
  const rejected = await invoke(supabase, "POST", "/api/mihad/v1/rfqs/rfq_unqualified/land-sourcing", {
    user_id: USER_ID,
  });
  assert.equal(rejected.status, 422);
  assert.equal(rejected.body.error, "tenant_demand_not_qualified_for_land_sourcing");
});

test("represented inventory and supplier fetches do not create source runs", async () => {
  const supabase = baseSupabase();
  supabase.db.buyer_mandates = [{ id: "mandate_1", workspace_id: WORKSPACE_ID, user_id: USER_ID }];
  supabase.db.sourced_options = [{
    id: "option_1",
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    source_kind: "represented_inventory",
    title: "Represented commercial frontage",
    city: "Riyadh",
  }];
  supabase.db.partners = [{
    id: "supplier_1",
    partner_kind: "prefab_supplier",
    display_name: "Najd Modular",
    country_code: "SA",
    status: "active",
  }];

  const inventory = await invoke(supabase, "GET", `/api/mihad/v1/activation-mandates/mandate_1/represented-inventory?city=Riyadh&user_id=${USER_ID}`);
  assert.equal(inventory.status, 200);
  assert.equal(inventory.body.mode, "represented_inventory_fetch");
  assert.equal(inventory.body.options.length, 1);

  const suppliers = await invoke(supabase, "GET", `/api/mihad/v1/activation-mandates/mandate_1/supplier-matches?country_code=SA&user_id=${USER_ID}`);
  assert.equal(suppliers.status, 200);
  assert.equal(suppliers.body.mode, "supplier_catalog_fetch");
  assert.equal(suppliers.body.suppliers.length, 1);
  assert.equal((supabase.db.source_runs || []).length, 0);
});

test("prefab estimate and spread underwriting write activation deal planning outputs", async () => {
  const supabase = baseSupabase();
  supabase.db.rfqs = [{
    id: "rfq_1",
    workspace_id: WORKSPACE_ID,
    activation_party_type: "tenant",
    prefab_category: "project_office",
    metadata_json: {
      activation_request: { party_type: "tenant", structure_size_sqm: 120, monthly_budget: 90000, permit_path: true, modular_install_permission: true },
      activation_economics: { tenant_monthly_rent: 90000, land_rent: 22000, modular_unit_lease: 26000, target_coverage: 1.5 },
    },
    qualification_json: {},
  }];
  supabase.db.sourced_options = [{
    id: "option_1",
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    rfq_id: "rfq_1",
    source_kind: "portal",
    title: "Land option",
    area_sqm: 1500,
    model_payload_json: {},
  }];

  const estimate = await invoke(supabase, "POST", "/api/mihad/v1/activation-deals/option_1/prefab-estimate", {
    user_id: USER_ID,
    structure_size_sqm: 120,
  });
  assert.equal(estimate.status, 201);
  assert.equal(estimate.body.mode, "prefab_estimate");
  assert.equal(estimate.body.prefab_estimate.estimate_kind, "prefab");

  const underwriting = await invoke(supabase, "POST", "/api/mihad/v1/activation-deals/option_1/spread-underwriting", {
    user_id: USER_ID,
    tenant_monthly_rent: 90000,
    land_rent: 22000,
    target_coverage: 1.5,
  });
  assert.equal(underwriting.status, 201);
  assert.equal(underwriting.body.mode, "spread_underwriting");
  assert.equal(underwriting.body.underwriting.underwriting_engine_version, "activation_spread_v1");
});

test("activation deal actions preserve mapped pipeline actions through approvals", async () => {
  const supabase = baseSupabase();
  supabase.db.rfqs = [{ id: "rfq_1", workspace_id: WORKSPACE_ID, activation_score_json: { hard_stops: [] } }];
  supabase.db.sourced_options = [{
    id: "option_1",
    workspace_id: WORKSPACE_ID,
    mandate_id: "mandate_1",
    rfq_id: "rfq_1",
    source_kind: "portal",
    title: "Land option",
  }];

  const action = await invoke(supabase, "POST", "/api/mihad/v1/activation-deals/option_1/actions", {
    user_id: USER_ID,
    action_type: "prepare_supplier_intro",
    message: "Ask supplier for lease terms.",
  });
  assert.equal(action.status, 201);
  assert.equal(action.body.activation_action.action_type, "prepare_supplier_intro");
  assert.equal(action.body.approval_gate.approval_status, "pending");
});
