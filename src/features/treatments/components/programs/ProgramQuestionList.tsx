import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgramQuestion } from "../../types";

interface ProgramQuestionListProps {
  programId: string;
  questions: ProgramQuestion[];
}

export function ProgramQuestionList({ programId, questions }: ProgramQuestionListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Questions and Elements
      </div>
      <div className="divide-y divide-slate-100">
        {questions.map((question) => (
          <div key={question.id} className="grid grid-cols-[48px,1fr,120px,120px,72px] items-center gap-3 px-4 py-3 text-sm">
            <div className="text-slate-400">{question.order}</div>
            <Link
              to={`/dashboard/treatments/programs/${programId}/questions/${question.id}`}
              className="font-semibold text-slate-950 hover:text-[#12517A]"
            >
              {question.text}
            </Link>
            <div className="text-slate-600">{question.required ? "Required" : "Optional"}</div>
            <div className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{question.kind}</div>
            <Button asChild variant="ghost" size="sm">
              <Link to={`/dashboard/treatments/programs/${programId}/questions/${question.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
