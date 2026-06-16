import type { QuestionKind } from "../../types";

interface QuestionPreviewTabProps {
  text: string;
  kind: QuestionKind;
  choices: string[];
  consentText: string;
}

export function QuestionPreviewTab({
  text,
  kind,
  choices,
  consentText,
}: QuestionPreviewTabProps) {
  const isChoiceType = kind === "choice" || kind === "single_choice" || kind === "multiple_choice";

  return (
    <aside className="border-l border-slate-200 bg-[#0f172a] flex flex-col">
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient Preview</span>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live</span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto">
        {/* Phone Mockup Frame */}
        <div className="w-[320px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-slate-800 flex flex-col h-[600px] shrink-0 relative">
          {/* Fake Browser Header */}
          <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-center relative shrink-0">
            <div className="absolute left-4 flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
            </div>
            <div className="text-[10px] font-medium text-slate-400 font-mono bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              welliemd.com/intake
            </div>
          </div>

          {/* App Content */}
          <div className="flex-1 overflow-y-auto bg-white flex flex-col relative">
            {/* Progress Bar Mock */}
            <div className="h-1 bg-slate-100 w-full shrink-0">
              <div className="h-full bg-[#12517A] w-1/3"></div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                Question Preview
              </div>

              <h3 className="text-base font-semibold text-slate-900 leading-snug mb-8">
                {text || "Question text will appear here."}
              </h3>

              {isChoiceType && (
                <div className="space-y-2">
                  {choices.map((choice, index) => (
                    <div
                      key={index}
                      className="h-12 rounded-xl bg-slate-100/50 border border-slate-200 flex items-center px-4 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700"
                    >
                      <div className="h-4 w-4 rounded-full border border-slate-300 mr-3 shrink-0"></div>
                      {choice}
                    </div>
                  ))}
                </div>
              )}

              {kind === "consent" && (
                <div className="p-4 border rounded bg-slate-50 max-h-[200px] overflow-y-auto text-[10px] leading-relaxed text-slate-600">
                  {consentText || "No consent text defined."}
                </div>
              )}

              {!isChoiceType && kind !== "consent" && (
                <div className="mt-auto space-y-3 pb-4">
                  <div className="h-12 rounded-xl bg-slate-100/50 border border-slate-200 flex items-center px-4 opacity-50">
                    <div className="h-2.5 w-32 bg-slate-300 rounded"></div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 shrink-0 mt-auto">
                <div className="h-12 w-full rounded-xl bg-[#12517A] text-white flex items-center justify-center font-bold text-sm shadow-sm select-none">
                  Continue
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
