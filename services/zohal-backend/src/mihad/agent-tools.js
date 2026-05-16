const TOOL_DEFINITIONS = {
  "MandateTool.update": {
    description: "Update the saved buyer mandate and return remaining mandate gaps.",
    write: true,
  },
  "SourcingTool.create_search_run": {
    description: "Create an authenticated browser-backed search run and queue processing.",
    write: true,
  },
  "ShortlistTool.promote_candidate": {
    description: "Promote a selected sourced candidate into the canonical shortlist.",
    write: true,
  },
  "QualificationTool.ensure_profile": {
    description: "Create a buyer readiness profile when the workspace does not have one.",
    write: true,
  },
  "QualificationTool.create_buyer_packet": {
    description: "Create a derived-only buyer packet from readiness signals.",
    write: true,
  },
  "BrokerActivationTool.list_brokers": {
    description: "List active vetted broker partners for a launch market.",
    write: false,
  },
  "BrokerActivationTool.prepare_consent_grant": {
    description: "Grant status-only buyer packet visibility to a selected broker partner.",
    write: true,
  },
  "BrokerActivationTool.prepare_outreach_approval": {
    description: "Prepare approval-gated broker outreach without sending it.",
    write: true,
  },
  "FollowUpTool.log_event": {
    description: "Log a safe workspace follow-up event.",
    write: true,
  },
};

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeUuid(value) {
  return normalizeText(value).toLowerCase() || null;
}

function firstLaunchCountry(value) {
  const countries = Array.isArray(value) ? value : [];
  const code = normalizeText(countries[0]).toUpperCase();
  return ["SA", "AE", "TR"].includes(code) ? code : "SA";
}

export function mihadToolDefinitions() {
  return TOOL_DEFINITIONS;
}

