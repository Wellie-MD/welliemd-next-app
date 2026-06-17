import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { QuestionKind } from "@/features/treatments/types";

interface QuestionPreviewTabProps {
  text: string;
  kind: QuestionKind;
  choices: string[];
  consentText: string;
  order: number;
  totalQuestions: number;
}

export function QuestionPreviewTab({
  text,
  kind,
  choices,
  consentText,
  order,
  totalQuestions,
}: QuestionPreviewTabProps) {
  const isChoiceType = kind === "choice" || kind === "single_choice" || kind === "multiple_choice";

  return (
    <aside className="bg-[#1c2333] h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">PATIENT PREVIEW</span>
        </div>
        <span className="text-[10px] text-slate-400">Updates live</span>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Mock Browser Header */}
          <div className="flex items-center px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex gap-1.5 mr-4">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-slate-100/80 rounded px-4 py-1 text-[10px] text-slate-400 font-medium">
                welliemd.com/intake
              </div>
            </div>
            <div className="w-[42px]"></div> {/* Spacer for centering */}
          </div>

          {/* Mock Browser Body */}
          <div className="p-6">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              QUESTION {order} OF {totalQuestions}
            </div>
            
            <h2 className="text-lg font-bold text-slate-900 leading-snug mb-6">
              {text || "Enter question text..."}
            </h2>

            {kind === "text" || kind === "textarea" ? (
              <Input placeholder="Enter your answer" className="bg-slate-50 text-sm h-10" disabled />
            ) : kind === "number" ? (
              <Input type="number" placeholder="Enter number" className="bg-slate-50 text-sm h-10" disabled />
            ) : isChoiceType ? (
              <div className="space-y-2">
                {(choices.length > 0 ? choices : ["Option 1", "Option 2"]).map((choice, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50 opacity-80">
                    <div className="h-4 w-4 rounded border border-slate-300 bg-white"></div>
                    <span className="text-sm font-medium text-slate-700">{choice}</span>
                  </div>
                ))}
              </div>
            ) : kind === "consent" ? (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 h-32 overflow-hidden relative">
                  {consentText || "Consent document text appears here..."}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent"></div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox disabled className="mt-0.5" />
                  <span className="text-xs font-medium text-slate-700">
                    I have read and agree to the terms above.
                  </span>
                </div>
              </div>
            ) : kind === "yes_no" ? (
              <div className="space-y-2">
                {["Yes", "No"].map((choice, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50 opacity-80">
                    <div className="h-4 w-4 rounded-full border border-slate-300 bg-white"></div>
                    <span className="text-sm font-medium text-slate-700">{choice}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-center text-xs text-slate-400">
                Standard Input Preview
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
