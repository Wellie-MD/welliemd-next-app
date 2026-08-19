import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import type { Program } from "@/features/treatments/types";
import { RUNTIME_STATE } from "@/features/treatments/assignment/constants";

interface ProgramLibraryTabProps {
  programs: Program[];
  onAddItem: (item: {
    kind: "program";
    title: string;
    subtitle: string;
    treatmentTypeKey?: string;
    sourceId?: string;
  }) => void;
  flowItems?: Array<{ kind: string; title: string; sourceId?: string }>;
}

export function ProgramLibraryTab({ programs, onAddItem, flowItems = [] }: ProgramLibraryTabProps) {
  const isProgramAdded = (programId: string) => {
    return flowItems.some((fi) => fi.kind === "program" && fi.sourceId === programId);
  };
  const attachablePrograms = programs.filter(
    (program) => program.assignmentRuntimeState === RUNTIME_STATE.ready,
  );

  return (
    <div className="space-y-4">
      {/* Top Warning Alert Notice Box */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-[12px] leading-relaxed text-blue-800">
        <span className="font-semibold">Onboarding plan</span> — only Intake modules can be attached. Each treatment has both, but a plan represents one phase of the patient journey.
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Available Intake modules
        </div>

        {attachablePrograms.map((program) => {
          const added = isProgramAdded(program.id);

          return (
            <div
              key={program.id}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex justify-between items-center"
            >
              <div>
                <div className="text-xs font-semibold text-slate-700 leading-tight">
                  {program.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {program.visitType || "weightloss"} questions · Onboarding
                </div>
              </div>

              {added ? (
                <span className="shrink-0 h-7 w-7 inline-flex items-center justify-center text-emerald-600 rounded-md border border-emerald-100 bg-emerald-50">
                  <Check className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-7 w-7 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() =>
                    onAddItem({
                      kind: "program",
                      title: program.name,
                      subtitle: "Treatment program questions.",
                      treatmentTypeKey: program.treatmentTypeKey,
                      sourceId: program.id,
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
        {!attachablePrograms.length && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
            No Programs are ready to attach. Publish and complete runtime setup for a Program first.
          </p>
        )}
      </div>
    </div>
  );
}
