const COMPLETED_PAYMENT_STATES = new Set([
  "authorized",
  "captured",
  "approved",
  "succeeded",
  "paid",
])

const normalizeState = (value) => String(value || "").trim().toLowerCase()

export const isCheckoutCompleted = (order = {}) => {
  const paymentStates = [
    order.paymentStatus,
    order.payment_settlement_state,
    order.combined_payment_summary?.status,
    order.combined_payment_summary?.allocation?.status,
    order.combined_submission_summary?.status,
    order.combined_submission_summary?.combined_payment?.status,
  ]

  return paymentStates.some((state) => (
    COMPLETED_PAYMENT_STATES.has(normalizeState(state))
  ))
}

export const canCopyCheckoutUrl = (order = {}) => (
  Boolean(order.checkout_url) && !isCheckoutCompleted(order)
)
