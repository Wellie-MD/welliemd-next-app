import React from "react"
import { AdminOrder } from "@/api/dashboardApi"
import { MessageSquareText, ShieldAlert, User, Clock, Calendar, FileText, Truck } from "lucide-react"
import { parseStatusLabel, getPrototypePillClass } from "./drawerUtils"

interface DrawerSupportTimelineSectionProps {
  order: AdminOrder
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export const DrawerSupportTimelineSection: React.FC<DrawerSupportTimelineSectionProps> = ({ order }) => {
  const support = order.treatment_aggregate?.support
  const notes = (order as any).notes

  const hasSupportData =
    Boolean(notes) ||
    Boolean(support?.owner) ||
    Boolean(support?.pending_reason) ||
    Boolean(support?.last_error_code) ||
    Boolean(support?.last_error_detail)

  const milestones = React.useMemo(() => {
    const list: Array<{ title: string; date: string; icon: string }> = []

    if (order.shipped_at) {
      list.push({ title: "Rx Shipped to Patient", date: formatDate(order.shipped_at), icon: "truck" })
    }
    if (order.prescribed_at) {
      list.push({ title: "Medication Prescribed", date: formatDate(order.prescribed_at), icon: "rx" })
    }
    if (order.created_at) {
      list.push({ title: "Order Placed", date: formatDate(order.created_at), icon: "created" })
    }
    return list
  }, [order])

  return (
    <div className="space-y-4">
      {/* Support & Audit Flags */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono border-b border-border/40 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MessageSquareText className="h-3.5 w-3.5 text-primary" />
            <span>Support Notes & Audit Flags</span>
          </div>
          {support?.retry_allowed !== undefined && (
            <span className={getPrototypePillClass(support.retry_allowed ? "prescribed" : "canceled")}>
              {support.retry_allowed ? "Support Retry Allowed" : "Support Lock Active"}
            </span>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 text-xs space-y-2.5">
          {!hasSupportData ? (
            <p className="text-muted-foreground text-xs italic">No support audit flags or notes recorded.</p>
          ) : (
            <>
              {(support?.owner || support?.pending_reason) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {support?.owner && (
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/80 space-y-0.5">
                      <span className="text-muted-foreground text-[10px] uppercase font-mono block">Support Owner</span>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                        <User className="h-3 w-3 text-primary" />
                        <span>{support.owner}</span>
                      </div>
                    </div>
                  )}
                  {support?.pending_reason && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 space-y-0.5">
                      <span className="text-amber-800 text-[10px] uppercase font-mono font-medium block">
                        Pending Reason
                      </span>
                      <p className="font-semibold text-amber-900 text-xs">
                        {parseStatusLabel(support.pending_reason)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(support?.last_error_code || support?.last_error_detail) && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 space-y-1 text-rose-900">
                  <div className="flex items-center gap-1 font-semibold text-xs">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    <span>Support Error {support.last_error_code ? `[${support.last_error_code}]` : ""}</span>
                  </div>
                  {support.last_error_detail && (
                    <p className="text-[11px] font-mono break-all leading-relaxed">
                      {support.last_error_detail}
                    </p>
                  )}
                </div>
              )}

              {notes && (
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono block">
                    Support Notes
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-line">
                    {notes}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono border-b border-border/40 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Timeline</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {milestones.length} Events
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 space-y-2">
          {milestones.map((m, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-b-0">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground min-w-[110px] font-medium">{m.title}</span>
              </div>
              <span className="font-mono text-slate-900 dark:text-white font-semibold text-[11px]">{m.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
