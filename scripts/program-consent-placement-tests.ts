import { strict as assert } from "node:assert";
import {
  compatibleProgramConsents,
  countExplicitProgramConsents,
  programConsentScopeLabel,
} from "../src/features/treatments/programs/utils/programConsentPlacement";

const consents = [
  { id: "global", name: "Truthfulness", scope: "global" as const, visitTypeKeys: [] },
  { id: "weight", name: "GLP", scope: "visit_type" as const, visitTypeKeys: ["Weight Loss"] },
  { id: "trt", name: "TRT", scope: "visit_type" as const, visitTypeKeys: ["trt"] },
  { id: "archived", name: "Old", scope: "global" as const, visitTypeKeys: [], isArchived: true },
];

assert.equal(countExplicitProgramConsents([]), 0);
assert.equal(countExplicitProgramConsents(["global", "global", "weight"]), 2);
assert.deepEqual(
  compatibleProgramConsents(consents, "weight loss").map((consent) => consent.id),
  ["global", "weight"],
);
assert.deepEqual(
  compatibleProgramConsents(consents, "weightloss").map((consent) => consent.id),
  ["global"],
);
assert.equal(programConsentScopeLabel(consents[0]), "Universal");
assert.equal(programConsentScopeLabel(consents[1]), "Visit Type: Weight Loss");
console.log("PASS Program consent placement uses explicit counts and real Visit Type metadata");
