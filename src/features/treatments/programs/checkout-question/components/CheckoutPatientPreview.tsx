import { cn } from "@/lib/utils";
import type { ProgramCheckoutProduct, VisibilityRuleGroup } from "@/features/treatments/types";

interface CheckoutPatientPreviewProps {
  validProducts: ProgramCheckoutProduct[];
  selectedPreviewIdx: number;
  visibilityRuleGroup: VisibilityRuleGroup | undefined;
  onSelectedPreviewChange: (index: number) => void;
}

const countRules = (group: VisibilityRuleGroup | undefined): number => {
  if (!group) return 0;
  return group.rules.length + (group.subgroups || []).reduce((total, subgroup) => total + countRules(subgroup), 0);
};

export function CheckoutPatientPreview({ validProducts, selectedPreviewIdx, visibilityRuleGroup, onSelectedPreviewChange }: CheckoutPatientPreviewProps) {
  const activeProduct = validProducts[selectedPreviewIdx] || validProducts[0];
  const title = activeProduct ? `Product Options — ${activeProduct.doseLabel}` : "Product Options";
  const ruleCount = countRules(visibilityRuleGroup);

  return (
    <aside className="flex flex-col overflow-y-auto bg-[#111827] p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="block text-[10px] font-bold uppercase tracking-wider text-white">Patient Preview</span>
      </div>
      {validProducts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-6 text-center text-xs italic leading-relaxed text-slate-400">
            Configure Category, Regimen, and Dose for at least one product to see the patient preview.
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="mr-4 flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex flex-1 justify-center">
              <div className="rounded bg-slate-100/80 px-4 py-1 text-[10px] font-medium text-slate-400">
                welliemd.com/intake
              </div>
            </div>
            <div className="w-[42px]" />
          </div>

          <div className="p-5">
            <h2 className="text-[15px] font-extrabold leading-snug text-slate-950">{title}</h2>
            <p className="mt-1 text-[11px] font-medium text-slate-500">Choose the option that fits you best.</p>

            <div className="mt-4 space-y-2.5">
              {validProducts.map((product, index) => {
                const selected = selectedPreviewIdx === index;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onSelectedPreviewChange(index)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-all",
                      selected ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                    data-testid={`select-preview-product-${index}`}
                  >
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-slate-300">
                      {selected && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-extrabold text-slate-800">{product.doseLabel}</span>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-400">
                        {product.category} · {product.regimen} Regimen
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2.5 text-center text-[12px] font-extrabold text-white transition-colors hover:bg-emerald-700"
              data-testid="checkout-preview-continue"
            >
              Continue →
            </button>

            {ruleCount > 0 && (
              <p className="mt-3 text-center text-[10px] font-medium text-slate-400">
                Visibility rules decide when this product step appears.
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
