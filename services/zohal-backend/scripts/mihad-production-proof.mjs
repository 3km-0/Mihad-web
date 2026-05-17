import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const repoRoot = resolve(import.meta.dirname, "../../..");
const envFiles = [
  resolve(repoRoot, ".env.preview.local"),
  resolve(repoRoot, ".env.vinext.preview.local"),
  resolve(repoRoot, ".env.local"),
];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const loadedEnv = Object.assign({}, ...envFiles.map(parseEnvFile), process.env);
const supabaseUrl = loadedEnv.NEXT_PUBLIC_SUPABASE_URL || loadedEnv.SUPABASE_URL;
const anonKey = loadedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || loadedEnv.SUPABASE_ANON_KEY;
const serviceKey = loadedEnv.SUPABASE_SERVICE_ROLE_KEY || loadedEnv.INTERNAL_SERVICE_ROLE_KEY;
const backendBase = String(
  process.env.MIHAD_BACKEND_URL ||
    loadedEnv.NEXT_PUBLIC_ZOHAL_BACKEND_URL ||
    loadedEnv.ZOHAL_BACKEND_URL ||
    "https://zohal-backend-f6hcmeo7ha-wx.a.run.app",
).replace(/\/+$/, "");
const keepRows = process.argv.includes("--keep");

if (!supabaseUrl || !anonKey || !serviceKey) {
  throw new Error("Missing Supabase URL, anon key, or service role key in local env files.");
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function api(path, token, body, method = "POST") {
  const response = await fetch(`${backendBase}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: method === "GET" ? undefined : JSON.stringify(body || {}),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path} failed ${response.status}: ${json.message || json.error || "unknown_error"}`);
  }
  return json;
}

async function insert(table, row) {
  const { data, error } = await admin.from(table).insert(row).select("*").single();
  if (error) throw new Error(`${table} insert failed: ${error.message}`);
  return data;
}

