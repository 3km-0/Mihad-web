import assert from "node:assert/strict";
import test from "node:test";
import { buildDeterministicMihadPlan } from "../src/mihad/agent.js";
import { mihadToolDefinitions } from "../src/mihad/agent-tools.js";

test("deterministic Mihad planner creates a sourcing tool call for authenticated search", () => {
  const plan = buildDeterministicMihadPlan({
    message: "Search live options for family villas in North Riyadh under 2.5M",
    context: {
      mandate: {
        id: "mandate_1",
        title: "Family villa mandate",
        target_country_codes: ["SA"],
      },
      search_runs: [],
    },
  });

  assert.equal(plan.tool_calls[0].tool, "SourcingTool.create_search_run");
  assert.match(plan.assistant_message, /workspace actions/i);
});

test("deterministic Mihad planner keeps broker outreach approval-gated", () => {
  const plan = buildDeterministicMihadPlan({
    message: "Contact a broker about this property",
    context: {
      selected_opportunity_id: "opp_1",
      mandate: {
        id: "mandate_1",
        title: "Buyer mandate",
        target_country_codes: ["AE"],
      },
      readiness_profile: {
        id: "profile_1",
        readiness_level: 4,
      },
      buyer_packets: [{ id: "packet_1", status: "active" }],
    },
  });

  assert(plan.tool_calls.some((call) => call.tool === "BrokerActivationTool.list_brokers"));
  assert(plan.tool_calls.some((call) => call.tool === "BrokerActivationTool.prepare_outreach_approval"));
  assert(!plan.tool_calls.some((call) => call.tool === "agent_outbox_messages.send"));
});

test("Mihad tool contracts expose only action-based tools", () => {
  const definitions = mihadToolDefinitions();
  assert.deepEqual(Object.keys(definitions).sort(), [
    "BrokerActivationTool.list_brokers",
    "BrokerActivationTool.prepare_consent_grant",
    "BrokerActivationTool.prepare_outreach_approval",
    "FollowUpTool.log_event",
    "MandateTool.update",
    "QualificationTool.create_buyer_packet",
    "QualificationTool.ensure_profile",
    "ShortlistTool.promote_candidate",
    "SourcingTool.create_search_run",
  ]);
  assert.equal(definitions["BrokerActivationTool.list_brokers"].write, false);
  assert.equal(definitions["BrokerActivationTool.prepare_outreach_approval"].write, true);
});
