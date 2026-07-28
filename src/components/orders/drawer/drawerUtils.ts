import React from "react"

export function parseStatusLabel(rawStatus?: string | null): string {
  if (!rawStatus) return "—"
  const clean = rawStatus.trim().toLowerCase()

  if (clean === "created") return "Order Created"
  if (clean === "payment_pending" || clean === "pending_payment") return "Payment Pending"
  if (clean === "processing" || clean === "in_process") return "In Process"
  if (clean === "visit_failed") return "Visit Failed"
  if (clean === "visit_pending") return "Visit Pending"
  if (clean === "consult_scheduled") return "Consult Scheduled"
  if (clean === "consult_rescheduled") return "Consult Rescheduled"
  if (clean === "consult_canceled") return "Consult Canceled"
  if (clean === "no_show") return "No Show"
  if (clean === "referred") return "Referred"
  if (clean === "prescribed") return "Prescribed (Final)"
  if (clean === "billing_pending") return "Billing Pending"
  if (clean === "rx_sent") return "Rx Sent"
  if (clean === "shipped") return "Shipped"
  if (clean === "in_transit") return "In Transit"
  if (clean === "out_for_delivery") return "Out for Delivery"
  if (clean === "delivered") return "Delivered"
  if (clean === "delivery_failed") return "Delivery Failed"
  if (clean === "canceled" || clean === "cancelled") return "Canceled"
  if (clean === "paid" || clean === "captured") return "Captured & Paid"
  if (clean === "authorized" || clean === "auth_hold") return "Authorized (Hold)"
  if (clean === "refunded") return "Refunded"
  if (clean === "recovery_pending") return "Recovery Pending"
  if (clean === "prescribed_medicine") return "Prescribed (Final)"
  if (clean === "requested_medicine") return "Requested (Original)"
  if (clean === "requested_medicine_fallback") return "Requested Fallback"

  // Convert snake_case or camelCase to Title Case
  return rawStatus
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

export function getPrototypePillClass(rawStatus?: string | null): string {
  if (!rawStatus) return "pill pill-neutral"
  const t = rawStatus.trim().toLowerCase()

  if (/cancel|fail|declin|void/.test(t)) return "pill pill-red"
  if (/partial/.test(t)) return "pill pill-amber"
  if (/paid|shipped|delivered|completed|results ready|prescribed/.test(t)) return "pill pill-green"
  if (/authorized|auth|beluga|rx sent|rx_sent|at lab|in process|processing|requisition|appointment|sample collected|received|collecting|with lab/.test(t))
    return "pill pill-blue"
  if (/pending|awaiting|recovery|draft/.test(t)) return "pill pill-amber"

  return "pill pill-blue"
}
