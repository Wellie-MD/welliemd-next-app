import { useEffect, useMemo, useState } from "react";
import { FlaskConical, Loader2, Plus, Trash2 } from "lucide-react";
import { labsApi, type LabPanel } from "@/api/labs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Program, ProgramLabRequirement } from "@/features/treatments/types";
import { useSaveProgram } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { toast } from "@/components/ui/use-toast";

interface Props {
  program: Program;
}

export function ProgramLabsSection({ program }: Props) {
  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [requirements, setRequirements] = useState<ProgramLabRequirement[]>(
    program.labRequirements || [],
  );
  const [loading, setLoading] = useState(true);
  const saveProgram = useSaveProgram();

  useEffect(() => {
    setRequirements(program.labRequirements || []);
  }, [program.labRequirements]);

  useEffect(() => {
    labsApi.getLabPanels()
      .then(setPanels)
      .catch(() => {
        toast({
          title: "Labs unavailable",
          description: "The lab catalog could not be loaded.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => new Set(requirements.map((requirement) => requirement.panelId)),
    [requirements],
  );
  const available = panels.filter(
    (panel) => panel.is_active && !selected.has(panel.id),
  );

  const persist = async (next: ProgramLabRequirement[]) => {
    setRequirements(next);
    try {
      await saveProgram.mutateAsync({ ...program, labRequirements: next });
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

  const addPanel = (panelId: string) => {
    const panel = panels.find((item) => item.id === panelId);
    if (!panel) return;
    void persist([
      ...requirements,
      {
        panelId: panel.id,
        panelName: panel.name,
        displayOrder: requirements.length + 1,
        isRequired: true,
        isActive: true,
        instructions: "",
      },
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
              disabled={saveProgram.isPending || available.length === 0}
            >
              <option value="">{available.length ? "Add lab panel…" : "No panels available"}</option>
              {available.map((panel) => (
                <option key={panel.id} value={panel.id}>{panel.name}</option>
              ))}
            </select>
            <Plus className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
          </label>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {requirements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
            No lab is required for this Program.
          </div>
        ) : requirements.map((requirement, index) => (
          <div key={requirement.panelId} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {requirement.panelName || panels.find((panel) => panel.id === requirement.panelId)?.name || "Lab panel"}
                </div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                  Required for release
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${requirement.panelName || "lab panel"}`}
                disabled={saveProgram.isPending}
                onClick={() => void persist(
                  requirements
                    .filter((item) => item.panelId !== requirement.panelId)
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
          </div>
        ))}
      </div>
    </section>
  );
}
