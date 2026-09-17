import assert from "node:assert/strict";
import {
  formatCollectionMethod,
  isSelectableTarget,
  requirementForTarget,
  requirementTargetKey,
  targetCostToClient,
  targetKey,
  targetMethods,
  targetName,
  type ProgramLabTarget,
} from "../src/features/treatments/programs/components/programLabRequirementCatalog.js";

const single = {
  kind: "single",
  panel: {
    id: "panel-1",
    name: "Metabolic Panel",
    collection_method: "at_home",
    cost_to_client: 18.5,
    is_active: true,
    is_assignable: true,
  },
} as ProgramLabTarget;

const combined = {
  kind: "combined",
  panel: {
    id: "combined-1",
    name: "Complete Wellness Panel",
    cost_to_client: { amount: "42.75", currency: "USD" },
    is_active: true,
    is_archived: false,
    is_assignable: true,
    members: [
      { collection_method: "lab_visit", display_order: 2 },
      { collection_method: "at_home", display_order: 1 },
    ],
  },
} as ProgramLabTarget;

assert.equal(formatCollectionMethod("lab_visit"), "Lab Visit");
assert.equal(targetKey(single), "single:panel-1");
assert.equal(targetKey(combined), "combined:combined-1");
assert.equal(targetName(combined), "Complete Wellness Panel");
assert.deepEqual(targetMethods(combined), ["At Home", "Lab Visit"]);
assert.equal(targetCostToClient(single), 18.5);
assert.equal(targetCostToClient(combined), 42.75);
assert.equal(isSelectableTarget(single), true);
assert.equal(isSelectableTarget(combined), true);

const combinedRequirement = requirementForTarget(combined, 3);
assert.deepEqual(combinedRequirement, {
  requirementKind: "combined",
  panelId: undefined,
  panelName: undefined,
  combinedPanelId: "combined-1",
  combinedPanelName: "Complete Wellness Panel",
  displayOrder: 3,
  isRequired: true,
  isActive: true,
  instructions: "",
});
assert.equal(requirementTargetKey(combinedRequirement), "combined:combined-1");

const oneMemberCombined = {
  ...combined,
  panel: { ...combined.panel, members: combined.panel.members.slice(0, 1) },
} as ProgramLabTarget;
assert.equal(isSelectableTarget(oneMemberCombined), false);
assert.equal(
  isSelectableTarget({ ...combined, panel: { ...combined.panel, is_archived: true } } as ProgramLabTarget),
  false,
);

console.log("Combined Program lab authoring behavior passed.");
