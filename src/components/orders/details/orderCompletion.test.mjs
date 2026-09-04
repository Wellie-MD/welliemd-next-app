import assert from "assert"
import { isCheckoutCompleted } from "./orderCompletion.js"

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

console.log("orderCompletion tests passed")
