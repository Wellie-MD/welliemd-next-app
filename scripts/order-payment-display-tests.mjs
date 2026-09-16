import { strict as assert } from "node:assert"
import { formatOrderProcessor } from "../src/utils/orderPaymentDisplay.ts"

const test = (name, run) => {
  run()
  console.log(`PASS ${name}`)
}

test("preserves the top-level payment processor when present", () => {
  assert.equal(
    formatOrderProcessor({
      paymentProcessor: "stripe",
      product_payment_reservations: [{ processor: "nmi" }],
    }),
    "Stripe",
  )
})

test("prefers the configured combined gateway over an internal system processor", () => {
  assert.equal(
    formatOrderProcessor({
      paymentProcessor: "system",
      combined_payment_summary: { gateway: "stripe" },
      product_payment_reservations: [{ processor: "system" }],
    }),
    "Stripe",
  )
})

test("uses the configured combined gateway when the reservation processor is blank", () => {
  assert.equal(
    formatOrderProcessor({
      combined_payment_summary: { gateway: "nmi" },
      product_payment_reservations: [{ processor: "" }],
    }),
    "NMI",
  )
})

test("falls back to a recorded product reservation processor", () => {
  assert.equal(
    formatOrderProcessor({
      product_payment_reservations: [{ processor: "authorizenet" }],
    }),
    "Authorize.Net",
  )
})

test("falls back to a recorded settlement transaction processor", () => {
  assert.equal(
    formatOrderProcessor({
      payment_settlement_transactions: [{ processor: "nmi" }],
    }),
    "NMI",
  )
})

test("retains the unavailable label when no processor is recorded", () => {
  assert.equal(formatOrderProcessor({}), "Not recorded")
})

console.log("\nAll order payment display tests passed.")