export async function executeMihadToolCall({
  call,
  deps,
  context,
  req,
  requestId,
} = {}) {
  const tool = normalizeText(call?.tool);
  const input = call?.input && typeof call.input === "object" && !Array.isArray(call.input)
    ? call.input
    : {};
  if (!Object.prototype.hasOwnProperty.call(TOOL_DEFINITIONS, tool)) {
    return { tool, status: "blocked", reason: "unknown_tool" };
  }

  const workspaceId = normalizeUuid(context.workspace_id);
  const userId = normalizeUuid(context.user_id);
  const mandate = context.mandate || null;
  const readiness = context.readiness_profile || null;

  if (tool === "MandateTool.update") {
    if (!mandate?.id) return { tool, status: "blocked", reason: "mandate_required" };
    const result = await deps.clarifyMandate(context.supabase, mandate.id, {
      ...input,
      user_id: userId,
    });
    return { tool, status: "completed", result };
  }

  if (tool === "SourcingTool.create_search_run") {
    const result = await deps.createWorkspaceSearchRun({
      supabase: context.supabase,
      req,
      requestId,
      workspaceId,
      userId,
      body: {
        instruction: normalizeText(input.instruction) || normalizeText(context.message),
        sourcing_instruction: normalizeText(input.instruction) || normalizeText(context.message),
        sources: Array.isArray(input.sources) && input.sources.length
          ? input.sources
          : ["aqar", "bayut", "property_finder"],
        limits: {
          max_result_pages_per_source: 1,
          max_detail_pages_per_source: 8,
          per_source_timeout_ms: 45000,
          per_run_timeout_ms: 120000,
          retry_transient_failures: true,
          ...(input.limits && typeof input.limits === "object" ? input.limits : {}),
        },
      },
    });
    return { tool, status: "completed", result };
  }

  if (tool === "ShortlistTool.promote_candidate") {
    const candidateId = normalizeUuid(input.candidate_id);
    if (!candidateId) return { tool, status: "blocked", reason: "candidate_id_required" };
    const result = await deps.promoteCandidate(context.supabase, candidateId);
    return { tool, status: "completed", result };
  }

  if (tool === "QualificationTool.ensure_profile") {
    if (readiness?.id) {
      return { tool, status: "skipped", reason: "readiness_profile_exists", result: { profile: readiness } };
    }
    const result = await deps.createReadinessProfile(context.supabase, {
      workspace_id: workspaceId,
      mandate_id: mandate?.id || null,
      user_id: userId,
      buyer_user_id: userId,
      mandate_summary: normalizeText(input.mandate_summary) || mandate?.title || "Mihad buyer mandate",
      funding_path: normalizeText(input.funding_path) || mandate?.liquidity_class || "needs_financing_guidance",
      sharing_mode: "private",
      metadata_json: {
        source: "mihad_agent",
        target_country_codes: mandate?.target_country_codes || ["SA"],
      },
    });
    return { tool, status: "completed", result: { profile: result } };
  }

  if (tool === "QualificationTool.create_buyer_packet") {
    const profileId = normalizeUuid(input.buyer_profile_id || readiness?.id);
    if (!profileId) return { tool, status: "blocked", reason: "buyer_profile_id_required" };
    const result = await deps.createBuyerPacket(context.supabase, {
      buyer_profile_id: profileId,
      workspace_id: workspaceId,
      user_id: userId,
      preferences: {
        source: "mihad_agent",
      },
    });
    return { tool, status: "completed", result };
  }

  if (tool === "BrokerActivationTool.list_brokers") {
    const result = await deps.listBrokerPartners(context.supabase, {
      country_code: normalizeText(input.country_code).toUpperCase() || firstLaunchCountry(mandate?.target_country_codes),
      status: "active",
    });
    return { tool, status: "completed", result };
  }

  if (tool === "BrokerActivationTool.prepare_consent_grant") {
    const packetId = normalizeUuid(input.packet_id || context.active_packet?.id);
    const brokerPartnerId = normalizeUuid(input.broker_partner_id);
    if (!packetId) return { tool, status: "blocked", reason: "active_buyer_packet_required" };
    if (!brokerPartnerId) return { tool, status: "blocked", reason: "broker_partner_id_required" };
    const result = await deps.grantBuyerPacketToBroker(context.supabase, packetId, {
      broker_partner_id: brokerPartnerId,
      opportunity_id: normalizeUuid(input.opportunity_id || context.selected_opportunity_id),
      user_id: userId,
      purpose: "share_buyer_readiness_with_broker",
    });
    return { tool, status: "completed", result };
  }

  if (tool === "BrokerActivationTool.prepare_outreach_approval") {
    const profileId = normalizeUuid(input.buyer_profile_id || readiness?.id);
    const opportunityId = normalizeUuid(input.opportunity_id || context.selected_opportunity_id);
    if (!profileId) return { tool, status: "blocked", reason: "buyer_profile_id_required" };
    if (!opportunityId) return { tool, status: "blocked", reason: "opportunity_id_required" };
    const result = await deps.createExternalActionApproval(context.supabase, {
      workspace_id: workspaceId,
      opportunity_id: opportunityId,
      buyer_profile_id: profileId,
      action_type: "send_outreach",
      acquisition_action_id: "activate_buyer_broker",
      draft_payload_json: {
        source: "mihad_agent",
        message_intent: normalizeText(input.message_intent) || "broker_activation",
        broker_partner_id: normalizeUuid(input.broker_partner_id),
      },
      approval_status: "pending",
      user_id: userId,
      requested_by: userId,
    });
    return { tool, status: "completed", result: { approval: result } };
  }

  if (tool === "FollowUpTool.log_event") {
    const result = await deps.insertAcquisitionEvent(context.supabase, {
      workspace_id: workspaceId,
      opportunity_id: normalizeUuid(input.opportunity_id || context.selected_opportunity_id),
      event_type: normalizeText(input.event_type) || "mihad_agent_follow_up",
      event_direction: "system",
      body_text: normalizeText(input.body_text).slice(0, 1000) || "Mihad agent follow-up logged.",
      event_payload: {
        source: "mihad_agent",
        note: normalizeText(input.note).slice(0, 1000) || null,
      },
    });
    return { tool, status: "completed", result: { event: result } };
  }

  return { tool, status: "blocked", reason: "not_implemented" };
}
