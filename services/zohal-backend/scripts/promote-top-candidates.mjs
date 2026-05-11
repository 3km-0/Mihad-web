#!/usr/bin/env node
// Runs ONE mandate-driven search and promotes the top N candidates by fit score.
// The mandate and buy box come entirely from the workspace's saved mandate —
// we do NOT override districts or locations here.
//
// Usage:
//   node scripts/promote-top-candidates.mjs \
//     --workspace-id <id> \
//     --user-id <id> \
//     --mandate-id <existing-mandate-id> \   # use existing mandate; skip creation
//     --promote-count 4 \                    # how many to promote
//     --exclude-opportunity-ids <id,id,...>  # already-promoted opps to skip

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) { args[key] = true; }
    else { args[key] = next; i++; }
  }
  return args;
}

function token() {
  return [
    process.env.INTERNAL_FUNCTION_JWT,
    process.env.INTERNAL_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].map((v) => String(v || "").trim()).find(Boolean) || "";
}

function baseUrl(args) {
  return String(args.baseUrl || process.env.ACQUISITION_SERVICE_BASE_URL || "http://localhost:8080")
    .trim().replace(/\/+$/, "");
}

function headers(requestId) {
  const t = token();
  if (!t) throw new Error("Missing auth token");
  return {
    authorization: `Bearer ${t}`,
    apikey: t,
    "x-internal-function-jwt": t,
    "x-request-id": requestId,
    "content-type": "application/json",
  };
}

async function req({ url, method = "GET", body, requestId }) {
  const res = await fetch(url, {
    method,
    headers: headers(requestId),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${url} failed (${res.status}): ${JSON.stringify(json)}`);
  return json;
}

function fitScore(candidate = {}) {
  return Number(candidate.screening_output_json?.fit?.score || 0);
}

function isEligible(candidate = {}) {
  const decision = String(
    candidate.screening_decision || candidate.screening_output_json?.decision || ""
  ).toLowerCase();
  return candidate.status !== "promoted" && decision !== "pass" && fitScore(candidate) >= 60;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const workspaceId = args.workspaceId;
  const userId = args.userId;
  const existingMandateId = args.mandateId;
  const promoteCount = Number(args.promoteCount || 4);
  const excludeIds = new Set(
    String(args.excludeOpportunityIds || "").split(",").map((s) => s.trim()).filter(Boolean)
  );

  if (!workspaceId || !userId) {
    throw new Error(
      "Usage: node promote-top-candidates.mjs --workspace-id <id> --user-id <id> [--mandate-id <id>] [--promote-count 4] [--exclude-opportunity-ids <id,id>]"
    );
  }

  const service = baseUrl(args);
  const requestId = `acq-multi-promote-${crypto.randomUUID()}`;

  // Step 1: use existing mandate or create a new one from the workspace buy box
  let mandate;
  if (existingMandateId) {
    console.log(`[promote] Using existing mandate ${existingMandateId}`);
    const r = await req({ url: `${service}/api/acquisition/v1/mandates/${existingMandateId}`, requestId });
    mandate = r.mandate;
  } else {
    console.log("[promote] No mandate-id provided — creating a new mandate from the workspace buy box");
    const r = await req({
      url: `${service}/api/acquisition/v1/mandates`,
      method: "POST",
      requestId,
      body: {
        workspace_id: workspaceId,
        user_id: userId,
        title: "Riyadh Acquisition Cockpit - sourcing run",
        buy_box: { property_type: "villa", city: "Riyadh", district: "Al Arid", renovation_appetite: "medium" },
        target_locations: ["Al Arid", "North Riyadh"],
        budget_range: { min: 1500000, max: 4500000, currency: "SAR" },
        risk_appetite: "moderate",
      },
    });
    mandate = r.mandate;
  }

  console.log(`[promote] Mandate: ${mandate.id} buy_box=${JSON.stringify(mandate.buy_box_json || mandate.buy_box)}`);

  // Step 2: create ONE search run with high limits so the browser worker fetches many listings
  const searchRunRes = await req({
    url: `${service}/api/acquisition/v1/mandates/${mandate.id}/search-runs`,
    method: "POST",
    requestId,
    body: {
      sources: ["aqar", "bayut"],
      limits: {
        max_result_pages_per_source: 2,   // scan 2 result pages to get more listing cards
        max_detail_pages_per_source: 10,  // fetch up to 10 detail pages per source
        per_source_timeout_ms: 60000,
        per_run_timeout_ms: 180000,
      },
      query_description: "Riyadh North villa acquisition sourcing run",
    },
  });
  const searchRun = searchRunRes.search_run;
  console.log(`[promote] Search run created: ${searchRun.id}`);

  // Step 3: execute the search run (this triggers the Playwright browser worker)
  console.log("[promote] Running browser search (this takes ~1-2 minutes)...");
  const processed = await req({
    url: `${service}/internal/acquisition/search-run`,
    method: "POST",
    requestId,
    body: { search_run_id: searchRun.id },
  });
  console.log(`[promote] Browser search done. adapter_runs=${processed.adapter_runs?.length ?? 0}`);

  // Step 4: fetch all candidates from this run
  const candidatesRes = await req({
    url: `${service}/api/acquisition/v1/search-runs/${searchRun.id}/candidates`,
    requestId,
  });
  const allCandidates = candidatesRes.candidates || [];
  console.log(`[promote] Total candidates returned: ${allCandidates.length}`);
  allCandidates.forEach((c) => {
    console.log(`  - [${c.source}] ${(c.title || "").slice(0, 60)} | score=${fitScore(c)} decision=${c.screening_decision || "?"} status=${c.status}`);
  });

  // Step 5: rank by fit score and promote top N eligible ones
  const ranked = [...allCandidates]
    .filter(isEligible)
    .sort((a, b) => fitScore(b) - fitScore(a));

  console.log(`\n[promote] Eligible candidates: ${ranked.length} — will promote top ${promoteCount}`);

  const promoted = [];
  for (const candidate of ranked) {
    if (promoted.length >= promoteCount) break;
    console.log(`[promote] Promoting candidate ${candidate.id} (score=${fitScore(candidate)}) ...`);
    const promoteRes = await req({
      url: `${service}/api/acquisition/v1/candidates/${candidate.id}/promote`,
      method: "POST",
      requestId,
      body: {},
    });
    const opp = promoteRes.opportunity;
    if (excludeIds.has(opp?.id)) {
      console.log(`[promote]   Skipped (already excluded opportunity ${opp?.id})`);
      continue;
    }
    promoted.push({ candidate_id: candidate.id, opportunity_id: opp?.id, score: fitScore(candidate) });
    console.log(`[promote]   -> opportunity ${opp?.id}`);
  }

  console.log(`\n[promote] Done. Promoted ${promoted.length}/${promoteCount} opportunities:`);
  promoted.forEach((p) => console.log(`  - opp=${p.opportunity_id} candidate=${p.candidate_id} score=${p.score}`));

  if (promoted.length < promoteCount) {
    console.warn(`[promote] WARNING: Only found ${promoted.length} eligible candidates; market may not have ${promoteCount} qualifying listings right now.`);
  }

  return promoted;
}

main().catch((err) => {
  console.error("[promote] ERROR:", err.message);
  process.exitCode = 1;
});
