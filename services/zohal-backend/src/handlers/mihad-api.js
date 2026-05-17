import { createHash } from "node:crypto";
import { sendJson } from "../runtime/http.js";
import { createServiceClient } from "../runtime/supabase.js";
import { isInternalCaller, verifySupabaseJwt } from "../runtime/internal-auth.js";
import { assertWorkspaceWriteAccess } from "../renovation/catalog.js";

const BROWSER_WORKER_URL = String(process.env.ACQUISITION_BROWSER_WORKER_URL || "").trim().replace(/\/+$/, "");
const INTERNAL_TOKEN = String(
  process.env.INTERNAL_FUNCTION_JWT ||
  process.env.INTERNAL_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "",
).trim();

const DEFAULT_PACKET_TTL_DAYS = 90;
const DEFAULT_SOURCES = ["aqar", "bayut", "property_finder"];

function text(value) {
  return String(value || "").trim();
}

function uuid(value) {
  return text(value).toLowerCase() || null;
}

function bearerToken(headers) {
  const raw = text(headers?.authorization);
  return raw.toLowerCase().startsWith("bearer ") ? raw.slice("bearer ".length).trim() : raw;
}

function envelope(requestId, body = {}) {
  return { ...body, request_id: requestId, execution_plane: "gcp" };
}

function addDays(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function hashOption(input = {}) {
  const seed = [
    text(input.source_name || input.source),
    text(input.source_url),
    text(input.title).toLowerCase(),
    text(input.city).toLowerCase(),
    text(input.price_amount || input.asking_price),
  ].join("|");
  return createHash("sha256").update(seed).digest("hex");
}

function normalizeSources(value) {
  const list = Array.isArray(value) ? value : DEFAULT_SOURCES;
  const unique = [...new Set(list.map((item) => text(item).toLowerCase()).filter(Boolean))];
  return unique.length ? unique : DEFAULT_SOURCES;
}

async function requireUser(req) {
  if (isInternalCaller(req.headers)) return { userId: null, internal: true };
  const token = bearerToken(req.headers);
  if (!token) {
    const error = new Error("not_authenticated");
    error.statusCode = 401;
    throw error;
  }
  const verified = await verifySupabaseJwt(token);
  const userId = uuid(verified.payload?.sub);
  if (!userId) {
    const error = new Error("invalid_user_token");
    error.statusCode = 401;
    throw error;
  }
  return { userId, internal: false };
}

async function selectOne(query, label) {
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) {
    const notFound = new Error(`${label}_not_found`);
    notFound.statusCode = 404;
    throw notFound;
  }
  return data;
}

async function selectRows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function createMandate(supabase, body, userId) {
  const workspaceId = uuid(body.workspace_id);
  if (!workspaceId) {
    const error = new Error("workspace_id_required");
    error.statusCode = 400;
    throw error;
  }
  await assertWorkspaceWriteAccess(supabase, workspaceId, userId || uuid(body.user_id));

  let buyerEntityId = uuid(body.buyer_entity_id);
  if (!buyerEntityId) {
    const { data, error } = await supabase
      .from("buyer_entities")
      .insert({
        owner_user_id: userId || uuid(body.user_id),
        organization_id: uuid(body.organization_id),
        entity_type: text(body.buyer_type) || "individual",
        display_name: text(body.buyer_display_name) || text(body.title) || "Mihad buyer",
        metadata_json: body.buyer_metadata || {},
      })
      .select("*")
      .single();
    if (error) throw error;
    buyerEntityId = data.id;
  }

  const { data: mandate, error: mandateError } = await supabase
    .from("buyer_mandates")
    .insert({
      workspace_id: workspaceId,
      buyer_entity_id: buyerEntityId,
      organization_id: uuid(body.organization_id),
      user_id: userId || uuid(body.user_id),
      title: text(body.title) || "Mihad buyer mandate",
      target_country_codes: Array.isArray(body.target_country_codes) && body.target_country_codes.length
        ? body.target_country_codes.map((code) => text(code).toUpperCase())
        : ["SA"],
      target_locations_json: body.target_locations || body.target_locations_json || [],
      budget_range_json: body.budget_range || body.budget_range_json || {},
      budget_currency: text(body.budget_currency).toUpperCase() || "SAR",
      use_case: text(body.use_case) || null,
      purpose: text(body.purpose) || null,
      timeline: text(body.timeline) || null,
      constraints_json: body.constraints || body.constraints_json || {},
      notes: text(body.notes) || null,
      metadata_json: body.metadata_json || {},
    })
    .select("*")
    .single();
  if (mandateError) throw mandateError;

  let rfq = null;
  if (body.create_rfq !== false) {
    rfq = await createRfq(supabase, {
      ...body.rfq,
      workspace_id: workspaceId,
      mandate_id: mandate.id,
      buyer_entity_id: buyerEntityId,
      user_id: userId || uuid(body.user_id),
      title: text(body.rfq?.title) || mandate.title,
      country_code: mandate.target_country_codes?.[0] || "SA",
    }, userId);
  }

  return { mandate, rfq };
}

