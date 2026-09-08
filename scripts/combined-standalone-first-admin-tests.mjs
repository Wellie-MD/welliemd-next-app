import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../src/pages/Labs.tsx", import.meta.url), "utf8");
const modal = readFileSync(
  new URL("../src/features/labs/components/LabAssignModal.tsx", import.meta.url),
  "utf8",
);
const combinedModal = readFileSync(
  new URL("../src/features/labs/components/LabCombinedModal.tsx", import.meta.url),
  "utf8",
);
const api = readFileSync(new URL("../src/api/labs.ts", import.meta.url), "utf8");
const types = readFileSync(new URL("../src/features/labs/types.ts", import.meta.url), "utf8");

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(
  /qualification_client_id/.test(api) && /qualification_client_id/.test(combinedModal),
  "Combined authoring must select and submit a qualification client.",
);
check(
  /getCombinedPanelClients/.test(api) && /eligible|readiness/.test(modal),
  "Combined assignment UI must present backend member eligibility facts.",
);
const combinedAssignmentBlock = page.match(/if \(item\.kind === "combined"\) \{([\s\S]*?)\} else \{/u)?.[1] || "";
check(
  !/syncAssignmentToTenant/.test(combinedAssignmentBlock),
  "Combined assignment must not synchronize member assignments one by one from React.",
);
check(
  !/onSubmitToJunction=\{handleSubmitToJunction\}/.test(page) &&
    !/onCheckStatus=\{handleCheckStatus\}/.test(page) &&
    !/onReplaceSubmission=\{handleReplaceSubmission\}/.test(page),
  "Combined assignment must not expose Combined-level Submit, Check, or Replace actions.",
);
check(
  /sync_status/.test(types) && /sync_attempt_count/.test(types) && /sync_error/.test(types),
  "Admin types must expose recoverable grouped-sync state.",
);
check(
  /data\.combined_panel/.test(api) && !/return data\.successor/.test(api),
  "Supersession must parse the backend combined_panel response key.",
);

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  assert.fail(`${failures.length} standalone-first Admin contract check(s) failed`);
}

console.log("Admin standalone-first Combined contract passed.");
