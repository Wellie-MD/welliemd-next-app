import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ProgramQuestion } from "@/features/treatments/types";

interface QuestionEditorSidebarProps {
  questions: ProgramQuestion[];
  activeQuestionId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectQuestion: (id: string | null) => void;
}

export function QuestionEditorSidebar({
  questions,
  activeQuestionId,
  searchQuery,
  onSearchChange,
  onSelectQuestion,
}: QuestionEditorSidebarProps) {
  const filteredQuestions = questions.filter((q) => q.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <aside className="border-r border-slate-200 bg-white flex flex-col overflow-hidden h-full z-10 w-[300px] shrink-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">FLOW</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
          {questions.length}
        </span>
      </div>

      <div className="px-5 py-3 border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search the flow..."
            className="pl-8 h-9 text-xs bg-white border-slate-200"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredQuestions.map((question) => {
          const isActive = question.id === activeQuestionId;
          const hasVisibility = !!question.visibilityRuleGroup || !!question.visibilityRule;
          const isDQ = question.dqChoices && question.dqChoices.length > 0;
          const isConsent = question.kind === "consent";
          const isAuth = question.kind === "auth" || question.kind === "personal_details";
          const isCheckout = question.kind === "checkout";

          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              className={`w-full text-left flex items-start gap-3 rounded-lg p-3 transition-all ${
                isActive
                  ? "bg-[#eff6ff] border-l-[3px] border-l-[#3b82f6] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  : "border-l-[3px] border-l-transparent hover:bg-slate-50 text-slate-600"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 ${
                  isActive ? "bg-[#3b82f6] text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {question.order}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`line-clamp-2 leading-tight text-xs mb-2 ${
                    isActive ? "font-bold text-[#1e3a8a]" : "font-semibold text-slate-700"
                  }`}
                >
                  {question.text || "(untitled question)"}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1">
                  {hasVisibility && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-100 text-amber-700">
                      IF
                    </span>
                  )}
                  {isDQ && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-red-100 text-red-700">
                      DQ
                    </span>
                  )}
                  {isConsent && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-purple-100 text-purple-700">
                      CONSENT
                    </span>
                  )}
                  {isAuth && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-orange-100 text-orange-700">
                      AUTH
                    </span>
                  )}
                  {isCheckout && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                      CHECKOUT
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
        <Button
          variant="outline"
          onClick={() => onSelectQuestion(null)}
          className={`w-full border-dashed shadow-sm h-9 text-xs font-bold ${
            !activeQuestionId
              ? "border-blue-300 text-blue-600 bg-blue-50/50 hover:bg-blue-50"
              : "border-slate-300 text-slate-500 bg-white hover:text-slate-800 hover:border-slate-400"
          }`}
        >
          + New Question
        </Button>
      </div>
    </aside>
  );
}
