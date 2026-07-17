import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlowTestModule } from "@/features/treatments/flow-builder/hooks/usePatientFlowTest";
import { FlowTestQuestionRenderer } from "./FlowTestQuestionRenderer";

interface FlowTestModuleSectionProps {
  module: FlowTestModule;
  answers: Record<string, string | string[]>;
  onSingleChange: (questionId: string, value: string) => void;
  onMultiChange: (questionId: string, choice: string, checked: boolean) => void;
}

export function FlowTestModuleSection({
  module,
  answers,
  onSingleChange,
  onMultiChange,
}: FlowTestModuleSectionProps) {
  return (
    <section
      aria-label={module.name}
      data-testid={`flow-test-module-${module.id}`}
    >
      {/* Module section header — matches screenshot "GLP WEIGHT LOSS INTAKE" styling */}
      <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-blue-600">
        {module.name}
      </div>

      {module.isLoading ? (
        <div className="flex items-center gap-2 py-4 text-[12px] text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading questions…
        </div>
      ) : module.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3">
          <p className="text-[12px] font-semibold text-red-700">
            Failed to load module questions.
          </p>
          {module.errorMessage && (
            <p className="mt-1 text-[11px] text-red-600">
              {module.errorMessage}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-8 rounded-lg border-red-200 px-3 text-[11px] font-semibold text-red-700 hover:bg-red-50"
            onClick={module.retry}
            data-testid={`flow-test-retry-${module.id}`}
          >
            Retry
          </Button>
        </div>
      ) : module.questions.length === 0 ? (
        <p className="py-3 text-[12px] italic text-slate-400">
          No screening questions defined for this module.
        </p>
      ) : (
        <div className="space-y-4">
          {module.questions.map((question) => (
            <FlowTestQuestionRenderer
              key={question.id}
              question={question}
              answer={answers[question.id]}
              onSingleChange={onSingleChange}
              onMultiChange={onMultiChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}
