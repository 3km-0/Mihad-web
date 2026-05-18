const ACTIONS = new Set([
  "request_land_info",
  "request_site_visit",
  "request_prefab_quote",
  "run_prefab_estimate",
  "run_spread_underwriting",
  "prepare_landowner_outreach",
  "prepare_supplier_intro",
  "prepare_broker_manager_intro",
  "mark_pass",
  "mark_pursue",
  "mark_operator_candidate",
  "mark_closed",
]);

const APPROVAL_REQUIRED = new Set([
  "request_land_info",
  "request_site_visit",
  "request_prefab_quote",
  "prepare_landowner_outreach",
  "prepare_supplier_intro",
  "prepare_broker_manager_intro",
  "mark_operator_candidate",
]);

function text(value) {
  return String(value || "").trim();
}

export function resolveActivationAction(body = {}) {
  const requested = text(body.action_type || body.action);
  const action_type = ACTIONS.has(requested) ? requested : "mark_pursue";
  const approval_required = APPROVAL_REQUIRED.has(action_type);
  const stageByAction = {
    mark_pass: "passed",
    mark_pursue: "pursue",
    mark_operator_candidate: "operator_candidate",
    mark_closed: "closed",
  };
  return {
    action_type,
    pipeline_state: stageByAction[action_type] || "active",
    approval_required,
    draft_payload: {
      action_type,
      target: body.target || null,
      message: body.message || body.draft_message || null,
      assumptions: body.assumptions || {},
      created_by_tool: "activation_action_resolver_v1",
    },
  };
}
