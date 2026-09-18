import assert from "node:assert/strict";
import {
  combinedPanelEditForm,
  type CombinedPanelEditForm,
} from "../src/features/treatments/programs/components/programLabRequirementCatalog.js";
import type { CombinedLabPanel } from "../src/features/labs/types.js";

const panel = {
  id: "combined-1",
  name: "Complete Wellness Panel",
  description: "Two collection choices",
  members: [
    { panel_id: "panel-home", collection_method: "at_home_phlebotomy" },
    { panel_id: "panel-walkin", collection_method: "walk_in_test" },
  ],
  cost_to_client: { amount: "42.75", currency: "USD" },
  cost_to_welliemd: { amount: "18.00", currency: "USD" },
  service_states: ["TX", "NY"],
  is_active: true,
} as CombinedLabPanel;

const editForm: CombinedPanelEditForm = combinedPanelEditForm(panel);
assert.deepEqual(editForm, {
  name: "Complete Wellness Panel",
  description: "Two collection choices",
  cost_to_client: "42.75",
  cost_to_welliemd: "18.00",
  service_states: ["TX", "NY"],
  is_active: true,
});

console.log("Combined panel edit mapping passed.");
