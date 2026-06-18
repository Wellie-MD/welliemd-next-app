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
  onClose: () => void;
  onSave: () => void;
}

export function QuestionEditorHeader({
  title,
  subtitle,
  isEditMode,
  activeQuestion,
  hideSave = false,
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
          <div className="flex items-center gap-3">
            <h2 className="text-[17px] font-extrabold text-slate-900 leading-tight tracking-tight">
              {title}
            </h2>
            <QuestionTags tags={getQuestionTags(activeQuestion)} />
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-9 px-4 text-xs font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
        >
          <Play className="mr-2 h-3.5 w-3.5 text-slate-400 fill-slate-400" />
          Test Patient Flow
        </Button>
        {!hideSave && (
          <Button
            onClick={onSave}
            className="h-9 px-5 text-xs font-bold bg-[#3b82f6] text-white hover:bg-[#2563eb] shadow-sm"
          >
            {isEditMode ? "Save Changes" : "Add Question"}
          </Button>
        )}
      </div>
    </div>
  );
}
