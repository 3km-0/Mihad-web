#!/usr/bin/env node
// End-to-end Acquisition Report API smoke against a running zohal-backend service.
//
// Required:
//   ACQUISITION_SMOKE_BASE_URL=http://localhost:8080
//   ACQUISITION_SMOKE_WORKSPACE_ID=<workspace uuid>
//     or ACQUISITION_SMOKE_WORKSPACE_NAME=<workspace name> plus Supabase service credentials
//   INTERNAL_FUNCTION_JWT=<internal token>
//
// Optional:
//   ACQUISITION_SMOKE_MANDATE_ID=<mandate uuid>
//   ACQUISITION_SMOKE_OPPORTUNITY_IDS=<comma-separated opportunity uuids>
//   ACQUISITION_SMOKE_PUBLICATION_BASE_URL=https://experiences-publication-api.zohal.ai

import { createClient } from "@supabase/supabase-js";

const baseUrl = String(process.env.ACQUISITION_SMOKE_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
let workspaceId = String(process.env.ACQUISITION_SMOKE_WORKSPACE_ID || "").trim();
const workspaceName = String(process.env.ACQUISITION_SMOKE_WORKSPACE_NAME || "").trim();
const mandateId = String(process.env.ACQUISITION_SMOKE_MANDATE_ID || "").trim();
const token = String(process.env.INTERNAL_FUNCTION_JWT || process.env.INTERNAL_API_TOKEN || "").trim();
const supabaseUrl = String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseServiceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.INTERNAL_SERVICE_ROLE_KEY || "").trim();
const publicationBaseUrl = String(
  process.env.ACQUISITION_SMOKE_PUBLICATION_BASE_URL ||
    process.env.PUBLICATION_API_BASE_URL ||
    "https://experiences-publication-api.zohal.ai",
).replace(/\/+$/, "");
const reportEndpoint = String(process.env.ACQUISITION_SMOKE_REPORT_ENDPOINT || "acquisition-reports").trim() === "deal-desk"
  ? "deal-desk"
  : "acquisition-reports";
const reportLanguage = String(process.env.ACQUISITION_SMOKE_LANGUAGE || "en").trim() || "en";

function fail(message) {
  process.stderr.write(`[acquisition-report-smoke] FAIL - ${message}\n`);
  process.exit(1);
}

if (!workspaceId && !workspaceName) {
  fail("ACQUISITION_SMOKE_WORKSPACE_ID or ACQUISITION_SMOKE_WORKSPACE_NAME is required");
}
if (!token) fail("INTERNAL_FUNCTION_JWT or INTERNAL_API_TOKEN is required");

function unwrap(body) {
  return body?.data && typeof body.data === "object" ? body.data : body;
}

async function request(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      apikey: token,
      "x-internal-function-jwt": token,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function resolveWorkspaceIdByName(name) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    fail("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when using ACQUISITION_SMOKE_WORKSPACE_NAME");
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("workspaces")
    .select("id,name,updated_at,created_at")
    .eq("name", name)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(2);
  if (error) fail(`workspace lookup failed: ${error.message}`);
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) fail(`workspace not found by name: ${name}`);
  if (rows.length > 1) {
    process.stdout.write(`[acquisition-report-smoke] workspace name matched ${rows.length} rows; using most recently updated ${rows[0].id}\n`);
  }
  return rows[0].id;
}

async function redeemSession(redeemUrl, canonicalUrl) {
  if (!redeemUrl) return { cookie: null, baseUrl: canonicalUrl };
  const response = await fetch(redeemUrl, { method: "GET", redirect: "manual" });
  if (![301, 302, 303, 307, 308].includes(response.status)) {
    fail(`redeem_url did not redirect: HTTP ${response.status}`);
  }
  const cookie = response.headers.get("set-cookie")?.split(";")[0] || null;
  if (!cookie) fail("redeem_url did not set an access cookie");
  const redirectLocation = response.headers.get("location");
  return {
    cookie,
    baseUrl: redirectLocation ? new URL(redirectLocation, redeemUrl).toString() : canonicalUrl,
  };
}

async function probeRoute(baseUrl, routePath, cookie) {
  const url = `${String(baseUrl || "").replace(/\/+$/, "")}${routePath}`;
  const response = await fetch(url, {
    method: "GET",
    headers: cookie ? { cookie } : {},
  });
  const html = await response.text().catch(() => "");
  if (!response.ok) fail(`${routePath || "/"} returned HTTP ${response.status}`);
  if (!html.includes("data-evidence-id")) fail(`${routePath || "/"} is missing evidence markers`);
  if (!html.includes("zdd-shell")) fail(`${routePath || "/"} is missing the Acquisition Report shell`);
}

