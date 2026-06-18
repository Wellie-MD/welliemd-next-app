import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import { QuestionEditorDialog } from "@/features/treatments/question-editor/components/shell/QuestionEditorDialog";
import type { ProgramQuestion } from "@/features/treatments/types";

interface QuestionCreatorTabProps {
  onAddItem: (item: {
    kind: "routing_question";
    title: string;
    subtitle: string;
  }) => void;
  flowItems?: Array<{ kind: string; title: string }>;
}

const AVAILABLE_QUESTIONS = [
  { id: "rq-1", title: "What would you love to change about how you feel?", type: "multiple" },
  { id: "rq-2", title: "Tell us about your weight right now.", type: "bmi" },
  { id: "rq-3", title: "When it comes to GLP medications, what fits your preferences?", type: "single" },
  { id: "rq-4", title: "When it comes to intimacy, what's closest to your experience?", type: "single" },
  { id: "rq-5", title: "How would you describe your energy week to week?", type: "single" },
  { id: "rq-6", title: "One last thing — to recommend the right hormone path, what sex were you assigned at birth?", type: "single" },
];

export function QuestionCreatorTab({ onAddItem, flowItems = [] }: QuestionCreatorTabProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const handleCreateQuestion = (q: ProgramQuestion) => {
    onAddItem({
      kind: "routing_question",
      title: q.text || "(untitled question)",
      subtitle: `Routing question (${q.kind}).`,
    });
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Create custom question action */}
      <button
        onClick={() => setIsEditorOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-700 bg-white transition-all text-xs font-semibold shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Create new custom question
      </button>

      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Existing questions in this plan
        </div>

        {AVAILABLE_QUESTIONS.map((q) => {
          const added = flowItems.some((item) => item.title === q.title);
          return (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex justify-between items-center"
            >
              <div className="min-w-0 flex-1 pr-4">
                <div className="text-xs font-semibold text-slate-700 leading-tight">
                  {q.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {q.type}
                </div>
              </div>

              {added ? (
                <span className="shrink-0 h-7 w-7 inline-flex items-center justify-center text-emerald-600 rounded-md border border-emerald-100 bg-emerald-50">
                  <Check className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-7 w-7 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() =>
                    onAddItem({
                      kind: "routing_question",
                      title: q.title,
                      subtitle: `Routing question (${q.type}).`,
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <QuestionEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        onSave={handleCreateQuestion}
        questions={[]}
        initialQuestionId={null}
      />
    </div>
  );
}
