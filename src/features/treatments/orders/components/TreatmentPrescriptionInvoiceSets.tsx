import type { InvoiceTreatmentPrescription } from "@/services/billingService"

const nameOf = (product: InvoiceTreatmentPrescription["requested_set"][number]) =>
  product.name || product.med_id || `Product ${product.source_product_id || product.product_id || ""}`.trim()

export function TreatmentPrescriptionInvoiceSets({ contract }: { contract: InvoiceTreatmentPrescription }) {
  return <section className="border-b border-slate-200 p-5 dark:border-slate-800">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Treatment prescription</h4>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold capitalize dark:border-slate-700 dark:bg-slate-900">{(contract.invoice_status || "pending").split("_").join(" ")}</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {(["requested_set", "prescribed_set"] as const).map((key) => <div key={key}>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{key === "requested_set" ? "Requested products" : "Current prescribed products"}</div>
        <div className="space-y-1.5">{contract[key].length ? contract[key].map((product, index) => <div key={String(product.source_product_id || product.product_id || product.med_id || index)} className="flex justify-between rounded-md border border-slate-200 px-3 py-2 text-xs dark:border-slate-700"><span className="font-medium">{nameOf(product)}</span><span className="text-slate-400">Qty {product.quantity || 1}</span></div>) : <div className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400 dark:border-slate-700">None recorded</div>}</div>
      </div>)}
    </div>
    <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500 sm:grid-cols-2 dark:border-slate-800">
      <span>Requested authorization: ${contract.requested_authorized_amount || "0.00"}</span>
      <span>Prescribed final: ${contract.prescribed_final_amount || "0.00"}</span>
      <span className="capitalize">Settlement: {(contract.settlement_flow || "pending").split("_").join(" ")}</span>
      <span>Supplemental delta: ${contract.supplemental_delta_amount || "0.00"}</span>
    </div>
  </section>
}