async function createRfq(supabase, body, userId) {
  const workspaceId = uuid(body.workspace_id);
  if (!workspaceId) {
    const error = new Error("workspace_id_required");
    error.statusCode = 400;
    throw error;
  }
  await assertWorkspaceWriteAccess(supabase, workspaceId, userId || uuid(body.user_id));
  const { data, error } = await supabase
    .from("rfqs")
    .insert({
      workspace_id: workspaceId,
      mandate_id: uuid(body.mandate_id),
      buyer_entity_id: uuid(body.buyer_entity_id),
      status: text(body.status) || "submitted",
      vertical: text(body.vertical) || "prefab",
      title: text(body.title) || "Prefab RFQ",
      city: text(body.city) || null,
      country_code: text(body.country_code).toUpperCase() || "SA",
      land_status: text(body.land_status) || null,
      use_case: text(body.use_case) || null,
      prefab_category: text(body.prefab_category) || null,
      budget_range_json: body.budget_range || body.budget_range_json || {},
      target_size_json: body.target_size || body.target_size_json || {},
      delivery_timeline: text(body.delivery_timeline) || text(body.timeline) || null,
      scope_needs_json: body.scope_needs || body.scope_needs_json || {},
      contact_preference: text(body.contact_preference) || "whatsapp",
      document_refs_json: body.document_refs || body.document_refs_json || [],
      qualification_json: body.qualification || body.qualification_json || {},
      metadata_json: body.metadata_json || {},
      created_by: userId || uuid(body.user_id),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function loadWorkspaceMandate(supabase, workspaceId, userId) {
  await assertWorkspaceWriteAccess(supabase, workspaceId, userId);
  const mandate = await selectOne(
    supabase.from("buyer_mandates").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(1),
    "mandate",
  ).catch((error) => {
    if (error.statusCode === 404) return null;
    throw error;
  });
  const [rfqs, sourceRuns, options, matches, readinessProfiles, packets, grants, partners] = await Promise.all([
    selectRows(supabase.from("rfqs").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false })),
    selectRows(supabase.from("source_runs").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(10)),
    selectRows(supabase.from("sourced_options").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(50)),
    selectRows(supabase.from("matches").select("*").eq("workspace_id", workspaceId).order("score", { ascending: false }).limit(50)),
    selectRows(supabase.from("buyer_readiness_profiles").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(5)),
    selectRows(supabase.from("buyer_packets").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(10)),
    selectRows(supabase.from("sharing_grants").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(25)),
    selectRows(supabase.from("partners").select("*, prefab_supplier_profiles(*)").in("status", ["candidate", "onboarding", "active"]).order("updated_at", { ascending: false }).limit(50)),
  ]);
  return {
    mandate,
    rfqs,
    active_rfq: rfqs[0] || null,
    source_runs: sourceRuns,
    sourced_options: options,
    matches,
    readiness_profile: readinessProfiles[0] || null,
    buyer_packets: packets,
    active_packet: packets.find((packet) => packet.status === "active") || null,
    sharing_grants: grants,
    partners,
  };
}

async function createSourceRun(supabase, body, userId) {
  const workspaceId = uuid(body.workspace_id);
  if (!workspaceId) {
    const error = new Error("workspace_id_required");
    error.statusCode = 400;
    throw error;
  }
  await assertWorkspaceWriteAccess(supabase, workspaceId, userId || uuid(body.user_id));
  const { data, error } = await supabase
    .from("source_runs")
    .insert({
      workspace_id: workspaceId,
      mandate_id: uuid(body.mandate_id),
      rfq_id: uuid(body.rfq_id),
      user_id: userId || uuid(body.user_id),
      status: "queued",
      trigger_kind: text(body.trigger_kind) || "manual",
      sources_json: normalizeSources(body.sources),
      query_text: text(body.query_text || body.instruction || body.sourcing_instruction),
      limits_json: body.limits || {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return { source_run: data };
}

function mapWorkerCandidate(candidate, sourceRun) {
  return {
    workspace_id: sourceRun.workspace_id,
    mandate_id: sourceRun.mandate_id,
    rfq_id: sourceRun.rfq_id,
    source_run_id: sourceRun.id,
    vertical: text(candidate.vertical) || "prefab",
    source_kind: "portal",
    source_name: text(candidate.source) || "portal",
    source_url: text(candidate.source_url) || null,
    source_fingerprint: text(candidate.source_fingerprint) || hashOption(candidate),
    title: text(candidate.title) || "Sourced option",
    summary: text(candidate.short_description) || null,
    country_code: text(candidate.country_code).toUpperCase() || null,
    city: text(candidate.city) || null,
    district: text(candidate.district) || null,
    price_amount: Number(candidate.asking_price || candidate.price_amount || 0) || null,
    price_currency: text(candidate.price_currency).toUpperCase() || null,
    area_sqm: Number(candidate.area_sqm || 0) || null,
    bedrooms: Number.isFinite(Number(candidate.bedroom_count)) ? Number(candidate.bedroom_count) : null,
    bathrooms: Number.isFinite(Number(candidate.bathroom_count)) ? Number(candidate.bathroom_count) : null,
    model_payload_json: {
      property_type: candidate.property_type || null,
      photos: candidate.photo_refs_json || [],
      location: candidate.location || {},
    },
    evidence_snapshot_json: candidate.limited_evidence_snapshot_json || {},
    score_json: candidate.screening_output_json || {},
    status: "sourced",
  };
}

async function executeSourceRun(supabase, sourceRunId, body, requestId) {
  const sourceRun = await selectOne(
    supabase.from("source_runs").select("*").eq("id", sourceRunId),
    "source_run",
  );
  const mandate = sourceRun.mandate_id
    ? await selectOne(supabase.from("buyer_mandates").select("*").eq("id", sourceRun.mandate_id), "mandate").catch(() => null)
    : null;
  await supabase.from("source_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", sourceRun.id);

  let workerResult = { candidates: [], adapter_runs: [], skipped: true };
  if (BROWSER_WORKER_URL) {
    const response = await fetch(`${BROWSER_WORKER_URL}/internal/search-run`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId,
        ...(INTERNAL_TOKEN ? { "x-internal-function-jwt": INTERNAL_TOKEN } : {}),
      },
      body: JSON.stringify({
        search_run: {
          id: sourceRun.id,
          sources_json: sourceRun.sources_json,
          limits_json: sourceRun.limits_json,
        },
        mandate: {
          ...mandate,
          buy_box_json: body.buy_box_json || mandate?.metadata_json?.buy_box || {},
          target_country_codes: mandate?.target_country_codes || ["SA"],
        },
        suppressed_candidates: [],
      }),
    });
    workerResult = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(workerResult?.error || `browser_worker_failed_${response.status}`);
  }

  const createdOptions = [];
  for (const candidate of workerResult.candidates || []) {
    const row = mapWorkerCandidate(candidate, sourceRun);
    const { data: option, error } = await supabase
      .from("sourced_options")
      .upsert(row, { onConflict: "workspace_id,source_fingerprint" })
      .select("*")
      .single();
    if (error) throw error;
    createdOptions.push(option);
    await supabase.from("option_sources").insert({
      option_id: option.id,
      source_run_id: sourceRun.id,
      workspace_id: sourceRun.workspace_id,
      source_name: option.source_name || "portal",
      source_url: option.source_url,
      source_fingerprint: option.source_fingerprint,
      terms_posture: "unknown",
      limited_evidence_snapshot_json: option.evidence_snapshot_json || {},
      metadata_json: { source: "browser_worker" },
    });
  }

  const { data: updated, error: updateError } = await supabase
    .from("source_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      sourced_option_count: createdOptions.length,
      adapter_telemetry_json: { adapter_runs: workerResult.adapter_runs || [], skipped: Boolean(workerResult.skipped) },
      error_summary: workerResult.error || null,
    })
    .eq("id", sourceRun.id)
    .select("*")
    .single();
  if (updateError) throw updateError;
  return { source_run: updated, sourced_options: createdOptions };
}

async function createSourcedOption(supabase, body, userId) {
  const workspaceId = uuid(body.workspace_id);
  if (!workspaceId) {
    const error = new Error("workspace_id_required");
    error.statusCode = 400;
    throw error;
  }
  await assertWorkspaceWriteAccess(supabase, workspaceId, userId || uuid(body.user_id));
  const payload = {
    workspace_id: workspaceId,
    mandate_id: uuid(body.mandate_id),
    rfq_id: uuid(body.rfq_id),
    source_run_id: uuid(body.source_run_id),
    partner_id: uuid(body.partner_id),
    vertical: text(body.vertical) || "prefab",
    source_kind: text(body.source_kind) || "manual",
    source_name: text(body.source_name) || "manual",
    source_url: text(body.source_url) || null,
    source_fingerprint: text(body.source_fingerprint) || hashOption(body),
    title: text(body.title) || "Sourced option",
    summary: text(body.summary) || null,
    country_code: text(body.country_code).toUpperCase() || null,
    city: text(body.city) || null,
    district: text(body.district) || null,
    price_amount: Number(body.price_amount || 0) || null,
    price_currency: text(body.price_currency).toUpperCase() || null,
    area_sqm: Number(body.area_sqm || 0) || null,
    model_payload_json: body.model_payload_json || body.model_payload || {},
    evidence_snapshot_json: body.evidence_snapshot_json || body.evidence_snapshot || {},
    score_json: body.score_json || body.score || {},
    status: text(body.status) || "sourced",
  };
  const { data, error } = await supabase.from("sourced_options").insert(payload).select("*").single();
  if (error) throw error;
  await supabase.from("option_sources").insert({
    option_id: data.id,
    source_run_id: data.source_run_id,
    workspace_id: data.workspace_id,
    source_name: data.source_name,
    source_url: data.source_url,
    source_fingerprint: data.source_fingerprint,
    terms_posture: text(body.terms_posture) || "unknown",
    limited_evidence_snapshot_json: data.evidence_snapshot_json || {},
    metadata_json: { source: "manual_entry" },
  });
  return { sourced_option: data };
}

async function promoteOption(supabase, optionId, body, userId) {
  const option = await selectOne(supabase.from("sourced_options").select("*").eq("id", optionId), "sourced_option");
  await assertWorkspaceWriteAccess(supabase, option.workspace_id, userId || uuid(body.user_id));
  const score = Number(body.score ?? option.score_json?.fit?.score ?? option.score_json?.score ?? 70);
  const { data: match, error } = await supabase
    .from("matches")
    .insert({
      workspace_id: option.workspace_id,
      mandate_id: option.mandate_id,
      rfq_id: option.rfq_id,
      option_id: option.id,
      partner_id: option.partner_id,
      match_kind: option.partner_id ? "partner" : "option",
      score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 70,
      rationale_json: body.rationale_json || option.score_json || {},
      status: "shortlisted",
      next_action_json: body.next_action_json || {},
      created_by: userId || uuid(body.user_id),
    })
    .select("*")
    .single();
  if (error) throw error;
  const nextStatus = text(body.status) || "matched";
  const { data: sourcedOption, error: optionError } = await supabase
    .from("sourced_options")
    .update({ status: nextStatus })
    .eq("id", option.id)
    .select("*")
    .single();
  if (optionError) throw optionError;
  return { match, sourced_option: sourcedOption, opportunity: sourcedOption };
}

async function createBuyerPacket(supabase, body, userId) {
  const profile = await selectOne(
    supabase.from("buyer_readiness_profiles").select("*").eq("id", uuid(body.buyer_profile_id)),
    "buyer_profile",
  );
  await assertWorkspaceWriteAccess(supabase, profile.workspace_id, userId || uuid(body.user_id));
  const existing = await selectRows(
    supabase.from("buyer_packets").select("version").eq("buyer_profile_id", profile.id).order("version", { ascending: false }).limit(1),
  );
  const version = Number(existing[0]?.version || 0) + 1;
  const snapshot = {
    buyer_type: profile.buyer_type,
    readiness_level: profile.readiness_level,
    evidence_status: profile.evidence_status,
    verification_confidence: profile.verification_confidence,
    mandate_summary: profile.mandate_summary,
    funding_path: profile.funding_path,
    generated_at: new Date().toISOString(),
    raw_documents_included: false,
  };
  const { data, error } = await supabase
    .from("buyer_packets")
    .insert({
      buyer_profile_id: profile.id,
      workspace_id: profile.workspace_id,
      mandate_id: profile.mandate_id,
      version,
      snapshot_json: { ...snapshot, ...(body.snapshot_json || {}) },
      consent_scope_json: body.consent_scope_json || { mode: "derived_only" },
      status: "active",
      expires_at: body.expires_at || addDays(DEFAULT_PACKET_TTL_DAYS),
      created_by: userId || uuid(body.user_id),
    })
    .select("*")
    .single();
  if (error) throw error;
  return { buyer_packet: data };
}

async function grantPacket(supabase, packetId, body, userId) {
  const packet = await selectOne(supabase.from("buyer_packets").select("*").eq("id", packetId), "buyer_packet");
  await assertWorkspaceWriteAccess(supabase, packet.workspace_id, userId || uuid(body.user_id));
  const partnerId = uuid(body.partner_id || body.broker_partner_id);
  const partner = partnerId
    ? await selectOne(supabase.from("partners").select("*").eq("id", partnerId), "partner")
    : null;
  const { data, error } = await supabase
    .from("sharing_grants")
    .insert({
      workspace_id: packet.workspace_id,
      buyer_packet_id: packet.id,
      partner_id: partnerId,
      granted_by: userId || uuid(body.user_id),
      granted_to_kind: partner?.partner_kind === "prefab_supplier" ? "supplier" : partner?.partner_kind || "partner",
      granted_to_identifier: text(body.granted_to_identifier) || partner?.display_name || null,
      purpose: text(body.purpose) || "share_buyer_packet",
      allowed_action: "share_packet",
      share_mode: "derived_only",
      expires_at: body.expires_at || packet.expires_at,
      metadata_json: {
        source: "mihad_packet_grant",
        field_scope: body.field_scope || ["budget", "timeline", "readiness", "target"],
      },
    })
    .select("*")
    .single();
  if (error) throw error;
  return { sharing_grant: data };
}

async function revokeGrant(supabase, grantId, body, userId) {
  const grant = await selectOne(supabase.from("sharing_grants").select("*").eq("id", grantId), "sharing_grant");
  await assertWorkspaceWriteAccess(supabase, grant.workspace_id, userId || uuid(body.user_id));
  const { data, error } = await supabase
    .from("sharing_grants")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_reason: text(body.revoked_reason) || "buyer_revoked",
    })
    .eq("id", grant.id)
    .select("*")
    .single();
  if (error) throw error;
  return { sharing_grant: data };
}

