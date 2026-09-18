import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { LabPanel } from "../src/api/labs";
import { CheckoutPatientPreview } from "../src/features/treatments/programs/checkout-question/components/CheckoutPatientPreview";
import { ProgramLabRequirementPolicy } from "../src/features/treatments/programs/components/ProgramLabRequirementPolicy";

const panel = (overrides: Partial<LabPanel>): LabPanel => ({
  id: "panel-1",
  name: "Starter Panel",
  description: "",
  lab_provider: "Junction",
  biomarkers: [],
  fasting_required: "no",
  collection_method: "walk_in_test",
  cost_to_client: 0,
  cost_to_welliemd: 0,
  patient_price: 0,
  is_active: true,
  junction_status: "active",
  service_states: [],
  ...overrides,
});

const html = renderToStaticMarkup(
  <CheckoutPatientPreview
    validProducts={[]}
    selectedPreviewIdx={0}
    visibilityRuleGroup={undefined}
    onSelectedPreviewChange={() => undefined}
    mode="lab"
    labRequirements={[
      { requirementKind: "single", panelId: "panel-1", displayOrder: 1, isRequired: true, isActive: true },
      { requirementKind: "single", panelId: "panel-2", displayOrder: 2, isRequired: true, isActive: true },
    ]}
    labPanels={[
      panel({
        id: "panel-1",
        name: "Starter Panel",
        cost_to_client: 25.5,
        cost_to_welliemd: 7.25,
        patient_price: 1.5,
      }),
      panel({
        id: "panel-2",
        name: "Complete Panel",
        cost_to_client: 40,
        cost_to_welliemd: 15,
        patient_price: 2,
      }),
    ]}
  />,
);

assert.match(html, /Starter Panel/);
assert.match(html, /\$25\.50/);
assert.match(html, /Complete Panel/);
assert.match(html, /\$40\.00/);
assert.match(html, /\$65\.50/);
assert.doesNotMatch(html, /\$7\.25|\$15\.00|\$1\.50|\$2\.00/);

const zeroCostHtml = renderToStaticMarkup(
  <CheckoutPatientPreview
    validProducts={[]}
    selectedPreviewIdx={0}
    visibilityRuleGroup={undefined}
    onSelectedPreviewChange={() => undefined}
    mode="lab"
    labRequirements={[{ requirementKind: "single", panelId: "panel-1", displayOrder: 1, isRequired: true, isActive: true }]}
    labPanels={[panel({ cost_to_client: 0, cost_to_welliemd: 12, patient_price: 99 })]}
  />,
);

assert.match(zeroCostHtml, /\$0\.00/);

console.log("Lab checkout preview Cost to Client render contract passed.");

const policies = [
  [true, true, "Required · Holds treatment"],
  [true, false, "Required · Does not hold treatment"],
  [false, true, "Optional · Holds treatment if selected"],
  [false, false, "Optional · Does not hold treatment"],
] as const;

for (const [isRequired, isReleaseRequired, label] of policies) {
  const policyHtml = renderToStaticMarkup(
    <ProgramLabRequirementPolicy
      requirement={{
        requirementKind: "single",
        panelId: `panel-${label}`,
        displayOrder: 1,
        isRequired,
        isReleaseRequired,
        isActive: true,
      }}
      onChange={() => undefined}
    />,
  );
  assert.match(policyHtml, /Patient requirement/);
  assert.match(policyHtml, /Hold treatment until final Lab results/);
  assert.match(policyHtml, new RegExp(label.replace("·", "·")));
}

console.log("Program Lab requirement policy render contract passed.");
