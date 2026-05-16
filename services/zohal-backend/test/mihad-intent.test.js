import assert from "node:assert/strict";
import test from "node:test";
import { parseMihadScoutIntent } from "../src/mihad/intent.js";

test("parses English property scout intent without triggering side effects", () => {
  const result = parseMihadScoutIntent({
    prompt: "3-bedroom apartment in North Riyadh under SAR 1.5M, financing, within 3 months",
    locale: "en",
  });

  assert.equal(result.accepted, true);
  assert.equal(result.intent.target_country_codes[0], "SA");
  assert.equal(result.intent.city[0], "Riyadh");
  assert.equal(result.intent.property_type, "apartment");
  assert.equal(result.intent.budget_max, 1_500_000);
  assert.equal(result.intent.financing_posture, "financing_ready");
  assert.equal(result.turn.gate_state, "ready_for_auth");
});

test("parses Arabic monthly-payment scout intent", () => {
  const result = parseMihadScoutIntent({
    prompt: "شقة ٣ غرف في شمال الرياض، قسطها أقل من ٧ آلاف",
    locale: "ar",
  });

  assert.equal(result.accepted, true);
  assert.equal(result.intent.locale, "ar");
  assert.equal(result.intent.target_country_codes[0], "SA");
  assert.equal(result.intent.property_type, "apartment");
  assert.equal(result.intent.monthly_payment_max, 7_000);
  assert.equal(result.intent.currency, "SAR");
});

test("rejects unrelated homepage prompts", () => {
  const result = parseMihadScoutIntent({
    prompt: "write me a poem about product management",
    locale: "en",
  });

  assert.equal(result.accepted, false);
  assert.equal(result.preview_cards.length, 0);
  assert.equal(result.turn.gate_state, "needs_clarification");
});
