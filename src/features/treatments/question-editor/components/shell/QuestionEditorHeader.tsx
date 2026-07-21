import { Button } from "@/components/ui/button";
import { ChevronLeft, Play } from "lucide-react";

interface QuestionEditorHeaderProps {
  title: string;
  subtitle: string;
  isEditMode: boolean;
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
  hideSave = false,
  onTestFlow,
  onClose,
  onSave,
}: QuestionEditorHeaderProps) {
  return (
    <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between shadow-sm z-20">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="shrink-0 h-9 px-3 text-xs font-bold text-slate-600 border-slate-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900 leading-tight tracking-tight">
            {title}
          </h2>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onTestFlow}
          disabled={!onTestFlow}
          className="h-9 px-4 text-xs font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm disabled:opacity-50"
          data-testid="question-editor-test-patient-flow"
        >
          <Play className="mr-2 h-3.5 w-3.5 text-slate-400 fill-slate-400" />
          Test Patient Flow
        </Button>
        {!hideSave && (
          <Button
            onClick={onSave}
            className="h-9 px-5 text-xs font-bold bg-[#3b82f6] text-white hover:bg-[#2563eb] shadow-sm"
            data-testid="question-editor-save"
          >
            {isEditMode ? "Save Changes" : "Add Question"}
          </Button>
        )}
      </div>
    </div>
  );
}
