import { cn } from "@/lib/utils";
import type { ProgramCheckoutProduct, VisibilityRule } from "@/features/treatments/types";

interface CheckoutPatientPreviewProps {
  validProducts: ProgramCheckoutProduct[];
  selectedPreviewIdx: number;
  rules: VisibilityRule[];
  onSelectedPreviewChange: (index: number) => void;
}

export function CheckoutPatientPreview({ validProducts, selectedPreviewIdx, rules, onSelectedPreviewChange }: CheckoutPatientPreviewProps) {
  return (
    <div className="flex flex-col overflow-y-auto bg-[#f8fafc] p-5">
      <span className="mb-3 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Preview</span>
      {validProducts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs italic leading-relaxed text-slate-400">
            Configure Category, Regimen, and Dose for at least one product to see the patient preview.
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3.5">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">As Shown to Patient</div>
              <div className="mt-1 text-[13px] font-bold text-slate-800">Choose your product</div>
            </div>
            <div className="space-y-2.5 p-4">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Choose Product</div>
              {validProducts.map((product, index) => {
                const selected = selectedPreviewIdx === index;
                return (
                  <button key={product.id} type="button" onClick={() => onSelectedPreviewChange(index)} className={cn("flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left text-[12px] transition-all", selected ? "border-blue-600 bg-blue-50/10 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300")} data-testid={`select-preview-product-${index}`}>
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-slate-300">{selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold text-slate-800">{product.doseLabel}</span>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-400">{product.category} · {product.regimen} regimen</span>
                    </span>
                    <span className="flex-shrink-0 pl-2 text-right">
                      <span className="block font-mono text-[12px] font-bold text-slate-800">$-</span>
                      <span className="block text-[9.5px] text-slate-400">starting from</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-[#fde047] bg-[#fefce8] px-3 py-2.5 text-[11px] font-medium leading-relaxed text-[#713f12] shadow-sm">
            <strong>Visibility:</strong> {rules.length === 0 ? "Always visible to all patients in this plan." : "Only shown to patients whose answers match the configured rules."}
          </div>
        </div>
      )}
    </div>
  );
}
