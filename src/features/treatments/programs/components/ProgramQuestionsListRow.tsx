import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Check, Pencil, Trash2, Lock } from "lucide-react";
import type { ProgramQuestion } from "@/features/treatments/types";
import { Button } from "@/components/ui/button";
import { formatKindLabel } from "@/features/treatments/common/utils/questionList";

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
    disabled: !isReorderActive || question.system,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const isAuth = question.kind === "personal_details";
  const isSystem = !!question.system;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(question)}
      className={`grid grid-cols-[80px_1fr_120px_160px_100px] gap-6 px-6 py-4 items-center border-b border-slate-150 transition-colors group cursor-pointer ${
        isDragging ? "bg-slate-100/50 shadow-md" : "bg-white hover:bg-slate-50/80"
      }`}
    >
      {/* 1. Drag & Index */}
      <div className="flex items-center gap-2">
        {isReorderActive && !isSystem ? (
          <div
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
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
      {isAuth ? (
        <div className="min-w-0 pr-4">
          <div className="flex items-center gap-1.5">
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-amber-100 text-yellow-700">
              <Lock className="h-[11px] w-[11px]" />
            </span>
            <span className="text-[13px] font-semibold text-slate-800 truncate">Patient Authentication</span>
          </div>
          <div className="text-[11.5px] text-slate-500 truncate">Email — login if existing, create account if new</div>
        </div>
      ) : (
        <div className="text-[13px] font-semibold text-slate-800 leading-snug truncate pr-4">
          {question.text}
        </div>
      )}

      {/* 3. Required */}
      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
        {isAuth || question.required ? (
          <>
            <Check className="h-3.5 w-3.5 text-slate-500 stroke-[3]" />
            Required
          </>
        ) : (
          <span className="text-slate-300 font-normal">Optional</span>
        )}
      </div>

      {/* 4. Type */}
      <div className="flex items-center justify-start">
        <div className="inline-flex items-center px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-bold text-slate-600 bg-slate-50/50 shadow-sm">
          {isAuth ? "Authentication" : formatKindLabel(question.kind)}
        </div>
      </div>

      {/* 5. Actions (Hover Only) */}
      <div
        onClick={(event) => event.stopPropagation()}
        className="text-right flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isSystem ? (
          <span className="px-1.5 text-[10.5px] italic text-slate-400">System</span>
        ) : (
          <>
            {!isAuth && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(question)}
                className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg"
                title="Edit Element"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(question.id)}
              className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg"
              title={isAuth ? "Remove" : "Delete Element"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
