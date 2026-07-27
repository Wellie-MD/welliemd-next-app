import React from "react"
import { Order } from "@/api/ordersApi"
import { TreatmentOrderAggregate } from "@/features/treatments/orders/components/TreatmentOrderAggregate"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

interface TreatmentRoutingSectionProps {
  order: Order
}

export const TreatmentRoutingSection: React.FC<TreatmentRoutingSectionProps> = ({ order }) => {
  const hasTreatmentRuntime = Boolean(
    order.treatment_case_summary || order.combined_submission_summary?.id,
  )

  if (!order.treatment_aggregate && !hasTreatmentRuntime) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* High level Treatment Order Aggregate component (Phase II) */}
      {order.treatment_aggregate && (
        <TreatmentOrderAggregate
          aggregate={order.treatment_aggregate}
          currentOrderId={order.id}
        />
      )}

      {/* Case Routing Summary Card */}
      {hasTreatmentRuntime && order.treatment_case_summary && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white pb-3 border-b border-border">
            <Activity className="h-4 w-4 text-primary" />
            <span>Clinical Treatment & Dispatch Routing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-muted-foreground text-xs block mb-1">Treatment Program</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">
                {order.treatment_case_summary.treatment_type_key?.replace(/_/g, " ") || "—"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-muted-foreground text-xs block mb-1">Clinical Dispatch</span>
              <Badge variant="outline" className="capitalize text-xs font-semibold">
                {order.treatment_case_summary.beluga_dispatch_status ||
                  order.beluga_dispatch_status ||
                  "pending"}
              </Badge>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-muted-foreground text-xs block mb-1">Reimbursement Total</span>
              <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                ${order.treatment_case_summary.reimbursement_total || "0.00"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-muted-foreground text-xs block mb-1">Payment Allocation</span>
              <span className="font-semibold capitalize text-slate-900 dark:text-white">
                {order.combined_payment_summary?.allocation?.status ||
                  order.combined_payment_summary?.status ||
                  "pending"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