async function createApprovalGate(supabase, body, userId) {
  const workspaceId = uuid(body.workspace_id);
  await assertWorkspaceWriteAccess(supabase, workspaceId, userId || uuid(body.user_id));
  const { data, error } = await supabase
    .from("approval_gates")
    .insert({
      workspace_id: workspaceId,
      mandate_id: uuid(body.mandate_id),
      rfq_id: uuid(body.rfq_id),
      match_id: uuid(body.match_id),
      buyer_profile_id: uuid(body.buyer_profile_id),
      partner_id: uuid(body.partner_id),
      action_type: text(body.action_type) || "supplier_intro",
      draft_payload_json: body.draft_payload_json || body.draft_payload || {},
      approval_status: text(body.approval_status) || "pending",
      requested_by: userId || uuid(body.user_id),
    })
    .select("*")
    .single();
  if (error) throw error;
  return { approval_gate: data };
}

async function listPartners(supabase, query) {
  let builder = supabase.from("partners").select("*, prefab_supplier_profiles(*), partner_scorecards(*)");
  if (query.get("partner_kind")) builder = builder.eq("partner_kind", query.get("partner_kind"));
  if (query.get("country_code")) builder = builder.eq("country_code", query.get("country_code").toUpperCase());
  builder = builder.in("status", ["candidate", "onboarding", "active"]).order("updated_at", { ascending: false }).limit(100);
  return { partners: await selectRows(builder) };
}

