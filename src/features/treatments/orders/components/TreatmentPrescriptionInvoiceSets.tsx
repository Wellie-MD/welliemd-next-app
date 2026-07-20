import type { InvoiceTreatmentPrescription } from "@/types/b2bBilling"

const nameOf = (product: InvoiceTreatmentPrescription["requested_set"][number]) =>
  product.name || product.med_id || `Product ${product.source_product_id || product.product_id || ""}`.trim()

export function TreatmentPrescriptionInvoiceSets({ contract }: { contract: InvoiceTreatmentPrescription }) {
  return <section className="rounded-lg border bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h4 className="text-sm font-semibold">Treatment prescription</h4>
      <span className="rounded-full border bg-muted px-2.5 py-1 text-[10px] font-semibold capitalize">{(contract.invoice_status || "pending").split("_").join(" ")}</span>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {(["requested_set", "prescribed_set"] as const).map((key) => <div key={key}>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{key === "requested_set" ? "Requested products" : "Current prescribed products"}</div>
        <div className="space-y-1.5">{contract[key].length ? contract[key].map((product, index) => <div key={String(product.source_product_id || product.product_id || product.med_id || index)} className="flex justify-between rounded-md border px-3 py-2 text-xs"><span className="font-medium">{nameOf(product)}</span><span className="text-muted-foreground">Qty {product.quantity || 1}</span></div>) : <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">None recorded</div>}</div>
      </div>)}
    </div>
    <div className="mt-3 grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-2">
      <span>Requested authorization: ${contract.requested_authorized_amount || "0.00"}</span>
      <span>Prescribed final: ${contract.prescribed_final_amount || "0.00"}</span>
      <span>Settlement: {(contract.settlement_flow || "pending").split("_").join(" ")}</span>
      <span>Supplemental delta: ${contract.supplemental_delta_amount || "0.00"}</span>
    </div>
  </section>
}
