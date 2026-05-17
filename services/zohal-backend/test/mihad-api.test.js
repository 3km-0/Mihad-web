import assert from "node:assert/strict";
import test from "node:test";
import { handleMihadApi, isMihadApiRoute } from "../src/handlers/mihad-api.js";

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
  assert.equal(isMihadApiRoute("POST", "/api/mihad/v1/source-runs/run_1/execute"), true);
  assert.equal(isMihadApiRoute("POST", "/api/acquisition/v1/workspaces/ws/search-runs"), false);
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

test("source run execution completes and manual sourced options require source attribution", async () => {
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
