import React from "react"
import { AdminOrderDetail } from "@/api/dashboardApi"
import { DollarSign, AlertCircle } from "lucide-react"
import { parseStatusLabel, getPrototypePillClass } from "./drawerUtils"

interface DrawerReimbursementSectionProps {
  order: AdminOrderDetail
}

const parseMoney = (val?: string | number | null): number | null => {
  if (val === null || val === undefined || val === "") return null
  const parsed = Number.parseFloat(String(val))
  return Number.isFinite(parsed) ? parsed : null
}

const formatMoney = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "0.00"
  return value.toFixed(2)
}

export const DrawerReimbursementSection: React.FC<DrawerReimbursementSectionProps> = ({ order }) => {
  const settlement = order.treatment_aggregate?.settlement
  const rawStatus = settlement?.status || (settlement?.settled_at ? "settled" : "pending")

  const settlementLabel = parseStatusLabel(rawStatus === "settled" ? "Settlement Complete" : "Reconciliation Pending")
  const settlementPillClass = getPrototypePillClass(rawStatus === "settled" ? "settled" : "pending")

  // Real per-order reimbursement breakdown, same fields the client portal uses —
  // no fields means no reimbursement data yet, not zero cost.
  const medCost = parseMoney(order.medication_cost_to_client)
  const consultCost = parseMoney(order.consult_cost_to_client)
  const shippingCost = parseMoney(order.shipping_fee_to_client)
  const consultType = order.consult_type
  const billingPendingReason = order.billing_pending_reason

  const hasReimbursementData =
    medCost != null || consultCost != null || shippingCost != null || billingPendingReason != null

  const totalClientCost = (medCost ?? 0) + (consultCost ?? 0) + (shippingCost ?? 0)

  return (
    <div className="space-y-3">
      {/* Prototype Section Label */}
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center justify-between border-b border-border/40 pb-1">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-primary" />
          <span>B2B Client Reimbursement</span>
        </div>
        <span className={settlementPillClass}>
          {settlementLabel}
        </span>
      </div>

      {!hasReimbursementData ? (
        <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-xs text-muted-foreground italic">
            No reimbursement breakdown available for this order yet.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-3.5 space-y-2.5 text-xs">
          {billingPendingReason && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Billing Pending:</span>
                {billingPendingReason}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Medication Wholesale Cost:</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                ${formatMoney(medCost)}
              </span>
            </div>

            <div className="flex justify-between items-center text-muted-foreground">
              <span>
                Clinical Consult Fee{consultType ? ` (${consultType})` : ""}:
              </span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                ${formatMoney(consultCost)}
              </span>
            </div>

            <div className="flex justify-between items-center text-muted-foreground">
              <span>Pharmacy Shipping Fee:</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                ${formatMoney(shippingCost)}
              </span>
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-center font-bold text-slate-900 dark:text-white text-xs">
              <span>Total B2B Client Charge</span>
              <span className="font-mono tabular-nums text-sm text-primary">
                ${formatMoney(totalClientCost)}
              </span>
            </div>
          </div>

          {/* Client & Contract Info */}
          <div className="p-2 rounded-lg bg-muted/40 border border-border/80 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">B2B Organization:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{order.client_name}</span>
          </div>
        </div>
      )}
    </div>
  )
}
