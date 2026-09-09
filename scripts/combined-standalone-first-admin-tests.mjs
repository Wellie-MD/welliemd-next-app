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
const table = readFileSync(
  new URL("../src/features/labs/components/LabsTable.tsx", import.meta.url),
  "utf8",
);

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(
  /qualification_client_id/.test(api) && /qualification_client_id/.test(combinedModal),
  "Combined authoring must select and submit a qualification client.",
);
check(
  /selectedQualificationCandidate/.test(combinedModal) &&
    /qualificationCandidate=\{selectedQualificationCandidate\}/.test(combinedModal),
  "Combined comparison must render readiness from the selected qualification client.",
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
check(
  /onReviewCombined/.test(table) && /Review and publish/.test(table),
  "Combined rows that need clinical review must expose a clear Review and publish action.",
);
check(
  /isCombinedAssignmentReady/.test(table) && /isCombinedAssignmentReady/.test(page),
  "Combined assignment must require both structural readiness and published clinical approval.",
);
check(
  /initialPanel=\{selectedCombinedPanel\}/.test(page) && /reviewOnly/.test(page),
  "Labs page must mount the dedicated Combined review/publication workflow without restoring metadata editing.",
);
check(
  /matching LOINC evidence/.test(combinedModal) && /Admin confirmation/.test(combinedModal),
  "The review workflow must explain why an exact candidate still needs review.",
);
check(
  /validateCombinedMembers/.test(combinedModal) && /unvalidated/.test(combinedModal),
  "Legacy draft/unvalidated Combined panels must be re-evaluated and given an approval path.",
);
check(
  /response\?\.data\?\.detail/.test(page),
  "Assignment failures must show the backend's precise blocking reason.",
);
check(
  /onRetryCombinedSync/.test(modal) && /Retry sync/.test(modal),
  "Failed grouped syncs must expose an explicit Retry sync action.",
);
check(
  /sync_error/.test(modal) && /handleRetryCombinedSync/.test(page),
  "Combined sync failures must show their reason and retry through the grouped endpoint.",
);
check(
  /operational_status \|\| method\.readiness_code/.test(modal),
  "Combined member rows must display the API operational status instead of showing Unknown.",
);

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  assert.fail(`${failures.length} standalone-first Admin contract check(s) failed`);
}

console.log("Admin standalone-first Combined contract passed.");
