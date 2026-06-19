import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PreviewContext } from "@/features/treatments/types";
import { usePatientFlowTest } from "@/features/treatments/flow-builder/hooks/usePatientFlowTest";
import { FlowTestModuleSection } from "./FlowTestModuleSection";
import { FlowTestCheckoutPreview } from "./FlowTestCheckoutPreview";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PatientFlowInlineSimulatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewContext: PreviewContext;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PatientFlowInlineSimulator({
  open,
  onOpenChange,
  previewContext,
}: PatientFlowInlineSimulatorProps) {
  const [pendingModuleId, setPendingModuleId] = useState<string>("");

  const {
    modules,
    unselectedModules,
    answers,
    checkoutGroups,
    checkoutSummary,
    isProductSelected,
    toggleProduct,
    selectAllInTreatment,
    handleSingleAnswer,
    handleMultiAnswer,
    resetAnswers,
    addModule,
    removeModule,
    handleModalOpenChange,
    selectedModuleIds,
  } = usePatientFlowTest({ previewContext, open });

  const handleOpenChange = (nextOpen: boolean) => {
    handleModalOpenChange(nextOpen);
    if (!nextOpen) setPendingModuleId("");
    onOpenChange(nextOpen);
  };

  const handleAddEligibility = () => {
    if (pendingModuleId) {
      addModule(pendingModuleId);
      setPendingModuleId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[90vh] w-[96vw] max-w-[1100px] flex-col gap-0 overflow-hidden",
          "rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl"
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Accessible title/description */}
        <DialogTitle className="sr-only">Patient Flow Test</DialogTitle>
        <DialogDescription className="sr-only">
          Answer questions as a patient to see which products appear at checkout.
        </DialogDescription>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="z-20 flex shrink-0 items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-[16px] font-bold leading-tight text-slate-900">
              Patient Flow Test
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Answer questions as a patient — see which products appear at checkout.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-slate-200 px-4 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
              onClick={resetAnswers}
              data-testid="patient-flow-test-reset"
            >
              Reset Answers
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-[#1d4ed8] px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              onClick={() => handleOpenChange(false)}
              data-testid="patient-flow-test-close"
            >
              Close
            </Button>
          </div>
        </div>

        {/* ── Eligibility modules toolbar ──────────────────────────────────── */}
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-6 py-3">
          <p className="mb-2 text-[9.5px] font-bold uppercase tracking-widest text-slate-400">
            Eligibility Modules in This Flow
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {selectedModuleIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {modules.map((mod) => (
                  <span
                    key={mod.id}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700"
                    data-testid={`flow-test-module-chip-${mod.id}`}
                  >
                    {mod.name}
                    <button
                      type="button"
                      aria-label={`Remove ${mod.name}`}
                      onClick={() => removeModule(mod.id)}
                      className="ml-0.5 rounded-full text-blue-400 transition-colors hover:text-blue-700"
                      data-testid={`flow-test-remove-module-${mod.id}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Select
                value={pendingModuleId}
                onValueChange={setPendingModuleId}
                disabled={unselectedModules.length === 0}
              >
                <SelectTrigger
                  className="h-8 min-w-[200px] rounded-lg border-slate-200 bg-white text-xs text-slate-500 shadow-sm"
                  data-testid="flow-test-module-select"
                >
                  <SelectValue placeholder="— Add an eligibility module —" />
                </SelectTrigger>
                <SelectContent>
                  {unselectedModules.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                onClick={handleAddEligibility}
                disabled={!pendingModuleId}
                data-testid="flow-test-add-module"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Eligibility
              </Button>
            </div>

            <p className="ml-auto hidden text-[11px] italic text-slate-400 xl:block">
              Add modules to simulate multi-treatment flow (e.g., ED + PE + GLP).
            </p>
          </div>
        </div>

        {/* ── Two-column body ───────────────────────────────────────────────── */}
        <div className="grid min-h-0 flex-1 grid-cols-[1fr,300px] overflow-hidden">
          <ScrollArea className="border-r border-slate-100">
            <div className="space-y-8 px-6 py-5">
              {modules.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2">
                  <p className="text-[13px] italic text-slate-400">
                    Add an eligibility module above to begin the flow test.
                  </p>
                </div>
              ) : (
                modules.map((mod) => (
                  <FlowTestModuleSection
                    key={mod.id}
                    module={mod}
                    answers={answers}
                    onSingleChange={handleSingleAnswer}
                    onMultiChange={handleMultiAnswer}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          <FlowTestCheckoutPreview
            checkoutGroups={checkoutGroups}
            checkoutSummary={checkoutSummary}
            isProductSelected={isProductSelected}
            onToggleProduct={toggleProduct}
            onSelectAllInTreatment={selectAllInTreatment}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
