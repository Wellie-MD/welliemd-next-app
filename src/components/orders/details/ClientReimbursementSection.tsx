import React from "react"
import { Order } from "@/api/ordersApi"
import { Badge } from "@/components/ui/badge"
import { Building2, AlertCircle } from "lucide-react"

interface ClientReimbursementSectionProps {
  order: Order
  selectedProductId: string | null
}

const parseMoney = (value?: string | number | null): number | null => {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

const formatMoney = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "0.00"
  return value.toFixed(2)
}

export const ClientReimbursementSection: React.FC<ClientReimbursementSectionProps> = ({
  order,
  selectedProductId,
}) => {
  const medCost = parseMoney(order.medication_cost_to_client)
  const consultCost = parseMoney(order.consult_cost_to_client)
  const shippingCost = parseMoney(order.shipping_fee_to_client)

  const hasReimbursementData =
    medCost != null ||
    consultCost != null ||
    shippingCost != null ||
    order.consult_type != null ||
    order.billing_pending_reason != null

  if (!hasReimbursementData) {
    return null
  }

  const totalClientCost = (medCost ?? 0) + (consultCost ?? 0) + (shippingCost ?? 0)

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Building2 className="h-4 w-4 text-primary" />
          <span>B2B Client Reimbursement & Settlement</span>
        </div>
        {order.billing_pending_reason && (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 text-xs">
            Billing Pending
          </Badge>
        )}
      </div>

      <div className="p-6 space-y-4">
        {order.billing_pending_reason && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Pending Reason:</span>
              {order.billing_pending_reason}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-muted-foreground text-xs block mb-1">Medication Cost</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
              ${formatMoney(medCost)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-muted-foreground text-xs block mb-1">Consult Fee</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
              ${formatMoney(consultCost)}
            </span>
            {order.consult_type && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mt-0.5">
                ({order.consult_type})
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-muted-foreground text-xs block mb-1">Shipping Cost</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
              ${formatMoney(shippingCost)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-primary text-xs block mb-1 font-medium">
              Total Client Cost
            </span>
            <span className="font-bold tabular-nums text-primary text-base">
              ${formatMoney(totalClientCost)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
