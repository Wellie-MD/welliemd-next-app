import { Link } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgramQuestion } from "../../types";

interface ProgramFlowCanvasProps {
  programId: string;
  questions: ProgramQuestion[];
  onReorder: (questionIds: string[]) => void;
  onDeleteQuestion: (questionId: string) => void;
}

const getQuestionKindLabel = (kind: ProgramQuestion["kind"]) => {
  switch (kind) {
    case "personal_details":
      return "Authentication";
    case "medical_conditions":
      return "Section";
    case "consent":
      return "Consent";
    case "checkout":
      return "Checkout";
    default:
      return "Question";
  }
};

export function ProgramFlowCanvas({
  programId,
  questions,
  onReorder,
  onDeleteQuestion,
}: ProgramFlowCanvasProps) {
  const moveQuestion = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const reordered = [...questions];
    const currentQuestion = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = currentQuestion;
    onReorder(reordered.map((question) => question.id));
  };

  return (
    <div className="flex min-h-[400px] items-center justify-start gap-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
      {questions.map((question, index) => (
        <div key={question.id} className="flex shrink-0 items-center gap-4">
          <div className="group relative flex h-48 w-64 flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[#12517A]">
            <div>
              <div className="mb-2 flex items-start justify-between">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                  Step {index + 1}
                </span>
                <span className="rounded border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-500">
                  {getQuestionKindLabel(question.kind)}
                </span>
              </div>
              <h4 className="line-clamp-3 text-xs font-semibold leading-snug text-slate-800">{question.text}</h4>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-slate-900 disabled:opacity-30"
                  disabled={index === 0}
                  onClick={() => moveQuestion(index, "up")}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-slate-900 disabled:opacity-30"
                  disabled={index === questions.length - 1}
                  onClick={() => moveQuestion(index, "down")}
                >
                  <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                </Button>
              </div>
              <div className="flex gap-1.5">
                <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                  <Link to={`/dashboard/treatments/programs/${programId}/questions/${question.id}`}>Edit</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onDeleteQuestion(question.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          {index < questions.length - 1 && <div className="text-lg font-bold text-slate-300">➔</div>}
        </div>
      ))}
    </div>
  );
}
