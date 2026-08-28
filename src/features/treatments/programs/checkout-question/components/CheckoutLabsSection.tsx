import { useEffect, useMemo, useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { labsApi, type LabPanel } from "@/api/labs";
import type { ProgramLabRequirement } from "@/features/treatments/types";
import { toast } from "@/components/ui/use-toast";

interface CheckoutLabsSectionProps {
  requirements: ProgramLabRequirement[];
  onChange: (requirements: ProgramLabRequirement[]) => void;
  onPanelsLoaded?: (panels: LabPanel[]) => void;
  disabled?: boolean;
}

/**
 * Lab selection belongs visually to the Checkout element, but is persisted
 * through ProgramLabRequirement because it is also consumed by release
 * manifests, tenant assignment, and the Beluga release gate.
 */
export function CheckoutLabsSection({
  requirements,
  onChange,
  onPanelsLoaded,
  disabled = false,
}: CheckoutLabsSectionProps) {
  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    labsApi.getLabPanels()
      .then((nextPanels) => {
        if (!cancelled) setPanels(nextPanels);
        if (!cancelled) onPanelsLoaded?.(nextPanels);
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            title: "Labs unavailable",
            description: "The Junction lab catalog could not be loaded.",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectablePanels = useMemo(
    () => panels.filter((panel) => panel.is_active && panel.is_assignable !== false),
    [panels],
  );
  const selectedIds = useMemo(
    () => new Set(requirements.map((requirement) => requirement.panelId)),
    [requirements],
  );

  const togglePanel = (panel: LabPanel) => {
    if (disabled) return;
    const next = selectedIds.has(panel.id)
      ? requirements
          .filter((requirement) => requirement.panelId !== panel.id)
          .map((requirement, index) => ({ ...requirement, displayOrder: index + 1 }))
      : [
          ...requirements,
          {
            panelId: panel.id,
            panelName: panel.name,
            displayOrder: requirements.length + 1,
            isRequired: true,
            isActive: true,
            instructions: "",
          },
        ];
    onChange(next);
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
            <FlaskConical className="h-4 w-4 text-blue-600" />
            Labs to include
          </div>
          <p className="mt-1 text-[11.5px] leading-normal text-slate-400">
            Attach lab panels ordered through Junction alongside this checkout. Patients
            choose the collection method, but cannot skip a required panel.
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
      </div>

      {!loading && selectablePanels.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-[11.5px] text-slate-500">
          No active, assignable Junction panels are available. Configure the panel
          under Products → Labs first.
        </div>
      )}

      <div className="space-y-2">
        {selectablePanels.map((panel) => {
          const selected = selectedIds.has(panel.id);
          return (
            <label
              key={panel.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors ${
                selected
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-blue-600"
                checked={selected}
                disabled={disabled}
                onChange={() => togglePanel(panel)}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-bold text-slate-900">
                  {panel.name}
                </span>
                <span className="mt-0.5 block text-[10.5px] text-slate-500">
                  {panel.biomarkers?.length || 0} markers · {panel.lab_provider || "Junction"}
                  {panel.collection_method ? ` · ${panel.collection_method.replaceAll("_", " ")}` : ""}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {requirements.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-800">
          {requirements.length} required lab panel{requirements.length === 1 ? "" : "s"} selected.
          Junction orders are created after final checkout and gate the Beluga release.
        </div>
      )}
    </section>
  );
}
