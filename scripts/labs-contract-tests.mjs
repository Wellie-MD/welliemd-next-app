import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../src/features/labs/api.ts", import.meta.url), "utf8");
const dialog = readFileSync(new URL("../src/features/labs/components/LabEditDialog.tsx", import.meta.url), "utf8");
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
assert.match(dialog, /editingLab\.is_combined\s*\?\s*undefined/);
assert.match(dialog, /setShippingFee/);
assert.match(dialog, /Shipping\/collection fee/);
assert.match(dialog, /One patient price applies across every collection method/);
assert.match(dialog, /Set a patient base price before offering this Combined Lab/);
assert.match(dialog, /Estimated margin per order/);
assert.match(dialog, /text-rose-700/);

console.log("Client Labs logical Combined offering contract passed.");
