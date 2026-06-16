import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ProgramQuestion } from "../../types";

interface QuestionVisibilityTabProps {
  hasVisibilityRule: boolean;
  setHasVisibilityRule: (val: boolean) => void;
  visQuestionId: string;
  setVisQuestionId: (val: string) => void;
  visValue: string;
  setVisValue: (val: string) => void;
  questions: ProgramQuestion[];
  currentQuestionId: string;
}

export function QuestionVisibilityTab({
  hasVisibilityRule,
  setHasVisibilityRule,
  visQuestionId,
  setVisQuestionId,
  visValue,
  setVisValue,
  questions,
  currentQuestionId,
}: QuestionVisibilityTabProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Visibility Rules</h2>
        <label className="flex items-center gap-2 text-xs text-slate-500 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={hasVisibilityRule}
            onChange={(e) => setHasVisibilityRule(e.target.checked)}
            className="rounded text-[#12517A] focus:ring-[#12517A]"
          />
          Enable conditional logic
        </label>
      </div>
      <div className="p-6">
        {hasVisibilityRule ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Show this question only when another question matches a condition.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="visQ" className="text-xs font-medium text-slate-500">Question</Label>
                <select
                  id="visQ"
                  className="w-full mt-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs shadow-sm bg-white outline-none h-9"
                  value={visQuestionId}
                  onChange={(e) => setVisQuestionId(e.target.value)}
                >
                  <option value="">Select question...</option>
                  {questions
                    .filter((q) => q.id !== currentQuestionId)
                    .map((q) => (
                      <option key={q.id} value={q.id}>
                        Step {q.order}: {q.text.substring(0, 30)}...
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Condition</Label>
                <div className="w-full mt-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs bg-slate-50 select-none h-9 flex items-center">
                  Equals
                </div>
              </div>
              <div>
                <Label htmlFor="visVal" className="text-xs font-medium text-slate-500">Value</Label>
                <Input
                  id="visVal"
                  placeholder="e.g. Yes"
                  value={visValue}
                  onChange={(e) => setVisValue(e.target.value)}
                  className="mt-1.5 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] shadow-sm">
              Always visible
            </span>
            (This step is shown to all patients)
          </div>
        )}
      </div>
    </section>
  );
}
