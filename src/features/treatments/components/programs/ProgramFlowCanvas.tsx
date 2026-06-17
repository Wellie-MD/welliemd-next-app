import { ArrowDown, Check } from "lucide-react";

interface ScreeningQuestion {
  id: string;
  text: string;
  type: string;
  choices: string[];
}

interface ProgramFlowCanvasProps {
  programId: string;
  screeningQuestions: ScreeningQuestion[];
}

export function ProgramFlowCanvas({ screeningQuestions }: ProgramFlowCanvasProps) {
  return (
    <div className="w-full">
      {/* Container matching screenshot (white background, thin border) */}
      <div className="rounded-xl border border-slate-200 bg-white min-h-[600px] p-6 shadow-sm flex flex-col">
        
        {/* Legend Block - Top Left, no borders */}
        <div className="flex flex-wrap items-center gap-5 text-[11px] font-semibold text-slate-500 mb-10">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Continue
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            Disqualifies
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            Conditional
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            Inline consent
          </div>
        </div>

        {/* Vertical Flow Diagram Canvas */}
        <div className="flex-1 flex flex-col items-center">
          
          {/* Node 1: Entry */}
          <div className="bg-slate-900 text-white rounded-lg px-6 py-3 shadow-sm text-[12px] font-bold flex items-center gap-2">
            <span className="text-slate-400 font-normal">&rsaquo;</span>
            Patient enters eligibility
          </div>

          {/* Thin line connector */}
          <div className="flex flex-col items-center my-1.5 text-slate-300">
            <svg width="12" height="24" viewBox="0 0 12 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 0v22m0 0-3-3m3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Node 2..N: Screening Questions */}
          {screeningQuestions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center text-xs text-slate-400 italic font-medium w-full max-w-lg">
              No screening questions configured. Add questions in the list view to see them here.
            </div>
          ) : (
            screeningQuestions.map((q, qIdx) => (
              <div key={q.id} className="w-full flex flex-col items-center">
                {qIdx > 0 && (
                  <div className="flex flex-col items-center my-1.5 text-slate-300">
                    <svg width="12" height="24" viewBox="0 0 12 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 0v22m0 0-3-3m3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-[640px] max-w-full p-4">
                  {/* Question Node Header */}
                  <div className="flex items-start gap-3">
                    <span className="h-7 w-7 rounded-full bg-white text-[10px] font-bold text-slate-500 flex items-center justify-center border border-slate-200 shrink-0 mt-0.5">
                      Q{qIdx + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none mb-1.5">
                        {q.type === "single" ? "Single-Choice" : "Multiple-Choice"}
                      </span>
                      <h4 className="text-[13px] font-bold text-slate-800 leading-tight">
                        {q.text || "(no text)"}
                      </h4>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-200 my-4"></div>

                  {/* Choice options details */}
                  <div className="space-y-3 px-1">
                    {(q.choices.length > 0 ? q.choices : ["Option 1", "Option 2"]).map((choice, cIdx) => (
                      <div key={cIdx} className="flex justify-between items-center text-[12px] text-slate-700 font-semibold">
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-300 font-normal">&rarr;</span>
                          {choice}
                        </div>
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-[#e6f4ea] rounded px-2 py-1 inline-flex items-center gap-1 tracking-wide">
                          <Check className="h-3 w-3 stroke-[3]" />
                          CONTINUE
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Thin line connector */}
          <div className="flex flex-col items-center my-1.5 text-slate-300">
            <svg width="12" height="24" viewBox="0 0 12 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 0v22m0 0-3-3m3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Node Last: Eligible to Checkout */}
          <div className="bg-[#1ca65a] text-white rounded-xl px-12 py-3 shadow-sm text-[13px] font-bold flex items-center gap-3 text-center max-w-[280px]">
            <Check className="h-4 w-4 shrink-0 stroke-[3]" />
            <div className="leading-tight">
              Patient is eligible — continues<br/>to Checkout
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
