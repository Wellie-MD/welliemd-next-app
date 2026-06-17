import { Button } from "@/components/ui/button";

export interface ScreeningQuestion {
  id: string;
  text: string;
  type: string;
  choices: string[];
}

interface ProgramScreeningQuestionsProps {
  questions: ScreeningQuestion[];
  onAdd: () => void;
  onViewAll?: () => void;
  // onEdit and onDelete left out of props if not needed visually right now, but good to have
}

export function ProgramScreeningQuestions({
  questions,
  onAdd,
  onViewAll,
}: ProgramScreeningQuestionsProps) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden mb-6">
      <div className="p-6 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-extrabold text-slate-900">Screening Questions</h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed font-medium">
            Eligibility questions that gate access to treatments and are referenced by the Checkout questions' visibility rules. Click <strong className="font-bold">Add Screening Question</strong> to open the question editor; the new question is added to this module.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onViewAll && (
            <Button
              onClick={onViewAll}
              variant="outline"
              size="sm"
              className="text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-bold text-[12px] h-9 px-4 rounded-lg shadow-sm"
            >
              View all
            </Button>
          )}
          <Button
            onClick={onAdd}
            size="sm"
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[12px] h-9 px-4 rounded-lg shadow-sm"
          >
            + Add Screening Question
          </Button>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {questions.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 italic text-[13px]">
            No screening questions configured.
          </div>
        ) : (
          questions.map((sq, idx) => (
            <div key={sq.id} className="px-6 py-5 flex items-start gap-6 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="text-[13px] font-medium text-slate-400 mt-0.5">
                Q{idx + 1}
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold text-slate-900 leading-tight">
                  {sq.text}
                </h4>
                <div className="text-[10px] text-slate-400 mt-1.5 font-medium">
                  Type: {sq.type} · {sq.choices.length} options
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
