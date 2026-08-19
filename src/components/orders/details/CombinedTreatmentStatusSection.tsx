import { Activity, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"

import type { CombinedSubmissionSummary } from "@/api/ordersApi"
import { Badge } from "@/components/ui/badge"
import { CLIENT_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes"
import { cn } from "@/lib/utils"

interface CombinedTreatmentStatusSectionProps {
  currentOrderId: string
  summary: CombinedSubmissionSummary
}

const humanizeStatus = (value?: string | null) => {
  const normalized = String(value || "").trim()
  if (!normalized) return "Not recorded"
  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

const statusClassName = (value?: string | null) => {
  const status = String(value || "").toLowerCase()
  if (/failed|error|declined|cancelled|canceled|manual.action/.test(status)) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
  }
  if (/paid|captured|settled|completed|prescribed|sent|authorized/.test(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
  }
  if (/pending|queued|waiting|ready|review/.test(status)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
  }
  return "border-border bg-muted/40 text-muted-foreground"
}

function StatusValue({ value }: { value?: string | null }) {
  return (
    <Badge
      variant="outline"
      className={cn("w-fit text-[11px] font-semibold", statusClassName(value))}
    >
      {humanizeStatus(value)}
    </Badge>
  )
}

function StatusField({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <StatusValue value={value} />
    </div>
  )
}

export function CombinedTreatmentStatusSection({
  currentOrderId,
  summary,
}: CombinedTreatmentStatusSectionProps) {
  const treatments = summary.orders || []
  if (!treatments.length) return null

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Treatment status verification
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Independent states for each treatment in this combined checkout.
            </p>
          </div>
        </div>
        <StatusValue value={summary.status} />
      </div>

      <div className="space-y-4 p-5">
        {treatments.map((treatment) => {
          const isCurrent = String(treatment.order_id) === String(currentOrderId)
          return (
            <article
              key={treatment.treatment_case_id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {treatment.treatment_type_name ||
                        humanizeStatus(treatment.treatment_type_key) ||
                        "Treatment"}
                    </h4>
                    {isCurrent && <Badge variant="secondary">Current order</Badge>}
                  </div>
                  <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                    Case {treatment.treatment_case_id}
                  </div>
                </div>
                {!isCurrent && (
                  <Link
                    to={CLIENT_TREATMENT_ROUTES.orderDetails(treatment.order_id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Open order <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Order
                  </div>
                  <div className="truncate text-xs font-semibold text-foreground">
                    {treatment.order_display_id || treatment.order_id}
                  </div>
                  <div className="mt-2"><StatusValue value={treatment.status} /></div>
                </div>
                <div className="min-w-0 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Visit
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {treatment.visit_id || "Not recorded"}
                  </div>
                  <div className="mt-2"><StatusValue value={treatment.visit_status} /></div>
                </div>
                <StatusField
                  label="Patient payment"
                  value={treatment.payment_allocation?.status}
                />
                <StatusField
                  label="B2B reimbursement"
                  value={treatment.b2b_reimbursement_status}
                />
                <StatusField
                  label="Provider dispatch"
                  value={treatment.beluga_dispatch_status}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
