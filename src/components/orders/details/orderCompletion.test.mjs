import assert from "assert"
import { canCopyCheckoutUrl, isCheckoutCompleted } from "./orderCompletion.js"

assert.equal(
  isCheckoutCompleted({
    status: "created",
    combined_submission_summary: { status: "paid" },
    combined_payment_summary: { status: "authorized" },
  }),
  true,
)

assert.equal(
  isCheckoutCompleted({
    status: "created",
    combined_submission_summary: { status: "checkout_pending" },
    combined_payment_summary: { status: "pending" },
  }),
  false,
)

assert.equal(
  canCopyCheckoutUrl({ checkout_url: "https://example.test/checkout/token" }),
  true,
)

assert.equal(
  canCopyCheckoutUrl({
    checkout_url: "https://example.test/checkout/token",
    paymentStatus: "authorized",
  }),
  false,
)

assert.equal(canCopyCheckoutUrl({}), false)

console.log("orderCompletion tests passed")
