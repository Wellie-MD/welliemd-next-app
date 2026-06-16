import { Link } from "react-router-dom";
import { MoreHorizontal, GripVertical, MessageSquare, ShieldCheck, LayoutTemplate, FileText, ShoppingCart, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgramQuestion } from "../../types";

interface ProgramQuestionListProps {
  programId: string;
  questions: ProgramQuestion[];
  isReordering?: boolean;
  onReorder?: (questionIds: string[]) => void;
  onDeleteQuestion?: (id: string) => void;
}

export function ProgramQuestionList({
  programId,
  questions,
  isReordering = false,
  onReorder,
  onDeleteQuestion,
}: ProgramQuestionListProps) {
  const getIconForKind = (kind: string) => {
    switch(kind) {
      case "text":
      case "choice":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "auth":
        return <ShieldCheck className="h-4 w-4 text-indigo-500" />;
      case "section":
        return <LayoutTemplate className="h-4 w-4 text-emerald-500" />;
      case "consent":
        return <FileText className="h-4 w-4 text-amber-500" />;
      case "checkout":
        return <ShoppingCart className="h-4 w-4 text-rose-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-slate-400" />;
    }
  };

  const getChipStyle = (kind: string) => {
    switch(kind) {
      case "auth":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "section":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "consent":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "checkout":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-blue-50 text-blue-700 border-blue-100";
    }
  };

  const getDisplayKind = (kind: string) => {
    switch(kind) {
      case "text":
      case "choice":
        return "Question";
      case "auth": return "Authentication";
      case "section": return "Section";
      case "consent": return "Consent";
      case "checkout": return "Checkout";
      default: return "Question";
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!onReorder) return;
    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;

    // Swap
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;

    onReorder(newQuestions.map((q) => q.id));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Questions and Elements
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {questions.map((question, index) => (
          <div key={question.id} className="grid grid-cols-[32px,32px,1fr,120px,140px,120px] items-center gap-3 px-4 py-3 text-sm group hover:bg-slate-50 transition-colors">
            <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="text-slate-400 font-medium text-xs bg-slate-100 w-6 h-6 rounded flex items-center justify-center">
              {index + 1}
            </div>
            <div className="flex items-center gap-3 min-w-0">
              {getIconForKind(question.kind)}
              <Link
                to={`/dashboard/treatments/programs/${programId}/questions/${question.id}`}
                className="font-medium text-slate-900 hover:text-[#12517A] hover:underline truncate"
              >
                {question.text}
              </Link>
            </div>
            <div className="text-slate-500 text-xs font-medium">
              {question.required ? "Required" : "Optional"}
            </div>
            <div>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getChipStyle(question.kind)}`}>
                {getDisplayKind(question.kind)}
              </span>
            </div>
            <div className="flex justify-end gap-1">
              {isReordering ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-[#12517A]"
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-[#12517A]"
                    disabled={index === questions.length - 1}
                    onClick={() => handleMove(index, "down")}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/dashboard/treatments/programs/${programId}/questions/${question.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDeleteQuestion?.(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
