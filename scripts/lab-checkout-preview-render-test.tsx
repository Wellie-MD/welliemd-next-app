import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { LabPanel } from "../src/api/labs";
import { CheckoutPatientPreview } from "../src/features/treatments/programs/checkout-question/components/CheckoutPatientPreview";

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
      { panelId: "panel-1", displayOrder: 1, isRequired: true, isActive: true },
      { panelId: "panel-2", displayOrder: 2, isRequired: true, isActive: true },
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
    labRequirements={[{ panelId: "panel-1", displayOrder: 1, isRequired: true, isActive: true }]}
    labPanels={[panel({ cost_to_client: 0, cost_to_welliemd: 12, patient_price: 99 })]}
  />,
);

assert.match(zeroCostHtml, /\$0\.00/);

console.log("Lab checkout preview Cost to Client render contract passed.");