async function runAgentTurn(supabase, body, userId) {
  const workspaceId = uuid(body.workspace_id);
  await assertWorkspaceWriteAccess(supabase, workspaceId, userId || uuid(body.user_id));
  const context = await loadWorkspaceMandate(supabase, workspaceId, userId || uuid(body.user_id));
  const message = text(body.message);
  const toolResults = [];
  let assistantMessage = "I captured that. I can run sourcing, prepare a buyer packet, or set up an approval-gated partner intro.";
  if (/search|source|find|shortlist|ابحث|خيارات/i.test(message)) {
    const run = await createSourceRun(supabase, {
      workspace_id: workspaceId,
      mandate_id: context.mandate?.id,
      rfq_id: context.active_rfq?.id,
      query_text: message,
      sources: body.sources,
      trigger_kind: "agent",
    }, userId);
    toolResults.push({ tool: "SourceRun.create", status: "completed", result: run });
    assistantMessage = "I started a verified source run for this mandate. Results will stay scoped to this buyer workflow.";
  } else if (/packet|qualif|readiness|جاهزية|تأهيل/i.test(message) && context.readiness_profile?.id) {
    const packet = await createBuyerPacket(supabase, {
      buyer_profile_id: context.readiness_profile.id,
      workspace_id: workspaceId,
    }, userId);
    toolResults.push({ tool: "BuyerPacket.create", status: "completed", result: packet });
    assistantMessage = "I created a derived-only buyer packet. Raw documents are not included.";
  }

  let thread = context.thread || null;
  const externalThreadId = `mihad:${workspaceId}:${userId || "internal"}`;
  const { data: upsertedThread, error: threadError } = await supabase
    .from("agent_threads")
    .upsert({
      workspace_id: workspaceId,
      mandate_id: context.mandate?.id || null,
      rfq_id: context.active_rfq?.id || null,
      channel: "web",
      external_thread_id: externalThreadId,
      last_message_at: new Date().toISOString(),
      created_by: userId || uuid(body.user_id),
    }, { onConflict: "workspace_id,channel,external_thread_id" })
    .select("*")
    .single();
  if (threadError) throw threadError;
  thread = upsertedThread;
  const { error: eventError } = await supabase.from("agent_events").insert([
    {
      thread_id: thread.id,
      workspace_id: workspaceId,
      mandate_id: context.mandate?.id || null,
      rfq_id: context.active_rfq?.id || null,
      event_type: "buyer_message",
      event_direction: "inbound",
      channel: "web",
      body_text: message,
      event_payload: {},
      created_by: userId || uuid(body.user_id),
    },
    {
      thread_id: thread.id,
      workspace_id: workspaceId,
      mandate_id: context.mandate?.id || null,
      rfq_id: context.active_rfq?.id || null,
      event_type: "agent_turn",
      event_direction: "outbound",
      channel: "web",
      body_text: assistantMessage,
      event_payload: { tool_results: toolResults },
      created_by: userId || uuid(body.user_id),
    },
  ]);
  if (eventError) throw eventError;
  return {
    assistant_message: assistantMessage,
    tool_results: toolResults,
    context: await loadWorkspaceMandate(supabase, workspaceId, userId || uuid(body.user_id)),
  };
}

