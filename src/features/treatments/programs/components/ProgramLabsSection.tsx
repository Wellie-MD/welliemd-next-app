import { useEffect, useMemo, useState } from "react";
import { FlaskConical, Loader2, Plus, Trash2 } from "lucide-react";
import { labsApi, type LabPanel } from "@/api/labs";
import type { CombinedLabPanel } from "@/features/labs/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Program, ProgramLabRequirement } from "@/features/treatments/types";
import { useSaveProgramLabRequirements } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";
import {
  isSelectableTarget,
  requirementForTarget,
  requirementTargetKey,
  targetKey,
  targetMethods,
  targetName,
  type ProgramLabTarget,
} from "./programLabRequirementCatalog";

interface Props {
  program: Program;
}

export function ProgramLabsSection({ program }: Props) {
  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [combinedPanels, setCombinedPanels] = useState<CombinedLabPanel[]>([]);
  const [requirements, setRequirements] = useState<ProgramLabRequirement[]>(
    program.labRequirements || [],
  );
  const [loading, setLoading] = useState(true);
  const saveProgramLabs = useSaveProgramLabRequirements();

  useEffect(() => {
    setRequirements(program.labRequirements || []);
  }, [program.labRequirements]);

  useEffect(() => {
    Promise.all([labsApi.getLabPanels(), labsApi.getCombinedPanels()])
      .then(([nextPanels, nextCombinedPanels]) => {
        setPanels(nextPanels);
        setCombinedPanels(nextCombinedPanels);
      })
      .catch(() => {
        toast({
          title: "Labs unavailable",
          description: "The lab catalog could not be loaded.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const targets = useMemo<ProgramLabTarget[]>(
    () => [
      ...panels
        .filter((panel) => panel.is_active && panel.is_assignable !== false)
        .map((panel) => ({ kind: "single" as const, panel })),
      ...combinedPanels
        .map((panel) => ({ kind: "combined" as const, panel }))
        .filter(isSelectableTarget),
    ],
    [combinedPanels, panels],
  );
  const selected = useMemo(
    () => new Set(requirements.map(requirementTargetKey)),
    [requirements],
  );
  const available = targets.filter(
    (target) => !selected.has(targetKey(target)),
  );

  const persist = async (next: ProgramLabRequirement[]) => {
    setRequirements(next);
    try {
      await saveProgramLabs.mutateAsync({ programId: program.id, requirements: next });
      toast({
        title: "Program labs saved",
        description: "Required labs will be resolved during tenant assignment.",
      });
    } catch {
      setRequirements(program.labRequirements || []);
      toast({
        title: "Unable to save Program labs",
        description: "Review the selected panels and try again.",
        variant: "destructive",
      });
    }
  };

  const addPanel = (targetKeyValue: string) => {
    const target = available.find((item) => targetKey(item) === targetKeyValue);
    if (!target) return;
    void persist([
      ...requirements,
      requirementForTarget(target, requirements.length + 1),
    ]);
  };

  return (
    <section className="mx-6 mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FlaskConical className="h-4 w-4 text-blue-600" />
            Required labs
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Each selection creates an independent Junction lab order. Results gate
            this Program&apos;s Beluga visit; the lab never creates its own visit.
          </p>
        </div>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : (
          <label className="relative">
            <span className="sr-only">Add lab panel</span>
            <select
              className="h-9 min-w-52 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-700"
              value=""
              onChange={(event) => addPanel(event.target.value)}
              disabled={saveProgramLabs.isPending || available.length === 0}
            >
            <option value="">{available.length ? "Add lab panel…" : "No panels available"}</option>
              {available.map((target) => (
                <option key={targetKey(target)} value={targetKey(target)}>
                  {targetName(target)} ({target.kind === "combined" ? "Combined panel" : "Single panel"})
                </option>
              ))}
            </select>
            <Plus className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
          </label>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {panels.some((panel) => panel.is_active && panel.is_assignable === false) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Some active catalog panels are hidden until their Junction configuration and billing fields are complete. Configure them under Labs before adding them to a Program.
          </div>
        )}
        {requirements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
            No lab is required for this Program.
          </div>
        ) : requirements.map((requirement, index) => (
          <div key={requirementTargetKey(requirement)} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {requirement.panelName || requirement.combinedPanelName || targets.find((target) => targetKey(target) === requirementTargetKey(requirement))?.panel.name || "Lab panel"}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                  {requirement.requirementKind === "combined" ? "Combined panel · " : "Single panel · "}
                  {(() => {
                    const target = targets.find((item) => targetKey(item) === requirementTargetKey(requirement));
                    return target ? targetMethods(target).join(" · ") : "Collection method unavailable";
                  })()}
                </div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                  Required for release
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${requirement.panelName || requirement.combinedPanelName || "lab panel"}`}
                disabled={saveProgramLabs.isPending}
                onClick={() => void persist(
                    requirements
                    .filter((item) => requirementTargetKey(item) !== requirementTargetKey(requirement))
                    .map((item, nextIndex) => ({ ...item, displayOrder: nextIndex + 1 })),
                )}
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
              </Button>
            </div>
            <Input
              className="mt-3 h-9 text-xs"
              placeholder="Patient instructions (optional)"
              value={requirement.instructions || ""}
              onChange={(event) => {
                const next = [...requirements];
                next[index] = { ...requirement, instructions: event.target.value };
                setRequirements(next);
              }}
              onBlur={() => void persist(requirements)}
            />
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label className="block text-[11px] font-semibold text-slate-700" htmlFor={`program-lab-sharing-${requirementTargetKey(requirement)}`}>
                Custom Program grouping
              </label>
              <select
                id={`program-lab-sharing-${requirementTargetKey(requirement)}`}
                value={requirement.sharingPolicy || "never"}
                disabled={saveProgramLabs.isPending}
                onChange={(event) => {
                  const sharingPolicy = event.target.value as "never" | "explicit_group";
                  // An explicit group is invalid until its key is entered.
                  // Keep this local edit unsaved so the input remains usable;
                  // the existing blur save then sends the complete contract.
                  setRequirements(requirements.map((item) => (
                    requirementTargetKey(item) === requirementTargetKey(requirement)
                      ? {
                        ...item,
                        sharingPolicy,
                        sharingGroupKey: sharingPolicy === "explicit_group"
                          ? item.sharingGroupKey || ""
                          : "",
                      }
                      : item
                  )));
                }}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700"
              >
                <option value="never">Keep this lab independent</option>
                <option value="explicit_group">Show once when safely shareable</option>
              </select>
              {requirement.sharingPolicy === "explicit_group" && (
                <Input
                  className="mt-2 h-9 text-xs"
                  value={requirement.sharingGroupKey || ""}
                  placeholder="Shared group key, e.g. baseline-cbc"
                  onChange={(event) => setRequirements(requirements.map((item) => (
                    requirementTargetKey(item) === requirementTargetKey(requirement)
                      ? { ...item, sharingGroupKey: event.target.value }
                      : item
                  )))}
                  onBlur={(event) => void persist(requirements.map((item) => (
                    requirementTargetKey(item) === requirementTargetKey(requirement)
                      ? { ...item, sharingGroupKey: event.target.value }
                      : item
                  )))}
                />
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Share only matching source panels across Programs. Live checkout verifies all tenant and clinical facts before combining them.
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