async function count(table, column, value) {
  const { count: rowCount, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return rowCount || 0;
}

async function removeWhere(table, column, value) {
  const { error } = await admin.from(table).delete().eq(column, value);
  if (error) throw new Error(`${table} cleanup failed: ${error.message}`);
}

const suffix = randomUUID().slice(0, 8);
let userId = null;
let workspaceId = null;
let buyerEntityId = null;
const result = {
  backend_base: backendBase,
  cleanup: keepRows ? "kept" : "removed",
  ids: {},
  checks: {},
};

try {
  const { data: existingProfiles, error: profileLookupError } = await admin
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);
  if (profileLookupError) throw profileLookupError;
  userId = existingProfiles?.[0]?.id || null;
  if (!userId) throw new Error("No existing profile available for workspace proof ownership.");

  const workspace = await insert("workspaces", {
    owner_id: userId,
    name: `Prefab buyer proof ${suffix}`,
    workspace_type: "project",
    workspace_kind: "mihad_buyer_desk",
    status: "active",
    description: "Temporary Mihad product lane proof workspace.",
    preparation_metadata: { source: "mihad_product_lane_proof", suffix },
  });
  workspaceId = workspace.id;

  const accessToken = serviceKey;

  const mandateResponse = await api("/api/mihad/v1/mandates", accessToken, {
    user_id: userId,
    workspace_id: workspaceId,
    buyer_display_name: "Proof Buyer",
    buyer_type: "individual",
    title: "Proof prefab family villa mandate",
    target_country_codes: ["SA"],
    target_locations: [{ city: "Riyadh", districts: ["Al Narjis"] }],
    budget_range: { min: 700000, max: 1250000 },
    budget_currency: "SAR",
    use_case: "family_villa",
    timeline: "Q3 2026",
    constraints: { derived_only_packet: true },
    rfq: {
      city: "Riyadh",
      land_status: "owned",
      use_case: "family_villa",
      prefab_category: "modular_villa",
      budget_range: { min: 700000, max: 1250000 },
      target_size: { min_sqm: 140, max_sqm: 220 },
      delivery_timeline: "Q3 2026",
      scope_needs: { includes_installation: true, includes_permits: false },
      contact_preference: "whatsapp",
    },
  });
  const mandate = mandateResponse.mandate;
  const rfq = mandateResponse.rfq;
  buyerEntityId = mandate.buyer_entity_id;

  const sourceRunResponse = await api("/api/mihad/v1/source-runs", accessToken, {
    user_id: userId,
    workspace_id: workspaceId,
    mandate_id: mandate.id,
    rfq_id: rfq.id,
    query_text: "Find verified prefab suppliers serving Riyadh for a 180 sqm family villa.",
    sources: ["manual_partner_directory"],
    limits: { max_results: 3 },
  });
  const sourceRun = sourceRunResponse.source_run;
  const executedRun = await api(`/api/mihad/v1/source-runs/${sourceRun.id}/execute`, accessToken, {});

  const manualOptionResponse = await api("/api/mihad/v1/sourced-options", accessToken, {
    user_id: userId,
    workspace_id: workspaceId,
    mandate_id: mandate.id,
    rfq_id: rfq.id,
    source_run_id: sourceRun.id,
    source_kind: "partner_feed",
    source_name: "Najd Modular Homes proof feed",
    source_url: "https://example.invalid/najd-modular-proof",
    title: "Najd Family Villa 180 proof option",
    summary: "Proof option with explicit source attribution.",
    country_code: "SA",
    city: "Riyadh",
    price_amount: 980000,
    price_currency: "SAR",
    area_sqm: 180,
    evidence_snapshot_json: {
      captured_fields: ["price", "size", "delivery_region"],
      raw_financial_documents_included: false,
    },
  });
  const option = manualOptionResponse.sourced_option;
  const promoted = await api(`/api/mihad/v1/sourced-options/${option.id}/promote`, accessToken, {
    user_id: userId,
    score: 88,
    rationale_json: { fit: "Serves Riyadh, size and budget fit RFQ.", proof: true },
  });

  const readinessProfile = await insert("buyer_readiness_profiles", {
    workspace_id: workspaceId,
    mandate_id: mandate.id,
    buyer_entity_id: buyerEntityId,
    buyer_user_id: userId,
    created_by: userId,
    buyer_type: "individual",
    readiness_level: 3,
    evidence_status: "verified",
    verification_confidence: "medium",
    sharing_mode: "private",
    funding_path: "cash_or_bank_finance",
    mandate_summary: "Riyadh prefab villa buyer with owned land and SAR 1.25M ceiling.",
    metadata_json: { source: "mihad_product_lane_proof" },
  });
  const readinessEvidence = await insert("buyer_readiness_evidence", {
    workspace_id: workspaceId,
    profile_id: readinessProfile.id,
    evidence_type: "budget_attestation",
    sensitivity_level: "financial",
    status: "verified",
    verified_at: new Date().toISOString(),
    verified_by: userId,
    created_by: userId,
    attestation_json: {
      derived_signal: "budget_range_confirmed",
      raw_document_shared: false,
    },
  });

  const packetResponse = await api("/api/mihad/v1/buyer-packets", accessToken, {
    user_id: userId,
    buyer_profile_id: readinessProfile.id,
    consent_scope_json: {
      mode: "derived_only",
      fields: ["budget_range", "timeline", "readiness_level", "target_size"],
    },
  });
  const packet = packetResponse.buyer_packet;

  const partners = await api("/api/mihad/v1/partners?partner_kind=prefab_supplier&country_code=SA", accessToken, {}, "GET");
  const partner = partners.partners.find((item) => item.id === "00000000-0000-4000-8000-000000000101") || partners.partners[0];
  if (!partner) throw new Error("No seeded prefab supplier partner found.");

  const grantResponse = await api(`/api/mihad/v1/buyer-packets/${packet.id}/grants`, accessToken, {
    user_id: userId,
    partner_id: partner.id,
    purpose: "supplier_quote",
    field_scope: ["budget_range", "timeline", "readiness_level"],
  });
  const grant = grantResponse.sharing_grant;

  const gateResponse = await api("/api/mihad/v1/approval-gates", accessToken, {
    user_id: userId,
    workspace_id: workspaceId,
    mandate_id: mandate.id,
    rfq_id: rfq.id,
    match_id: promoted.match.id,
    buyer_profile_id: readinessProfile.id,
    partner_id: partner.id,
    action_type: "supplier_intro",
    draft_payload_json: {
      channel: "email",
      to_partner_id: partner.id,
      message: "Proof intro draft. Requires human approval.",
    },
  });
  const gate = gateResponse.approval_gate;

  const agentTurn = await api("/api/mihad/v1/agent/turn", accessToken, {
    user_id: userId,
    workspace_id: workspaceId,
    message: "Log that this supplier intro stays approval gated.",
  });

  const revoked = await api(`/api/mihad/v1/sharing-grants/${grant.id}/revoke`, accessToken, {
    user_id: userId,
    revoked_reason: "proof_cleanup",
  });

  const context = await api(`/api/mihad/v1/workspaces/${workspaceId}/mandate?user_id=${encodeURIComponent(userId)}`, accessToken, {}, "GET");
  const oldRoute = await fetch(`${backendBase}/api/acquisition/v1/mandates`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ workspace_id: workspaceId }),
  });

  result.ids = {
    user_id: userId,
    workspace_id: workspaceId,
    mandate_id: mandate.id,
    rfq_id: rfq.id,
    source_run_id: sourceRun.id,
    sourced_option_id: option.id,
    match_id: promoted.match.id,
    readiness_profile_id: readinessProfile.id,
    readiness_evidence_id: readinessEvidence.id,
    buyer_packet_id: packet.id,
    sharing_grant_id: grant.id,
    approval_gate_id: gate.id,
    partner_id: partner.id,
  };
  result.checks = {
    mandate_created: Boolean(mandate.id),
    rfq_created: Boolean(rfq.id),
    source_run_completed: executedRun.source_run.status === "completed",
    option_sources_count: await count("option_sources", "option_id", option.id),
    match_created: Boolean(promoted.match.id),
    packet_derived_only: packet.snapshot_json?.raw_documents_included === false,
    sharing_grant_revoked: Boolean(revoked.sharing_grant.revoked_at),
    approval_gate_pending: gate.approval_status === "pending",
    seeded_prefab_partners: partners.partners.length,
    agent_events_count: await count("agent_events", "workspace_id", workspaceId),
    context_has_active_rfq: context.active_rfq?.id === rfq.id,
    old_acquisition_route_status: oldRoute.status,
  };

  const failed = Object.entries(result.checks).filter(([key, value]) => {
    if (key === "option_sources_count") return value < 1;
    if (key === "seeded_prefab_partners") return value < 1;
    if (key === "agent_events_count") return value < 2;
    if (key === "old_acquisition_route_status") return value !== 404;
    return value !== true;
  });
  if (failed.length) {
    throw new Error(`Proof checks failed: ${failed.map(([key, value]) => `${key}=${value}`).join(", ")}`);
  }

  console.log(JSON.stringify(result, null, 2));
} finally {
  if (!keepRows && workspaceId) {
    await removeWhere("approval_gates", "workspace_id", workspaceId);
    await removeWhere("sharing_grants", "workspace_id", workspaceId);
    await removeWhere("buyer_packets", "workspace_id", workspaceId);
    await removeWhere("buyer_readiness_evidence", "workspace_id", workspaceId);
    await removeWhere("buyer_readiness_profiles", "workspace_id", workspaceId);
    await removeWhere("matches", "workspace_id", workspaceId);
    await removeWhere("option_sources", "workspace_id", workspaceId);
    await removeWhere("sourced_options", "workspace_id", workspaceId);
    await removeWhere("source_runs", "workspace_id", workspaceId);
    await removeWhere("rfqs", "workspace_id", workspaceId);
    await removeWhere("buyer_mandates", "workspace_id", workspaceId);
    await removeWhere("agent_events", "workspace_id", workspaceId);
    await removeWhere("agent_threads", "workspace_id", workspaceId);
    await removeWhere("workspaces", "id", workspaceId);
  }
  if (!keepRows && buyerEntityId) {
    await removeWhere("buyer_entities", "id", buyerEntityId);
  }
}
