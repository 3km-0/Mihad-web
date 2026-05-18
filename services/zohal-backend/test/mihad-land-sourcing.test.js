import assert from "node:assert/strict";
import test from "node:test";
import { buildActivationLandSourcingPayload } from "../src/mihad/land-sourcing.js";

test("operator land sourcing payload is tied to tenant demand", () => {
  const payload = buildActivationLandSourcingPayload({
    rfq: {
      id: "rfq_1",
      workspace_id: "workspace_1",
      mandate_id: "mandate_1",
      user_id: "user_1",
    },
    activationRequest: {
      city: "Riyadh",
      district: "Al Arid",
      business_activity: "vehicle_showroom",
      required_land_area_sqm: 1500,
      monthly_budget: 80000,
    },
    sourceRunId: "source_run_1",
  });

  assert.equal(payload.operator_only, true);
  assert.equal(payload.preview_only, false);
  assert.equal(payload.search_run.trigger_kind, "activation_land_sourcing");
  assert.equal(payload.search_run.query_json.city, "Riyadh");
  assert.equal(payload.search_run.query_json.required_land_area_sqm, 1500);
  assert.equal(payload.mandate.buy_box_json.asset_type, "commercial_land");
});
