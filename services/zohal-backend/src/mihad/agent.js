import {
  createChatCompletion,
  extractOutputText,
} from "../analysis/ai-provider.js";

const DEFAULT_AGENT_MODEL = "gpt-5.5";
const TOOL_NAMES = new Set([
  "MandateTool.update",
  "SourcingTool.create_search_run",
  "ShortlistTool.promote_candidate",
  "QualificationTool.ensure_profile",
  "QualificationTool.create_buyer_packet",
  "BrokerActivationTool.list_brokers",
  "BrokerActivationTool.prepare_consent_grant",
  "BrokerActivationTool.prepare_outreach_approval",
  "FollowUpTool.log_event",
]);

function normalizeText(value) {
  return String(value || "").trim();
}

function parseJsonObject(text) {
  const raw = normalizeText(text);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function normalizeToolCalls(value) {
  const calls = Array.isArray(value) ? value : [];
  return calls
    .map((call) => ({
      tool: normalizeText(call?.tool),
      input: call?.input && typeof call.input === "object" && !Array.isArray(call.input)
        ? call.input
        : {},
    }))
    .filter((call) => TOOL_NAMES.has(call.tool))
    .slice(0, 3);
}

function mandateNeedsSearch(context) {
  const runs = Array.isArray(context?.search_runs) ? context.search_runs : [];
  return !runs.some((run) => ["queued", "running", "completed"].includes(run?.status));
}

function latestActivePacket(context) {
  const packets = Array.isArray(context?.buyer_packets) ? context.buyer_packets : [];
  return packets.find((packet) => packet?.status === "active") || null;
}

export function buildDeterministicMihadPlan({ message, context = {} }) {
  const text = normalizeText(message);
  const lower = text.toLowerCase();
  const mandate = context.mandate || null;
  const readiness = context.readiness_profile || null;
  const selectedOpportunityId = context.selected_opportunity_id || context.selectedOpportunityId || null;
  const wantsSearch = /search|source|find|shortlist|options|listings|run|ابحث|خيارات|عقارات/i.test(text);
  const wantsPacket = /packet|qualif|readiness|broker ready|ملف|جاهزية|تأهيل/i.test(text);
  const wantsBroker = /broker|outreach|contact|share|وسيط|تواصل|شارك/i.test(text);
  const toolCalls = [];

  if (mandate?.id && wantsSearch && mandateNeedsSearch(context)) {
    toolCalls.push({
      tool: "SourcingTool.create_search_run",
      input: {
        instruction: text,
        sources: context.default_sources || ["aqar", "bayut", "property_finder"],
      },
    });
  }

  if (!readiness?.id && (wantsPacket || wantsBroker)) {
    toolCalls.push({
      tool: "QualificationTool.ensure_profile",
      input: {
        mandate_summary: mandate?.title || text,
        funding_path: mandate?.liquidity_class || "needs_financing_guidance",
      },
    });
  }

  if (readiness?.id && wantsPacket && !latestActivePacket(context)) {
    toolCalls.push({
      tool: "QualificationTool.create_buyer_packet",
      input: {
        buyer_profile_id: readiness.id,
      },
    });
  }

  if (wantsBroker) {
    toolCalls.push({
      tool: "BrokerActivationTool.list_brokers",
      input: {
        country_code: Array.isArray(mandate?.target_country_codes) ? mandate.target_country_codes[0] : "SA",
      },
    });
    if (selectedOpportunityId && readiness?.id) {
      toolCalls.push({
        tool: "BrokerActivationTool.prepare_outreach_approval",
        input: {
          opportunity_id: selectedOpportunityId,
          buyer_profile_id: readiness.id,
          message_intent: "broker_activation",
        },
      });
    }
  }

  return {
    assistant_message: toolCalls.length
      ? "I can help with that. I will use the workspace actions that match this step and keep broker outreach approval-gated."
      : "I captured that. Next, I need either a clearer sourcing instruction, readiness documents, or a broker-sharing decision.",
    reasoning_summary: "Deterministic fallback selected safe Mihad actions from the buyer workspace state.",
    tool_calls: toolCalls.slice(0, 3),
    next_state: toolCalls.length ? "action_ready" : "needs_clarification",
  };
}

export async function planMihadBrokerAgentTurn({ message, context = {}, requestId } = {}) {
  const deterministic = buildDeterministicMihadPlan({ message, context });
  if (String(process.env.MIHAD_AGENT_AI || "").trim().toLowerCase() === "disabled") {
    return { ...deterministic, planner: "deterministic" };
  }

  try {
    const model = normalizeText(process.env.MIHAD_AGENT_MODEL) || DEFAULT_AGENT_MODEL;
    const response = await createChatCompletion({
      model,
      temperature: 0.1,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: [
            "You are Mihad, an authenticated buyer-side AI property scout and broker agent.",
            "Return only JSON. Do not write directly to databases. You may only request the listed deterministic tools.",
            "Anonymous actions are not available here; this is an authenticated workspace.",
            "Never request broker outreach unless buyer qualification, consent, and approval gates are represented by tools.",
            "Allowed tools: MandateTool.update, SourcingTool.create_search_run, ShortlistTool.promote_candidate, QualificationTool.ensure_profile, QualificationTool.create_buyer_packet, BrokerActivationTool.list_brokers, BrokerActivationTool.prepare_consent_grant, BrokerActivationTool.prepare_outreach_approval, FollowUpTool.log_event.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            message: normalizeText(message).slice(0, 2000),
            context,
            response_schema: {
              assistant_message: "short user-facing answer",
              reasoning_summary: "short internal-safe explanation",
              tool_calls: [{ tool: "AllowedTool.name", input: {} }],
              next_state: "needs_clarification|action_ready|search_running|broker_ready",
            },
          }),
        },
      ],
    }, { requestId, workspaceId: context.workspace_id });
    const parsed = parseJsonObject(extractOutputText(response));
    if (!parsed) return { ...deterministic, planner: "deterministic_after_model_parse_failure" };
    return {
      assistant_message: normalizeText(parsed.assistant_message) || deterministic.assistant_message,
      reasoning_summary: normalizeText(parsed.reasoning_summary) || deterministic.reasoning_summary,
      tool_calls: normalizeToolCalls(parsed.tool_calls),
      next_state: normalizeText(parsed.next_state) || deterministic.next_state,
      planner: "model",
      model,
    };
  } catch (error) {
    return {
      ...deterministic,
      planner: "deterministic_after_model_failure",
      model_error: error instanceof Error ? error.message : String(error),
    };
  }
}
