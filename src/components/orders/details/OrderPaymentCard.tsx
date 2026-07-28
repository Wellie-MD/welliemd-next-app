import React from "react"
import { Order } from "@/api/ordersApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CreditCard, Undo2, RotateCw, AlertCircle } from "lucide-react"

interface OrderPaymentCardProps {
  order: Order
  canRefundOrVoid: boolean
  canRetryPayment: boolean
  isAuthorized: boolean
  isRefundable: boolean
  onRefundClick: () => void
  onRetryClick: () => void
}

const formatProcessorName = (val?: string | null): string => {
  if (!val) return "Authorize.Net"
  const lower = val.toLowerCase()
  if (lower.includes("stripe")) return "Stripe"
  if (lower.includes("authorize")) return "Authorize.Net"
  if (lower.includes("nmi")) return "NMI"
  return val.charAt(0).toUpperCase() + val.slice(1)
}

const formatPaymentStatusLabel = (val?: string | null): string => {
  if (!val) return "Captured & Paid"
  const lower = val.toLowerCase()
  if (lower === "captured" || lower === "paid" || lower === "completed" || lower === "succeeded") return "Captured & Paid"
  if (lower === "authorized" || lower === "auth_hold") return "Authorized (Hold)"
  if (lower === "pending" || lower === "payment_pending") return "Payment Pending"
  if (lower === "refunded") return "Refunded"
  if (lower === "voided" || lower === "canceled") return "Voided / Canceled"
  return val.charAt(0).toUpperCase() + val.slice(1).replace(/_/g, " ")
}

const parseTransactionId = (order: Order): string => {
  return (
    order.paymentProcessorTransactionId ||
    order.paymentTransactionId ||
    order.paymentReference ||
    order.charge_id ||
    order.transaction_id ||
    order.combined_payment_summary?.transaction_id ||
    order.episode_id ||
    (order.id ? `TXN-${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-12).toUpperCase()}` : "TX-PRIMARY")
  )
}

export const OrderPaymentCard: React.FC<OrderPaymentCardProps> = ({
  order,
  canRefundOrVoid,
  canRetryPayment,
  isAuthorized,
  isRefundable,
  onRefundClick,
  onRetryClick,
}) => {
  const processor = formatProcessorName(order.paymentProcessor || order.payment_method_summary?.processor)
  const paymentStatusFormatted = formatPaymentStatusLabel(order.paymentStatus || order.status)
  const settlementState = (order.payment_settlement_state || "").toLowerCase()
  const transId = parseTransactionId(order)

  const settlement = order.treatment_aggregate?.settlement
  const recoveryRequired = order.treatment_aggregate?.lifecycle?.support_recovery_required

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Payment Method & Status</span>
          </div>

          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
            {paymentStatusFormatted}
          </Badge>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between items-start text-muted-foreground gap-2">
            <span className="flex-shrink-0">Processor Gateway</span>
            <span className="font-semibold text-slate-900 dark:text-white text-right break-words">{processor}</span>
          </div>

          <div className="flex justify-between items-start text-muted-foreground gap-2">
            <span className="flex-shrink-0">Settlement State</span>
            <span className="font-semibold text-slate-900 dark:text-white capitalize text-right break-words">
              {settlementState || "Settled"}
            </span>
          </div>

          <div className="flex justify-between items-start text-muted-foreground gap-2">
            <span className="flex-shrink-0">Transaction Reference</span>
            <span className="font-mono text-xs text-slate-800 dark:text-slate-200 text-right break-all font-semibold">
              {transId}
            </span>
          </div>

          {/* Patient Charge Attempts Audit */}
          {settlement && (settlement.patient_attempts ?? 0) > 0 && (
            <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/40">
              <span>Charge Attempts</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {settlement.patient_attempts} Attempt{settlement.patient_attempts! > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Support Recovery Warning Banner */}
        {recoveryRequired && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Payment Recovery Required</span>
              <span>Case requires staff support intervention before settlement completion.</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="p-6 bg-muted/20 space-y-2.5">
        {canRefundOrVoid && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefundClick}
            className="w-full h-9 text-xs font-medium gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
          >
            <Undo2 className="h-4 w-4" />
            <span>{isAuthorized ? "Void Authorization" : "Process Refund"}</span>
          </Button>
        )}

        {canRetryPayment && (
          <Button
            variant="default"
            size="sm"
            onClick={onRetryClick}
            className="w-full h-9 text-xs font-medium gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            <RotateCw className="h-4 w-4" />
            <span>Retry Payment Charge</span>
          </Button>
        )}
      </div>
    </div>
  )
}
