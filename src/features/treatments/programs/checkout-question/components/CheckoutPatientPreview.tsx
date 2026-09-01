import { cn } from "@/lib/utils";
import { FlaskConical } from "lucide-react";
import type { ProgramCheckoutProduct, VisibilityRuleGroup } from "@/features/treatments/types";
import type { ProgramLabRequirement } from "@/features/treatments/types";
import type { LabPanel } from "@/api/labs";
import type { CheckoutOfferMode } from "./CheckoutOfferTypeSection";

interface CheckoutPatientPreviewProps {
  validProducts: ProgramCheckoutProduct[];
  selectedPreviewIdx: number;
  visibilityRuleGroup: VisibilityRuleGroup | undefined;
  onSelectedPreviewChange: (index: number) => void;
  mode?: CheckoutOfferMode;
  labRequirements?: ProgramLabRequirement[];
  labPanels?: LabPanel[];
}

const countRules = (group: VisibilityRuleGroup | undefined): number => {
  if (!group) return 0;
  return group.rules.length + (group.subgroups || []).reduce((total, subgroup) => total + countRules(subgroup), 0);
};

export function CheckoutPatientPreview({
  validProducts,
  selectedPreviewIdx,
  visibilityRuleGroup,
  onSelectedPreviewChange,
  mode = "medicine",
  labRequirements = [],
  labPanels = [],
}: CheckoutPatientPreviewProps) {
  const groups = Object.values(
    validProducts.reduce<Record<string, ProgramCheckoutProduct[]>>(
      (result, product) => {
        const key = product.choiceGroup || `product-${product.id}`;
        result[key] = [...(result[key] || []), product];
        return result;
      },
      {},
    ),
  );
  const ruleCount = countRules(visibilityRuleGroup);
  const selectedLabPanels = labRequirements
    .map((requirement) => labPanels.find((panel) => panel.id === requirement.panelId))
    .filter((panel): panel is LabPanel => Boolean(panel));

  if (mode === "lab") {
    const labTotal = selectedLabPanels.reduce((total, panel) => total + panel.cost_to_client, 0);
    return (
      <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-[#111827] p-5">
        <div className="mb-4 flex shrink-0 items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="block text-[10px] font-bold uppercase tracking-wider text-white">Patient Preview</span>
          <span className="ml-auto text-[10px] text-slate-400">Updates live</span>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 min-h-0 flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="mr-4 flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex flex-1 justify-center">
              <div className="rounded bg-slate-100/80 px-4 py-1 text-[10px] font-medium text-slate-400">welliemd.com/intake</div>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
            <h2 className="shrink-0 text-[15px] font-extrabold leading-snug text-slate-950">Order Your Labs</h2>
            <p className="mt-4 shrink-0 text-[10px] font-extrabold uppercase tracking-wide text-slate-800">
              Lab panels <span className="font-medium normal-case text-slate-400">collected through Junction</span>
            </p>
            <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {selectedLabPanels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-[11px] italic text-slate-400">
                  Select a lab panel to preview the patient step.
                </div>
              ) : selectedLabPanels.map((panel) => (
                <div key={panel.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                      <FlaskConical className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-extrabold text-slate-800">{panel.name}</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {panel.biomarkers?.length || 0} markers · {panel.lab_provider || "Junction"}
                      </div>
                    </div>
                    <div className="text-[12px] font-extrabold text-slate-900">${panel.cost_to_client.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 shrink-0 border-t border-slate-100 pt-3">
              <div className="mb-3 flex items-center justify-between text-[12px] font-extrabold text-slate-900">
                <span>Lab total</span><span>${labTotal.toFixed(2)}</span>
              </div>
              <button type="button" className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-center text-[12px] font-extrabold text-white" data-testid="checkout-preview-continue">Continue →</button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-[#111827] p-5">
      <div className="mb-4 flex shrink-0 items-center gap-2">
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
        <div className="mx-auto flex w-full max-w-sm flex-1 min-h-0 flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="mr-4 flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex flex-1 justify-center">
              <div className="rounded bg-slate-100/80 px-4 py-1 text-[10px] font-medium text-slate-400">
                Tenant questionnaire preview
              </div>
            </div>
            <div className="w-[42px]" />
          </div>

          <div className="flex flex-1 min-h-0 flex-col overflow-hidden p-5">
            <div className="shrink-0">
              <h2 className="text-[15px] font-extrabold leading-snug text-slate-950">Recommended treatment</h2>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Choose the available supply for each medication.</p>
            </div>

            <div className="mt-4 flex-1 min-h-0 space-y-2.5 overflow-y-auto pr-1">
              {groups.map((group) => {
                const first = group[0];
                return (
                  <div key={first.choiceGroup || first.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="text-[12px] font-extrabold text-slate-800">
                      {first.patientLabel || first.doseLabel}
                    </div>
                    <div className="mt-0.5 text-[10.5px] text-slate-400">
                      {first.category} · {first.regimen} Regimen
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {group.map((product) => {
                        const index = validProducts.indexOf(product);
                        const selected = selectedPreviewIdx === index;
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => onSelectedPreviewChange(index)}
                            className={cn(
                              "rounded-md border px-2 py-2 text-left",
                              selected
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-slate-200 bg-white",
                            )}
                            data-testid={`select-preview-product-${index}`}
                          >
                            <span className="block text-[10.5px] font-bold text-slate-700">
                              {product.rxDaysSupply
                                ? `${product.rxDaysSupply}-day supply`
                                : "Supply duration missing"}
                            </span>
                            {product.price !== undefined && (
                              <span className="mt-0.5 block text-[11px] font-extrabold text-slate-900">
                                ${Number(product.price).toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 shrink-0">
              <button
                type="button"
                className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-center text-[12px] font-extrabold text-white transition-colors hover:bg-emerald-700"
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
        </div>
      )}
    </aside>
  );
}
