import { FileCheck, Layers3, LockKeyhole, Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ProgramQuestion } from "@/features/treatments/types";
import { QuestionTags } from "@/features/treatments/common/components/QuestionTags";
import { getQuestionTags } from "@/features/treatments/utils/questionTags";
import { PROGRAM_ELEMENT_TONES } from "@/features/treatments/programs/programAuthoringConstants";

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
    <aside className="z-10 flex h-full w-[280px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50">
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
          const isAuth = question.kind === "patient_authentication";
          const isCheckout = question.kind === "checkout";
          const isConsent = question.kind === "consent";
          const isSection = question.kind === "section";
          const tone = isAuth ? PROGRAM_ELEMENT_TONES.auth : isCheckout ? PROGRAM_ELEMENT_TONES.checkout : isConsent ? PROGRAM_ELEMENT_TONES.consent : isSection ? PROGRAM_ELEMENT_TONES.section : PROGRAM_ELEMENT_TONES.question;
          const Icon = isAuth ? LockKeyhole : isCheckout ? ShoppingCart : isConsent ? FileCheck : isSection ? Layers3 : null;

          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              className={`flex w-full items-start gap-2 rounded-md border-l-[3px] px-2 py-2 text-left transition-all ${
                isActive
                  ? tone.active
                  : "border-l-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div
                className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                  isActive ? "bg-slate-600 text-white" : "border border-slate-200 bg-white text-slate-500"
                }`}
              >
                {question.order}
              </div>
              <div className="min-w-0 flex-1">
                {Icon && (
                  <span className={`mb-1 inline-flex h-4 w-4 items-center justify-center rounded border ${tone.icon}`}>
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                )}
                <div
                  className={`line-clamp-2 text-[10.5px] leading-[1.3] ${
                    isActive ? "font-semibold text-slate-900" : "font-medium text-slate-700"
                  }`}
                >
                  {question.text || "(untitled question)"}
                </div>

                <QuestionTags tags={getQuestionTags(question)} className="mt-1" />
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
