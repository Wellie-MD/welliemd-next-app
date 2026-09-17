import { strict as assert } from "node:assert";
import { formatLabPaymentProvider } from "../src/features/labs/utils/formatting.ts";

const test = (name, run) => {
  run();
  console.log(`PASS ${name}`);
};

test("zero-total lab orders do not expose their internal synthetic processor", () => {
  assert.equal(formatLabPaymentProvider("zero_total"), "No payment required");
});

test("gateway processor names remain readable to staff", () => {
  assert.equal(formatLabPaymentProvider("stripe"), "Stripe");
  assert.equal(formatLabPaymentProvider("acme_pay"), "Acme pay");
});

test("missing processor data retains the unavailable placeholder", () => {
  assert.equal(formatLabPaymentProvider(), "—");
});

console.log("\nAll lab payment-provider display tests passed.");
