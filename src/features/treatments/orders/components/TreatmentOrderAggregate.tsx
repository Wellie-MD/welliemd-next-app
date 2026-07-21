import { AlertTriangle, CheckCircle2, Clock3, FlaskConical, Stethoscope } from "lucide-react"
import { Link } from "react-router-dom"

import type {
  TreatmentAggregateProduct,
  TreatmentOrderAggregate as TreatmentOrderAggregateContract,
} from "@/api/ordersApi"
import { cn } from "@/lib/utils"
import { CLIENT_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes"

import {
  SETTLEMENT_STATUS_LABELS,
  LAB_GATE_STATUS_LABELS,
  PROVIDER_REVIEW_STATUS_LABELS,
  RECOLLECTION_ACTION_LABELS,
  SUPPORT_OWNER_LABELS,
  SUPPORT_PENDING_REASON_LABELS,
  TREATMENT_CLINICAL_STATUS_LABELS,
  TREATMENT_CLINICAL_STATUS_STYLES,
} from "../constants"

interface TreatmentOrderAggregateProps {
  aggregate: TreatmentOrderAggregateContract
  currentOrderId?: string
  compact?: boolean
}

const productKey = (product: TreatmentAggregateProduct, index: number) =>
  String(product.product_id || product.source_product_id || product.med_id || index)

const productName = (product: TreatmentAggregateProduct) =>
  product.name || product.med_id || `Product ${product.product_id || ""}`.trim()

function ProductSet({
  label,
  products,
  emptyLabel,
}: {
  label: string
  products: TreatmentAggregateProduct[]
  emptyLabel: string
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-[hsl(var(--text-tertiary))]">
        {label}
      </div>
      {products.length ? (
        <div className="space-y-2">
          {products.map((product, index) => (
            <div
              key={productKey(product, index)}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="break-words text-[13px] font-semibold text-foreground">
                  {productName(product)}
                </div>
                {(product.med_id || product.source_product_id) && (
                  <div className="mt-0.5 break-all font-mono text-[10.5px] text-muted-foreground">
                    {product.med_id || `Catalog ${product.source_product_id}`}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                Qty {product.quantity || 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </div>
  )
}

export function TreatmentOrderAggregate({
  aggregate,
  currentOrderId,
  compact = false,
}: TreatmentOrderAggregateProps) {
  const clinicalLabel =
    TREATMENT_CLINICAL_STATUS_LABELS[aggregate.clinical_status] ||
    aggregate.clinical_status.replaceAll("_", " ")
  const clinicalStyle =
    TREATMENT_CLINICAL_STATUS_STYLES[aggregate.clinical_status] ||
    TREATMENT_CLINICAL_STATUS_STYLES.awaiting_prescription
  const isReview = ["clinical_review", "clinical_review_required"].includes(aggregate.clinical_status)
  const isSettled = aggregate.clinical_status === "prescription_settled"
  const ClinicalIcon = isReview ? AlertTriangle : isSettled ? CheckCircle2 : Clock3
  const differences = aggregate.reconciliation.factual_differences || {}
  const additions = new Set(
    (differences.prescribed_addition_product_ids || []).map(String),
  )

  return (
    <section className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 shrink-0 text-primary" />
            <h3 className="truncate text-sm font-semibold text-foreground">
              {aggregate.treatment_type.name ||
                aggregate.treatment_type.key ||
                "Treatment order"}
            </h3>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Prescription set version {aggregate.reconciliation.version || "—"}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
            clinicalStyle,
          )}
        >
          <ClinicalIcon className="h-3.5 w-3.5" />
          {clinicalLabel}
        </span>
      </div>

      {isReview && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
          This prescription needs clinical or support review. The patient is not
          required to accept or reject a medication change.
          {aggregate.settlement.last_error_code && (
            <span className="ml-1 font-mono text-[10.5px]">
              ({aggregate.settlement.last_error_code})
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "grid gap-4 p-4",
          compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
        )}
      >
        <ProductSet
          label="Requested products"
          products={aggregate.reconciliation.requested_set || []}
          emptyLabel="No requested Product snapshot is available."
        />
        <ProductSet
          label="Current prescribed products"
          products={aggregate.reconciliation.prescribed_set || []}
          emptyLabel="Awaiting the provider's prescription."
        />
      </div>

      {(additions.size > 0 ||
        (differences.absence_is_authoritative &&
          (differences.requested_absence_product_ids || []).length > 0)) && (
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Factual differences:</span>{" "}
          {additions.size > 0 && `${additions.size} prescribed addition${additions.size === 1 ? "" : "s"}`}
          {additions.size > 0 &&
            differences.absence_is_authoritative &&
            (differences.requested_absence_product_ids || []).length > 0
            ? "; "
            : ""}
          {differences.absence_is_authoritative &&
            (differences.requested_absence_product_ids || []).length > 0 &&
            `${differences.requested_absence_product_ids?.length} confirmed requested absence${differences.requested_absence_product_ids?.length === 1 ? "" : "s"}`}
        </div>
      )}

      {aggregate.lab_gate.required && (
        <div className="border-t border-border px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-[hsl(var(--text-tertiary))]">
            <FlaskConical className="h-3.5 w-3.5" />
            Required labs
          </div>
          <div className="space-y-2">
            {aggregate.lab_gate.items.map((lab) => (
              <div key={lab.lab_order_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <div>
                  <div className="text-xs font-semibold text-foreground">{lab.panel_name || lab.display_id || "Lab panel"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {lab.partial_results ? `${lab.result_count} partial result${lab.result_count === 1 ? "" : "s"} received` : LAB_GATE_STATUS_LABELS[lab.status] || lab.status.replaceAll("_", " ")}
                  </div>
                  {lab.recollection?.patient_action && (
                    <div className="mt-1 text-[11px] font-medium text-amber-700">
                      {RECOLLECTION_ACTION_LABELS[lab.recollection.patient_action] || lab.recollection.patient_action.replaceAll("_", " ")}
                    </div>
                  )}
                </div>
                {lab.recollection_required && <span className="text-xs font-semibold text-amber-700">Patient redraw required</span>}
              </div>
            ))}
          </div>
          {aggregate.lab_gate.has_partial_results && (
            <p className="mt-2 text-xs text-muted-foreground">Partial results are visible for tracking. Provider review remains held until every required panel is complete.</p>
          )}
          <p className="mt-2 text-xs font-medium text-foreground">
            {PROVIDER_REVIEW_STATUS_LABELS[aggregate.lab_gate.provider_review_state] || aggregate.lab_gate.provider_review_state.replaceAll("_", " ")}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Settlement: {SETTLEMENT_STATUS_LABELS[aggregate.settlement.status] || aggregate.settlement.status.replaceAll("_", " ")}
        </span>
        {aggregate.settlement.settled_at && (
          <span>{new Date(aggregate.settlement.settled_at).toLocaleString()}</span>
        )}
      </div>
      {aggregate.support?.owner && (
        <div className="space-y-1 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <div><span className="font-semibold text-foreground">Support owner:</span> {SUPPORT_OWNER_LABELS[aggregate.support.owner] || aggregate.support.owner.replaceAll("_", " ")}</div>
          {aggregate.support.pending_reason && <div><span className="font-semibold text-foreground">Pending reason:</span> {SUPPORT_PENDING_REASON_LABELS[aggregate.support.pending_reason] || aggregate.support.pending_reason.replaceAll("_", " ")}</div>}
          {aggregate.support.last_error_code && <div className="font-mono text-[10.5px]">Error {aggregate.support.last_error_code}</div>}
          {aggregate.support.last_error_detail && <div>{aggregate.support.last_error_detail}</div>}
          <div className="break-all font-mono text-[10px]">Case {aggregate.treatment_case_id}{aggregate.reconciliation.source_event_id ? ` · event ${aggregate.reconciliation.source_event_id}` : ""}{aggregate.settlement.operation_id ? ` · operation ${aggregate.settlement.operation_id}` : ""}</div>
          <div>Guarded retry: {aggregate.support.retry_allowed ? "Available to authorized support in Django Admin" : "Not currently allowed"}</div>
        </div>
      )}

      {aggregate.siblings.length > 1 && (
        <div className="border-t border-border px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-[hsl(var(--text-tertiary))]">
            Related treatment orders
          </div>
          <div className="flex flex-wrap gap-2">
            {aggregate.siblings.map((sibling) => {
              const active = String(sibling.order_id) === String(currentOrderId)
              return active ? (
                <span
                  key={sibling.treatment_case_id}
                  className="rounded-md border border-primary/30 bg-[hsl(var(--primary-soft))] px-2.5 py-1 text-xs font-semibold text-primary"
                >
                  {sibling.order_display_id || sibling.treatment_type_key || "Current order"}
                </span>
              ) : (
                <Link
                  key={sibling.treatment_case_id}
                  to={CLIENT_TREATMENT_ROUTES.orderDetails(sibling.order_id)}
                  className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-[hsl(var(--text-secondary))] hover:border-primary/40 hover:text-primary"
                >
                  {sibling.order_display_id || sibling.treatment_type_key || "Related order"}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
