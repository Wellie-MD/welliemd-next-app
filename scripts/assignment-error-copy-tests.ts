import { strict as assert } from "assert";

import {
  publishAssignmentErrorMessage,
  safeAssignmentMessage,
} from "../src/features/treatments/assignment/constants.ts";

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

assert.equal(
  publishAssignmentErrorMessage({
    error: "publish_blocked",
    blockers: [
      {
        message:
          "The editable source differs from its published release. Republish before assignment.",
      },
    ],
  }),
  "The editable source differs from its published release. Republish before assignment.",
);
assert.equal(
  publishAssignmentErrorMessage({ error: "publish_blocked" }),
  "Unable to publish because the configuration needs attention. Review the publish requirements and try again.",
);

console.log("All assignment error-copy tests passed.");
