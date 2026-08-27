import { strict as assert } from "assert";

import { safeAssignmentMessage } from "../src/features/treatments/assignment/constants.ts";

const rawId = "67f8ac64-a6d8-55d9-a9b3-3e85ad517c98";
const safe = safeAssignmentMessage({
  message: `Consent ${rawId} is unresolved for this release.`,
  context: { source_id: rawId },
});

assert.equal(safe.includes(rawId), false);
assert.equal(safe.includes("the referenced item"), true);
assert.equal(
  safeAssignmentMessage(`program:${rawId}`).includes(rawId),
  false,
);

console.log("All assignment error-copy tests passed.");
