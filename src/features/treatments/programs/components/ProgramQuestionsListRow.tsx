import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Check, Pencil, Trash2 } from "lucide-react";
import type { ProgramQuestion } from "@/features/treatments/types";
import { Button } from "@/components/ui/button";
import { QuestionTags } from "@/features/treatments/common/components/QuestionTags";
import { getQuestionTags } from "@/features/treatments/utils/questionTags";

interface ProgramQuestionsListRowProps {
  question: ProgramQuestion;
  index: number;
  isReorderActive: boolean;
  onEdit: (question: ProgramQuestion) => void;
  onDelete: (questionId: string) => void;
}

export function ProgramQuestionsListRow({
  question,
  index,
  isReorderActive,
  onEdit,
  onDelete,
}: ProgramQuestionsListRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    disabled: !isReorderActive,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const formatKindLabel = (kind: string) => {
    switch (kind) {
      case "single_choice":
        return "Single Choice";
      case "multiple_choice":
        return "Multiple Choice";
      case "yes_no":
        return "Yes/No";
      case "consent":
        return "Consent";
      case "checkout":
        return "Checkout";
      case "personal_details":
        return "Patient Authentication";
      case "state_routing":
        return "Service Area Check";
      case "section":
        return "Common Section";
      default:
        return kind.charAt(0).toUpperCase() + kind.slice(1);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[80px_1fr_120px_160px_100px] gap-6 px-6 py-4 items-center border-b border-slate-150 transition-colors group ${
        isDragging ? "bg-slate-100/50 shadow-md" : "bg-white hover:bg-slate-50/80"
      }`}
    >
      {/* 1. Drag & Index */}
      <div className="flex items-center gap-2">
        {isReorderActive ? (
          <div
            {...attributes}
            {...listeners}
            className="p-1 -ml-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        ) : (
          <div className="w-4 shrink-0" />
        )}
        <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-500 bg-white shadow-sm shrink-0">
          {index + 1}
        </div>
      </div>

      {/* 2. Text */}
      <div className="text-[13px] font-semibold text-slate-800 leading-snug truncate pr-4">
        {question.text}
      </div>

      {/* 3. Required */}
      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
        {question.required ? (
          <>
            <Check className="h-3.5 w-3.5 text-slate-500 stroke-[3]" />
            Required
          </>
        ) : (
          <span className="text-slate-300 font-normal">Optional</span>
        )}
      </div>

      {/* 4. Type & Tags */}
      <div className="flex flex-col gap-1.5 items-start justify-center">
        <div className="inline-flex items-center px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-bold text-slate-600 bg-slate-50/50 shadow-sm">
          {formatKindLabel(question.kind)}
        </div>
        <QuestionTags tags={getQuestionTags(question)} />
      </div>

      {/* 5. Actions (Hover Only) */}
      <div className="text-right flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(question)}
          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg"
          title="Edit Element"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(question.id)}
          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg"
          title="Delete Element"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
