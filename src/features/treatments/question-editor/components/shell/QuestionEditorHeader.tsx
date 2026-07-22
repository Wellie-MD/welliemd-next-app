import { Button } from "@/components/ui/button";
import { ChevronLeft, Play } from "lucide-react";
import type { ProgramQuestion } from "@/features/treatments/types";
import { QuestionTags } from "@/features/treatments/common/components/QuestionTags";
import { getQuestionTags } from "@/features/treatments/utils/questionTags";

interface QuestionEditorHeaderProps {
  title: string;
  subtitle: string;
  isEditMode: boolean;
  activeQuestion?: ProgramQuestion | null;
  hideSave?: boolean;
  /** Called when the user clicks "Test Patient Flow". If omitted the button is disabled. */
  onTestFlow?: () => void;
  onClose: () => void;
  onSave: () => void;
}

export function QuestionEditorHeader({
  title,
  subtitle,
  isEditMode,
  activeQuestion,
  hideSave = false,
  onTestFlow,
  onClose,
  onSave,
}: QuestionEditorHeaderProps) {
  return (
    <div className="z-20 flex min-h-[56px] shrink-0 flex-col gap-2 border-b border-slate-200 bg-white px-5 py-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="h-8 shrink-0 border-slate-200 px-3 text-[11px] font-medium text-slate-600 shadow-none"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold leading-tight tracking-tight text-slate-900">
              {title}
            </h2>
            <QuestionTags tags={getQuestionTags(activeQuestion)} />
          </div>
          <div className="mt-0.5 text-[10px] font-medium text-slate-400">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onTestFlow}
          disabled={!onTestFlow}
          className="h-8 border-slate-200 bg-white px-4 text-[11px] font-medium text-slate-700 shadow-none hover:bg-slate-50 disabled:opacity-50"
          data-testid="question-editor-test-patient-flow"
        >
          <Play className="mr-2 h-3.5 w-3.5" />
          Test Patient Flow
        </Button>
        {!hideSave && (
          <Button onClick={onSave} data-testid="question-editor-save">
            {isEditMode ? "Save Changes" : "Add Question"}
          </Button>
        )}
      </div>
    </div>
  );
}
