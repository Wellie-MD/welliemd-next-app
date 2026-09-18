import assert from "node:assert/strict";
import { consentFromRecord, consentToRecord } from "../src/features/treatments/api/mappers";

const femaleOnly = {
  mode: "nested" as const,
  rules: [{ source: "patient_profile" as const, field: "sex", questionId: "__patient_profile_sex__", operator: "eq" as const, value: "Female" }],
  subgroups: [],
};

const consent = consentFromRecord({
  id: "consent-1", name: "Female consent", scope: "global", visit_type_keys: [],
  text: "I agree", options: [], version: 1, visibility_rule: femaleOnly,
});
assert.deepEqual(consent.visibilityRuleGroup, femaleOnly);
assert.deepEqual(consentToRecord(consent).visibility_rule, femaleOnly);

const legacy = consentFromRecord({
  id: "consent-2", name: "General consent", scope: "global", visit_type_keys: [],
  text: "I agree", options: [], version: 1,
});
assert.equal(legacy.visibilityRuleGroup, undefined);
assert.deepEqual(consentToRecord(legacy).visibility_rule, {});
console.log("PASS consent library rule survives API mapping and legacy rows remain unconditional");
