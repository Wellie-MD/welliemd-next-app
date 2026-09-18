import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = [
  "src/features/treatments/flow-builder/components/CustomProgramFlowBuilder.tsx",
  "src/features/treatments/flow-builder/components/canvas/FlowBuilderListView.tsx",
  "src/features/treatments/flow-builder/components/canvas/FlowCanvasChip.tsx",
];

for (const file of files) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  assert.equal(
    /onEditConsent|ConsentPlacementRuleDialog/.test(source),
    false,
    `${file} must not expose placement-level consent visibility editing`,
  );
}

console.log("PASS Custom Programs do not expose consent visibility actions");
