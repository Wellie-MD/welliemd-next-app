import { strict as assert } from "node:assert";
import { suggestUniqueCustomProgramSlug } from "../src/features/treatments/custom-programs/utils/customProgramSlug";

assert.equal(
  suggestUniqueCustomProgramSlug("Multi-treatment program", []),
  "multi-treatment-program",
);
assert.equal(
  suggestUniqueCustomProgramSlug("Multi-treatment program", ["multi-treatment-program"]),
  "multi-treatment-program-2",
);
assert.equal(
  suggestUniqueCustomProgramSlug(
    "Multi-treatment program",
    ["multi-treatment-program", "multi-treatment-program-2"],
  ),
  "multi-treatment-program-3",
);
assert.equal(
  suggestUniqueCustomProgramSlug("  Follow-up / GLP  ", ["follow-up-glp"]),
  "follow-up-glp-2",
);
assert.equal(
  suggestUniqueCustomProgramSlug("!!!", []),
  "custom-program",
);

console.log("PASS suggests a valid available slug for new custom programs");
