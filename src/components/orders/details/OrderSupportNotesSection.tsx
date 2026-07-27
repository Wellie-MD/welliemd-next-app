import React from "react"
import { Order } from "@/api/ordersApi"
import { Badge } from "@/components/ui/badge"
import { MessageSquareText, ShieldAlert, User, FileText } from "lucide-react"

interface OrderSupportNotesSectionProps {
  order: Order
}

export const OrderSupportNotesSection: React.FC<OrderSupportNotesSectionProps> = ({ order }) => {
  const support = order.treatment_aggregate?.support
  const notes = order.notes
  const billingPendingReason = order.billing_pending_reason

  const hasSupportData =
    Boolean(notes) ||
    Boolean(billingPendingReason) ||
    Boolean(support?.owner) ||
    Boolean(support?.pending_reason) ||
    Boolean(support?.last_error_code) ||
    Boolean(support?.last_error_detail)

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <MessageSquareText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>Support Notes & Audit Logs</span>
        </div>

        {support?.retry_allowed !== undefined ? (
          <Badge
            variant="outline"
            className={
              support.retry_allowed
                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
            }
          >
            {support.retry_allowed ? "Support Retry Allowed" : "Support Lock Active"}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
            {hasSupportData ? "Notes Present" : "No Notes"}
          </Badge>
        )}
      </div>

      <div className="p-6 text-xs sm:text-sm">
        {!hasSupportData ? (
          <div className="p-4 rounded-xl bg-muted/20 border border-border flex items-center gap-3 text-muted-foreground">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>No support notes or active case audit flags recorded for this order.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Support Case Owner & Pending Reason */}
            {(support?.owner || support?.pending_reason || billingPendingReason) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {support?.owner && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="text-muted-foreground text-xs block">Assigned Support Owner</span>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      <span>{support.owner}</span>
                    </div>
                  </div>
                )}

                {(support?.pending_reason || billingPendingReason) && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <span className="text-amber-800 dark:text-amber-300 text-xs font-medium block">
                      Support Pending Reason
                    </span>
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      {support?.pending_reason || billingPendingReason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Support Error Code & Technical Details */}
            {(support?.last_error_code || support?.last_error_detail) && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1 text-rose-900 dark:text-rose-200">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <span>
                    Support Error {support.last_error_code ? `[${support.last_error_code}]` : ""}
                  </span>
                </div>
                {support.last_error_detail && (
                  <p className="text-xs text-rose-800 dark:text-rose-300 font-mono pt-1 leading-relaxed">
                    {support.last_error_detail}
                  </p>
                )}
              </div>
            )}

            {/* Support Notes */}
            {notes && (
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Support Notes
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-mono">
                  {notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