async function loadDiagnostics({ experienceId, candidateId }) {
  if (!experienceId || !candidateId) return null;
  const url = `${publicationBaseUrl}/v1/experiences/publications/${encodeURIComponent(experienceId)}/diagnostics?candidate_id=${encodeURIComponent(candidateId)}&refresh_probe=1&route_id=brief`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-zohal-user-id": "acquisition-report-smoke",
      "content-type": "application/json",
    },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) fail(`diagnostics returned HTTP ${response.status}: ${JSON.stringify(json)}`);
  return json?.diagnostics || null;
}

const opportunityIds = String(process.env.ACQUISITION_SMOKE_OPPORTUNITY_IDS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (!workspaceId) {
  workspaceId = await resolveWorkspaceIdByName(workspaceName);
  process.stdout.write(`[acquisition-report-smoke] resolved workspace "${workspaceName}" -> ${workspaceId}\n`);
}

process.stdout.write(`[acquisition-report-smoke] creating Acquisition Report for workspace ${workspaceId}\n`);
const created = await request(`/api/acquisition/v1/workspaces/${encodeURIComponent(workspaceId)}/${reportEndpoint}`, {
  ...(mandateId ? { mandate_id: mandateId } : {}),
  ...(opportunityIds.length ? { opportunity_ids: opportunityIds } : {}),
  language: reportLanguage,
  top_n: 5,
  presentation_instruction: "Smoke proof: weekly acquisition report with ranked deal highlights, ratings, AI analysis, simple charts, notes, and proof.",
  delivery_hint: "smoke",
});

const report = unwrap(created);
const reportId = report.report_id;
const status = report.status || "unknown";
const liveUrl = report.report_url || report.live_url || "";
const redeemUrl = report.redeem_url || "";
const experienceId = report.experience_id || "";
const candidateId = report.publication?.candidate_id || "";
if (!reportId) fail(`missing report_id in response: ${JSON.stringify(created)}`);
if (report.artifact_kind !== "acquisition_report") {
  fail(`unexpected artifact_kind: ${JSON.stringify(created)}`);
}
if (report.surface_family !== "deal_desk") {
  fail(`unexpected surface_family: ${JSON.stringify(created)}`);
}
if (status !== "private_live") fail(`expected private_live status, got ${status}`);
if (!liveUrl) fail(`missing live_url in response: ${JSON.stringify(created)}`);
if (!/\/deal-desk\//.test(new URL(liveUrl).pathname)) {
  fail(`expected compatibility /deal-desk/ report URL, got ${liveUrl}`);
}
process.stdout.write(`[acquisition-report-smoke] report_id=${reportId} status=${status}\n`);
process.stdout.write(`[acquisition-report-smoke] report_url=${liveUrl}\n`);

await probeRoute(liveUrl, "", null);
process.stdout.write("[acquisition-report-smoke] PASS - direct report URL renders without an access cookie\n");

const diagnostics = await loadDiagnostics({ experienceId, candidateId });
const runtimeMode =
  diagnostics?.latest_candidate?.metadata?.runtime_mode ||
  diagnostics?.latest_candidate?.compiler_bundle?.candidate?.metadata?.runtime_mode ||
  diagnostics?.active_revision?.bundle?.candidate?.metadata?.runtime_mode ||
  "";
if (runtimeMode && runtimeMode !== "deterministic_surface") {
  fail(`expected deterministic_surface runtime mode, got ${runtimeMode}`);
}
const deployment = diagnostics?.deployment || null;
if (deployment && deployment.skipped !== true) {
  fail(`expected generated-worker deployment to be skipped, got ${JSON.stringify(deployment)}`);
}
if (deployment?.skipped) {
  process.stdout.write(`[acquisition-report-smoke] PASS - generated-worker deploy skipped (${deployment.reason || "not_required"})\n`);
} else {
  process.stdout.write("[acquisition-report-smoke] WARN - diagnostics did not expose deployment skip details\n");
}

const session = await redeemSession(redeemUrl, liveUrl);
for (const routePath of ["", "/opportunities", "/compare", "/scenario-lab", "/renovation", "/proof", "/notes"]) {
  await probeRoute(session.baseUrl, routePath, session.cookie);
}
process.stdout.write("[acquisition-report-smoke] PASS - all Acquisition Report routes render with evidence markers\n");

const note = await request(`/api/acquisition/v1/acquisition-reports/${encodeURIComponent(reportId)}/notes`, {
  note_kind: "preference",
  body: "Smoke note: preserve proof and prefer simpler tenancy stories next report.",
  viewer_ref: "acquisition-report-smoke",
});
if (!(note.note?.id || note.data?.note?.id)) {
  fail(`missing note id in response: ${JSON.stringify(note)}`);
}
process.stdout.write(`[acquisition-report-smoke] PASS - note stored for report ${reportId}\n`);