function matchMihadRoute(method, pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "mihad" || parts[2] !== "v1") return null;
  if (method === "POST" && parts[3] === "mandates" && parts.length === 4) return { name: "createMandate" };
  if (method === "GET" && parts[3] === "workspaces" && parts[5] === "mandate" && parts.length === 6) return { name: "getWorkspaceMandate", workspaceId: parts[4] };
  if (method === "POST" && parts[3] === "rfqs" && parts.length === 4) return { name: "createRfq" };
  if (method === "POST" && parts[3] === "source-runs" && parts.length === 4) return { name: "createSourceRun" };
  if (method === "POST" && parts[3] === "source-runs" && parts[5] === "execute" && parts.length === 6) return { name: "executeSourceRun", sourceRunId: parts[4] };
  if (method === "POST" && parts[3] === "sourced-options" && parts.length === 4) return { name: "createSourcedOption" };
  if (method === "POST" && parts[3] === "sourced-options" && parts[5] === "promote" && parts.length === 6) return { name: "promoteOption", optionId: parts[4] };
  if (method === "POST" && parts[3] === "buyer-packets" && parts.length === 4) return { name: "createBuyerPacket" };
  if (method === "POST" && parts[3] === "buyer-packets" && parts[5] === "grants" && parts.length === 6) return { name: "grantPacket", packetId: parts[4] };
  if (method === "POST" && parts[3] === "sharing-grants" && parts[5] === "revoke" && parts.length === 6) return { name: "revokeGrant", grantId: parts[4] };
  if (method === "GET" && parts[3] === "partners" && parts.length === 4) return { name: "listPartners" };
  if (method === "POST" && parts[3] === "approval-gates" && parts.length === 4) return { name: "createApprovalGate" };
  if (method === "POST" && parts[3] === "agent" && parts[4] === "turn" && parts.length === 5) return { name: "agentTurn" };
  return null;
}

