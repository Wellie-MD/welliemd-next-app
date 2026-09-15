import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildLabPanelUpdates } from "../src/features/labs/editUpdates.ts";

const api = readFileSync(new URL("../src/features/labs/api.ts", import.meta.url), "utf8");
const dialog = readFileSync(new URL("../src/features/labs/components/LabEditDialog.tsx", import.meta.url), "utf8");
const editUpdates = readFileSync(new URL("../src/features/labs/editUpdates.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/features/labs/pages/Labs.tsx", import.meta.url), "utf8");

assert.match(api, /combined_methods/);
assert.match(api, /cost_to_client:\s*moneyToNumber\(method\.cost_to_client\)/);
assert.doesNotMatch(api, /cost_to_welliemd/);
assert.match(page, /lab\.is_combined/);
assert.match(dialog, /Collection method options/);
assert.match(dialog, /member\.cost_to_client/);
assert.match(dialog, /member\.is_orderable/);
assert.match(api, /shipping_fee:\s*moneyToNumber\(raw\.shipping_fee\)/);
assert.match(api, /body\.shipping_fee/);
assert.match(dialog, /const \[shippingFee, setShippingFee\]/);
assert.match(editUpdates, /!initial\.is_combined/);
assert.match(dialog, /setShippingFee/);
assert.match(dialog, /Shipping\/collection fee/);
assert.match(dialog, /One patient price applies across every collection method/);
assert.match(dialog, /Set a patient base price before offering this Combined Lab/);
assert.match(dialog, /text-rose-700/);
assert.match(dialog, /Cost by collection method/);
assert.match(dialog, /combinedMembers\.map/);
assert.match(dialog, /Break-even patient charge/);
assert.match(dialog, /To avoid a loss with every method/);
assert.match(dialog, /Amount after lab cost/);
assert.doesNotMatch(dialog, /WellieMD cost/);

const unchanged = buildLabPanelUpdates({
  patientPrice: "89.00",
  discountedPatientPrice: "",
  shippingFee: "10.00",
  isActive: true,
  serviceStates: ["TX", "NY"],
}, {
  is_combined: true,
  patient_price: 89,
  discounted_patient_price: null,
  shipping_fee: 10,
  is_active: true,
  service_states: ["NY", "TX"],
});
assert.deepEqual(unchanged, {}, "an image-only save must not resubmit unrelated lab settings");

const changed = buildLabPanelUpdates({
  patientPrice: "99.00",
  discountedPatientPrice: "",
  shippingFee: "12.00",
  isActive: false,
  serviceStates: ["CA"],
}, {
  is_combined: true,
  patient_price: 89,
  discounted_patient_price: null,
  shipping_fee: 10,
  is_active: true,
  service_states: ["TX"],
});
assert.deepEqual(changed, {
  patient_price: 99,
  shipping_fee: 12,
  is_active: false,
  service_states: ["CA"],
});

console.log("Client Labs logical Combined offering contract passed.");
