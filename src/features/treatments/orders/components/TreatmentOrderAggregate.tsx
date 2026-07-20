import { AlertTriangle, CheckCircle2, Clock3, Stethoscope } from "lucide-react"

import type { TreatmentAggregateProduct, TreatmentOrderAggregate as Contract } from "@/api/dashboardApi"
import { cn } from "@/lib/utils"
import {
  SETTLEMENT_STATUS_LABELS,
  TREATMENT_CLINICAL_STATUS_LABELS,
  TREATMENT_CLINICAL_STATUS_STYLES,
} from "../constants"

const readable = (value: string) => value.replaceAll("_", " ")
const productName = (product: TreatmentAggregateProduct) =>
  product.name || product.med_id || `Product ${product.product_id || ""}`.trim()

function ProductSet({ label, products, empty }: { label: string; products: TreatmentAggregateProduct[]; empty: string }) {
  return <div>
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="space-y-2">
      {products.length ? products.map((product, index) => <div
        key={String(product.product_id || product.source_product_id || product.med_id || index)}
        className="flex justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-xs"
      >
        <div><div className="font-semibold">{productName(product)}</div>
          {(product.med_id || product.source_product_id) && <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{product.med_id || `Catalog ${product.source_product_id}`}</div>}
        </div>
        <span className="shrink-0 text-muted-foreground">Qty {product.quantity || 1}</span>
      </div>) : <div className="rounded-lg border border-dashed px-3 py-4 text-xs text-muted-foreground">{empty}</div>}
    </div>
  </div>
}

export function TreatmentOrderAggregate({ aggregate }: { aggregate: Contract }) {
  const review = aggregate.clinical_status === "clinical_review"
  const settled = aggregate.clinical_status === "prescription_settled"
  const Icon = review ? AlertTriangle : settled ? CheckCircle2 : Clock3
  const unresolved = aggregate.reconciliation.unresolved_facts || []
  const label = TREATMENT_CLINICAL_STATUS_LABELS[aggregate.clinical_status] || readable(aggregate.clinical_status)
  const style = TREATMENT_CLINICAL_STATUS_STYLES[aggregate.clinical_status] || TREATMENT_CLINICAL_STATUS_STYLES.awaiting_prescription

  return <section className="overflow-hidden rounded-lg border bg-card">
    <div className="flex items-start justify-between gap-3 border-b bg-muted/40 px-4 py-3">
      <div><div className="flex items-center gap-2 text-sm font-semibold"><Stethoscope className="h-4 w-4 text-primary" />{aggregate.treatment_type.name || aggregate.treatment_type.key}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">Prescription set version {aggregate.reconciliation.version || "—"}</div>
      </div>
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize", style)}><Icon className="h-3.5 w-3.5" />{label}</span>
    </div>
    {review && <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">Clinical or support review is required. The patient is not asked to accept or reject a medication change.</div>}
    <div className="grid gap-4 p-4">
      <ProductSet label="Requested products" products={aggregate.reconciliation.requested_set || []} empty="No requested Product snapshot is available." />
      <ProductSet label="Current prescribed products" products={aggregate.reconciliation.prescribed_set || []} empty="Awaiting the provider prescription." />
    </div>
    <div className="space-y-1 border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
      <div>Settlement: {SETTLEMENT_STATUS_LABELS[aggregate.settlement.status] || readable(aggregate.settlement.status)}</div>
      {aggregate.settlement.settled_at && <div>Settled: {new Date(aggregate.settlement.settled_at).toLocaleString()}</div>}
      {unresolved.length > 0 && <div className="text-amber-700">Unresolved provider facts: {unresolved.length}</div>}
      {aggregate.settlement.last_error_code && <div>Error: <span className="font-mono">{aggregate.settlement.last_error_code}</span></div>}
      {aggregate.settlement.operation_id && <div className="break-all font-mono text-[10px]">Operation {aggregate.settlement.operation_id} · attempts {aggregate.settlement.patient_attempts || 0}/{aggregate.settlement.reimbursement_attempts || 0}</div>}
    </div>
    {aggregate.siblings.length > 1 && <div className="border-t px-4 py-3 text-xs"><span className="font-semibold">Related treatment orders: </span>{aggregate.siblings.map(sibling => sibling.order_display_id || sibling.treatment_type_key).join(", ")}</div>}
  </section>
}