export function isMihadApiRoute(method, pathname) {
  return Boolean(matchMihadRoute(method, pathname));
}

export async function handleMihadApi(req, res, { requestId, readJsonBody, supabase = createServiceClient() }) {
  const url = new URL(req.url || "/", "http://localhost");
  const route = matchMihadRoute(req.method, url.pathname);
  if (!route) return false;
  try {
    const { userId } = await requireUser(req);
    const body = req.method === "GET" ? {} : await readJsonBody(req);
    if (route.name === "createMandate") return sendJson(res, 201, envelope(requestId, await createMandate(supabase, body, userId)));
    if (route.name === "getWorkspaceMandate") return sendJson(res, 200, envelope(requestId, await loadWorkspaceMandate(supabase, uuid(route.workspaceId), userId || uuid(url.searchParams.get("user_id")))));
    if (route.name === "createRfq") return sendJson(res, 201, envelope(requestId, { rfq: await createRfq(supabase, body, userId) }));
    if (route.name === "createSourceRun") return sendJson(res, 202, envelope(requestId, await createSourceRun(supabase, body, userId)));
    if (route.name === "executeSourceRun") return sendJson(res, 200, envelope(requestId, await executeSourceRun(supabase, uuid(route.sourceRunId), body, requestId)));
    if (route.name === "createSourcedOption") return sendJson(res, 201, envelope(requestId, await createSourcedOption(supabase, body, userId)));
    if (route.name === "promoteOption") return sendJson(res, 201, envelope(requestId, await promoteOption(supabase, uuid(route.optionId), body, userId)));
    if (route.name === "createBuyerPacket") return sendJson(res, 201, envelope(requestId, await createBuyerPacket(supabase, body, userId)));
    if (route.name === "grantPacket") return sendJson(res, 201, envelope(requestId, await grantPacket(supabase, uuid(route.packetId), body, userId)));
    if (route.name === "revokeGrant") return sendJson(res, 200, envelope(requestId, await revokeGrant(supabase, uuid(route.grantId), body, userId)));
    if (route.name === "listPartners") return sendJson(res, 200, envelope(requestId, await listPartners(supabase, url.searchParams)));
    if (route.name === "createApprovalGate") return sendJson(res, 201, envelope(requestId, await createApprovalGate(supabase, body, userId)));
    if (route.name === "agentTurn") return sendJson(res, 200, envelope(requestId, await runAgentTurn(supabase, body, userId)));
    return false;
  } catch (error) {
    const status = error.statusCode || 500;
    return sendJson(res, status, envelope(requestId, {
      error: error.message || "mihad_api_error",
      message: error.message || "Mihad API error",
    }));
  }
}
