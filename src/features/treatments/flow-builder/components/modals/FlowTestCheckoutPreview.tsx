import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { formatCheckoutMoney } from "@/features/treatments/utils/checkoutPricing";
import type {
  FlowTestCheckoutGroup,
  FlowTestCheckoutSummary,
} from "@/features/treatments/flow-builder/hooks/usePatientFlowTest";

interface FlowTestCheckoutPreviewProps {
  checkoutGroups: FlowTestCheckoutGroup[];
  checkoutSummary: FlowTestCheckoutSummary;
  isProductSelected: (productId: string) => boolean;
  onToggleProduct: (productId: string) => void;
  onSelectAllInTreatment: (moduleId: string) => void;
}

export function FlowTestCheckoutPreview({
  checkoutGroups = [],
  checkoutSummary,
  isProductSelected,
  onToggleProduct,
  onSelectAllInTreatment,
}: FlowTestCheckoutPreviewProps) {
  const disqualifications = checkoutSummary?.disqualifications ?? [];
  const hasProducts = checkoutGroups.length > 0;
  const hasDisqualification = disqualifications.length > 0;
  const canContinue = (checkoutSummary?.selectedProductCount ?? 0) > 0;

  return (
    <aside className="flex flex-col overflow-y-auto bg-[#111827] p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-white">
          Patient Checkout
        </span>
        <span className="ml-auto text-[10px] font-medium text-slate-400">Live</span>
      </div>

      <div
        className="mx-auto flex w-full max-w-[286px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        aria-label="Patient checkout preview"
      >
        <div className="flex shrink-0 items-center border-b border-slate-200 bg-slate-100 px-3 py-2.5">
          <div className="mr-3 flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex flex-1 justify-center">
            <div className="rounded border border-slate-200 bg-white px-4 py-1 text-[10px] font-medium text-slate-400">
              welliemd.com/checkout
            </div>
          </div>
          <div className="w-[42px]" />
        </div>

        <div className="min-h-[154px] p-4" aria-live="polite" aria-atomic="true">
          {hasProducts ? (
            <div className="space-y-4">
              <p className="text-[11px] leading-snug text-slate-500">
                {checkoutSummary.totalProducts} product{checkoutSummary.totalProducts === 1 ? "" : "s"} available across{" "}
                {checkoutSummary.qualifyingModules} treatment{checkoutSummary.qualifyingModules === 1 ? "" : "s"}. Select what you&apos;d like to continue with.
              </p>

              {checkoutGroups.map((group) => {
                const selectedInGroup = group.products.filter((product) =>
                  isProductSelected(product.id)
                ).length;
                const allSelected =
                  group.products.length > 0 && selectedInGroup === group.products.length;

                return (
                  <div key={group.moduleId} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {group.moduleName} · {selectedInGroup}/{group.products.length} selected
                      </span>
                      {group.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onSelectAllInTreatment(group.moduleId)}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                          data-testid={`flow-test-select-all-${group.moduleId}`}
                        >
                          {allSelected ? "Clear all" : "Select all"}
                        </button>
                      )}
                    </div>

                    {group.products.map((product) => {
                      const selected = isProductSelected(product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => onToggleProduct(product.id)}
                          className={cn(
                            "flex w-full items-start gap-2.5 rounded-md border px-3 py-3 text-left transition-colors",
                            selected
                              ? "border-blue-500 bg-blue-50/60"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          )}
                          aria-pressed={selected}
                          data-testid={`flow-test-product-${product.id}`}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border bg-white",
                              selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                            )}
                            aria-hidden="true"
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12px] font-extrabold leading-snug text-slate-900">
                              {product.title}
                            </span>
                            <span className="mt-0.5 block text-[10px] leading-snug text-slate-400">
                              {product.subtitle}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-[12px] font-extrabold text-slate-950">
                              {formatCheckoutMoney(product.price)}
                            </span>
                            <span className="block text-[9.5px] leading-snug text-slate-400">
                              starting from
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-900">Your Cart</span>
                  <span className="text-[14px] font-extrabold text-slate-950">
                    {formatCheckoutMoney(checkoutSummary.cartTotal)}
                  </span>
                </div>
                <p className="mt-1 text-[10.5px] font-medium text-slate-500">
                  {checkoutSummary.selectedProductCount} product
                  {checkoutSummary.selectedProductCount === 1 ? "" : "s"} selected from{" "}
                  {checkoutSummary.selectedTreatmentCount} treatment
                  {checkoutSummary.selectedTreatmentCount === 1 ? "" : "s"}.
                </p>
              </div>

              {checkoutSummary.warmLeadTreatments.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[10.5px] font-semibold leading-snug text-amber-800">
                  <p>
                    {checkoutSummary.warmLeadTreatments.length} qualified but not selected — warm leads kept for follow-up:
                  </p>
                  {checkoutSummary.warmLeadTreatments.map((name) => (
                    <p key={name}>· {name}</p>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-center text-[11.5px] font-extrabold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
                disabled={!canContinue}
                data-testid="flow-test-checkout-continue"
              >
                Continue to Payment
              </button>
            </div>
          ) : (
            <div className="flex h-full min-h-[130px] items-center justify-center">
              <p className="text-center text-[12px] italic leading-relaxed text-slate-400">
                {hasDisqualification
                  ? "No products shown — disqualifier hit."
                  : "Answer the screening questions to see products at checkout."}
              </p>
            </div>
          )}
        </div>
      </div>

      {hasDisqualification && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-[11px] leading-snug text-red-200">
          <p className="font-bold text-red-100">⚠ Disqualified:</p>
          {disqualifications.map((dq) => (
            <p key={`${dq.moduleId}-${dq.questionId}`} className="mt-1">
              · <span className="font-semibold">{dq.moduleName}</span>: &ldquo;{dq.questionText}&rdquo; → {dq.choice}
            </p>
          ))}
        </div>
      )}
    </aside>
  );
}
