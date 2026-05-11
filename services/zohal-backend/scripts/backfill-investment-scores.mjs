#!/usr/bin/env node
/**
 * Backfill Investment Quality Scores for existing acquisition opportunities.
 *
 * Fetches opportunities that don't yet have metadata_json->>'investment_score',
 * looks up the linked candidate + mandate, runs the 5-pillar scorer, and
 * patches the opportunity's metadata_json in-place.
 *
 * Usage:
 *   node scripts/backfill-investment-scores.mjs \
 *     --workspace-id <uuid>          # required: limit to one workspace
 *     [--dry-run]                    # print scores without writing to DB
 *     [--force]                      # re-score even if investment_score already set
 *
 * Environment (same as other backend scripts):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { computeInvestmentScore } from "../src/market/investment-scorer.js";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    if (argv[i].startsWith("--") && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      args[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[++i];
    } else if (argv[i].startsWith("--")) {
      args[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = true;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const WORKSPACE_ID = args.workspaceId;
const DRY_RUN = Boolean(args.dryRun || args.dry);
const FORCE = Boolean(args.force);

if (!WORKSPACE_ID) {
  console.error("Usage: node backfill-investment-scores.mjs --workspace-id <uuid> [--dry-run] [--force]");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Supabase client (service role — needs RLS bypass for reading candidates)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`[backfill] workspace=${WORKSPACE_ID}  dry_run=${DRY_RUN}  force=${FORCE}`);

  // Fetch opportunities for this workspace
  const { data: opps, error: oppsErr } = await supabase
    .from("acquisition_opportunities")
    .select("id, title, metadata_json")
    .eq("workspace_id", WORKSPACE_ID)
    .order("created_at", { ascending: true });

  if (oppsErr) throw oppsErr;
  if (!opps?.length) { console.log("[backfill] No opportunities found."); return; }

  console.log(`[backfill] Found ${opps.length} opportunity/ies`);

  let updated = 0;
  let skipped = 0;
  let errored = 0;

  for (const opp of opps) {
    const existingScore = opp.metadata_json?.investment_score;
    if (existingScore != null && !FORCE) {
      console.log(`  [skip] ${opp.id.slice(0, 8)}… already has score=${existingScore}`);
      skipped++;
      continue;
    }

    // Resolve candidate — stored in metadata_json.candidate_id
    const candidateId = opp.metadata_json?.candidate_id;
    if (!candidateId) {
      console.warn(`  [skip] ${opp.id.slice(0, 8)}… no candidate_id in metadata — demo/manual seed`);
      skipped++;
      continue;
    }

    // Fetch candidate row
    const { data: candidate, error: candidateErr } = await supabase
      .from("acquisition_candidate_opportunities")
      .select("*")
      .eq("id", candidateId)
      .maybeSingle();
    if (candidateErr || !candidate) {
      console.warn(`  [warn] ${opp.id.slice(0, 8)}… candidate ${candidateId} not found`);
      errored++;
      continue;
    }

    // Fetch mandate
    let mandate = null;
    if (candidate.mandate_id) {
      const { data: m } = await supabase
        .from("acquisition_mandates")
        .select("*")
        .eq("id", candidate.mandate_id)
        .maybeSingle();
      mandate = m ?? null;
    }

    // Compute score
    let iqs;
    try {
      iqs = await computeInvestmentScore({ candidate, mandate, supabase });
    } catch (err) {
      console.error(`  [error] ${opp.id.slice(0, 8)}… scoring failed: ${err.message}`);
      errored++;
      continue;
    }

    const { total, breakdown, market_district_matched } = iqs;
    const label = `"${(opp.title || "").slice(0, 50)}"`;
    console.log(
      `  [score] ${opp.id.slice(0, 8)}… ${label}\n` +
      `           total=${total}  district_match="${market_district_matched}"\n` +
      `           P1=${breakdown.p1_price_efficiency.pts}  P2=${breakdown.p2_market_momentum.pts}  ` +
      `P3=${breakdown.p3_market_liquidity.pts}  P4=${breakdown.p4_evidence_quality.pts}  ` +
      `P5=${breakdown.p5_budget_position.pts}`,
    );

    if (DRY_RUN) { updated++; continue; }

    // Patch metadata_json preserving all existing keys
    const { error: patchErr } = await supabase
      .from("acquisition_opportunities")
      .update({
        metadata_json: {
          ...opp.metadata_json,
          investment_score: total,
          investment_score_breakdown: iqs,
        },
      })
      .eq("id", opp.id);

    if (patchErr) {
      console.error(`  [error] Failed to update ${opp.id}: ${patchErr.message}`);
      errored++;
    } else {
      updated++;
    }
  }

  console.log(`\n[backfill] Done. updated=${updated}  skipped=${skipped}  errors=${errored}`);
  if (DRY_RUN) console.log("[backfill] DRY RUN — no writes performed.");
}

main().catch((err) => {
  console.error("[backfill] Fatal error:", err.message);
  process.exitCode = 1;
});
