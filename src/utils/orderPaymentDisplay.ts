import type { Order } from "@/api/ordersApi"

type OrderPaymentDisplayInput = Pick<
  Order,
  | "paymentProcessor"
  | "combined_payment_summary"
  | "product_payment_reservations"
  | "payment_settlement_transactions"
>

const firstRecordedProcessor = (values: Array<string | null | undefined>): string | null => {
  const processor = values.find((value) => typeof value === "string" && value.trim())
  return processor?.trim() || null
}

export const getOrderPaymentProcessor = (order: OrderPaymentDisplayInput): string | null => {
  const reservationProcessors = (order.product_payment_reservations || []).map(
    (reservation) => reservation.processor,
  )
  const settlementProcessors = (order.payment_settlement_transactions || []).map(
    (transaction) => transaction.processor,
  )

  return firstRecordedProcessor([
    order.combined_payment_summary?.gateway,
    order.paymentProcessor,
    ...reservationProcessors,
    ...settlementProcessors,
  ])
}

export const formatOrderProcessor = (order: OrderPaymentDisplayInput): string => {
  const value = getOrderPaymentProcessor(order)
  if (!value) return "Not recorded"

  const lower = value.toLowerCase()
  if (lower.includes("stripe")) return "Stripe"
  if (lower.includes("authorize")) return "Authorize.Net"
  if (lower.includes("nmi")) return "NMI"
  return value.charAt(0).toUpperCase() + value.slice(1)
}
