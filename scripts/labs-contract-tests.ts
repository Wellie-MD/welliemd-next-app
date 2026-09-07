import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../src/pages/Labs.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../src/api/labs.ts", import.meta.url), "utf8");
const combinedModal = readFileSync(new URL("../src/features/labs/components/LabCombinedModal.tsx", import.meta.url), "utf8");
const combinedExperience = readFileSync(new URL("../src/features/labs/components/CombinedAuthoringExperience.tsx", import.meta.url), "utf8");
const combinedAuthoring = `${combinedModal}\n${combinedExperience}`;
const labsTable = readFileSync(new URL("../src/features/labs/components/LabsTable.tsx", import.meta.url), "utf8");
const labTypes = readFileSync(new URL("../src/features/labs/types.ts", import.meta.url), "utf8");

const failures: string[] = [];
const check = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

check(
  /getAssignmentSummaries\s*:\s*async/.test(api),
  "Admin Labs needs one aggregate assignment-summary API instead of one request per panel.",
);
check(
  /labsApi\.getAssignmentSummaries\(\)/.test(page),
  "Admin Labs must consume the aggregate assignment-summary response.",
);
check(
  !/for\s*\(const lab of labs\)[\s\S]{0,900}getClientsForLabAssignment\(lab\.id\)/.test(page),
  "Admin Labs must not issue getClientsForLabAssignment once for every listed panel.",
);
check(
  /members\.map\(/.test(combinedAuthoring),
  "Combined Panel edit mode must render the backend-authored member matrix.",
);
check(
  !/initialPanel\.members\.find\(m\s*=>\s*m\.collection_method\s*===\s*row\.method\)/.test(combinedModal),
  "Combined Panel edit mode must not reconstruct members from the fixed method template.",
);
check(
  /combinedApprove/.test(readFileSync(new URL("../src/features/labs/api/endpoints.ts", import.meta.url), "utf8")) &&
    /combinedPublish/.test(readFileSync(new URL("../src/features/labs/api/endpoints.ts", import.meta.url), "utf8")) &&
    /approveCombinedPanel/.test(api) &&
    /publishCombinedPanel/.test(api),
  "Combined Panel approval and publish actions must use explicit Admin API contracts.",
);
check(
  /approveCombinedPanel/.test(combinedModal) && /Publish/.test(combinedModal),
  "Combined Panel edit mode must expose the explicit approval workflow.",
);
check(
  /combinedSupersede/.test(readFileSync(new URL("../src/features/labs/api/endpoints.ts", import.meta.url), "utf8")) &&
    /supersedeCombinedPanel/.test(api) &&
    /successor/.test(combinedModal),
  "Published Combined Panel definitions must have an explicit successor workflow.",
);
check(
  ["At-home phlebotomy", "Walk-in test", "Test kit", "On-site collection"].every(label => labTypes.includes(label)) &&
    /INITIAL_COMBINED_METHODS/.test(combinedModal),
  "Create Combined Panel must expose all four approved collection-method slots.",
);
check(
  /cost_to_welliemd/.test(labsTable) && /Linked/.test(labsTable),
  "Combined rows must present Admin cost and logical linkage like the approved Labs table.",
);
check(
  ["Select labs", "Understand comparison", "Confirm decision"].every(label => combinedAuthoring.includes(label)),
  "Combined authoring must use the approved three-step plain-language journey.",
);
check(
  /The system explains\. You decide\./.test(combinedAuthoring) &&
    /Differences found/.test(combinedAuthoring) && /Not enough information/.test(combinedAuthoring),
  "Combined authoring must explain flexible evidence states in plain language.",
);
check(
  /Why should these labs be offered together\?/.test(combinedAuthoring) &&
    /review reason/i.test(combinedAuthoring),
  "Combined authoring must capture an Admin reason for attention items.",
);
check(
  !/Biomarkers match/.test(combinedAuthoring),
  "Combined authoring must not make an inaccurate automatic compatibility claim.",
);
check(
  /shared_loinc_codes/.test(combinedAuthoring) &&
    /member_only_loinc_codes/.test(combinedAuthoring) &&
    /View full comparison/.test(combinedAuthoring),
  "Combined authoring must show the backend-authored expected-result comparison.",
);
check(
  !/Promise\.allSettled\([\s\S]{0,300}syncAssignmentToTenant/.test(page) &&
    /for\s*\(const assignmentId of [^)]+\)[\s\S]{0,180}await labsApi\.syncAssignmentToTenant\(assignmentId\)/.test(page),
  "Combined-panel member tenant sync must run sequentially because members share one offering.",
);
check(
  /pendingCombinedSubmissions/.test(
    readFileSync(new URL("../src/features/labs/components/LabAssignModal.tsx", import.meta.url), "utf8"),
  ) && /getPendingJunctionSubmissionIds\(client\)/.test(page),
  "Combined client rows must derive Submit visibility and submission targets from their member methods.",
);
check(
  /isSubmitting/.test(
    readFileSync(new URL("../src/features/labs/components/LabAssignModal.tsx", import.meta.url), "utf8"),
  ) && /disabled=\{isSubmitting\}/.test(
    readFileSync(new URL("../src/features/labs/components/LabAssignModal.tsx", import.meta.url), "utf8"),
  ) && /assignmentSubmitting/.test(page),
  "Assign must expose an explicit submitting state and prevent duplicate clicks while requests are running.",
);

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  assert.fail(`${failures.length} Labs contract check(s) failed`);
}

console.log("Admin Labs aggregate contract passed.");
