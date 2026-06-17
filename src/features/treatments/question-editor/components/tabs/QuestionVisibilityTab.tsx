import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Eye } from "lucide-react";
import type { ProgramQuestion, VisibilityRuleGroup } from "@/features/treatments/types";

interface QuestionVisibilityTabProps {
  visibilityRuleGroup: VisibilityRuleGroup | undefined;
  setVisibilityRuleGroup: (val: VisibilityRuleGroup | undefined) => void;
  questions: ProgramQuestion[];
  currentQuestionId: string;
}

export function QuestionVisibilityTab({
  visibilityRuleGroup,
  setVisibilityRuleGroup,
  questions,
  currentQuestionId,
}: QuestionVisibilityTabProps) {
  const hasRules = visibilityRuleGroup && visibilityRuleGroup.rules && visibilityRuleGroup.rules.length > 0;

  const handleAddRule = () => {
    if (!visibilityRuleGroup) {
      setVisibilityRuleGroup({
        mode: "simple",
        rules: [{ questionId: "", operator: "equals", value: "" }],
      });
    } else {
      setVisibilityRuleGroup({
        ...visibilityRuleGroup,
        rules: [...visibilityRuleGroup.rules, { questionId: "", operator: "equals", value: "" }],
      });
    }
  };

  const handleRemoveRule = (index: number) => {
    if (!visibilityRuleGroup) return;
    const newRules = [...visibilityRuleGroup.rules];
    newRules.splice(index, 1);
    if (newRules.length === 0) {
      setVisibilityRuleGroup(undefined);
    } else {
      setVisibilityRuleGroup({ ...visibilityRuleGroup, rules: newRules });
    }
  };

  const handleUpdateRule = (index: number, key: "questionId" | "operator" | "value", val: string) => {
    if (!visibilityRuleGroup) return;
    const newRules = [...visibilityRuleGroup.rules];
    newRules[index] = { ...newRules[index], [key]: val };
    setVisibilityRuleGroup({ ...visibilityRuleGroup, rules: newRules });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center h-5 w-5 rounded bg-green-100 text-green-600">
          <Eye className="h-3 w-3" />
        </div>
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">
          VISIBILITY
        </h3>
      </div>

      <div className="text-xs text-slate-500 leading-relaxed mb-4">
        By default, every question shows to every patient. Add rules below to limit when this question appears — e.g., only show it when an earlier question has a specific answer. Combine conditions with AND / OR groups.
      </div>

      {!hasRules ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-400 text-xs">
          No visibility rules — this question is always shown.
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRule}
              className="h-8 text-xs font-semibold text-slate-600 border-slate-200 bg-white shadow-sm"
            >
              + Add visibility rule
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">VISIBILITY RULE</span>
            <div className="flex items-center gap-3">
              <select className="h-8 rounded-md border border-slate-200 text-xs font-semibold px-2 bg-white">
                <option>OR group</option>
                <option>AND group</option>
              </select>
              <button
                onClick={() => setVisibilityRuleGroup(undefined)}
                className="text-xs font-semibold text-red-500 hover:text-red-700"
              >
                Remove rule
              </button>
            </div>
          </div>
          <p className="text-[11px] italic text-slate-400 mb-4">Any child can match.</p>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CONDITION GROUP</span>
              <div className="flex items-center gap-3">
                <select className="h-8 rounded-md border border-slate-200 text-xs font-semibold px-2 bg-white">
                  <option>AND group</option>
                  <option>OR group</option>
                </select>
                <button
                  onClick={() => setVisibilityRuleGroup(undefined)}
                  className="text-xs font-semibold text-red-500 hover:text-red-700"
                >
                  Remove group
                </button>
              </div>
            </div>
            <p className="text-[11px] italic text-slate-400 mb-4">All children must match.</p>

            <div className="space-y-3 mb-4">
              {visibilityRuleGroup.rules.map((rule, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3 relative">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">CONDITION</div>
                  <button
                    onClick={() => handleRemoveRule(idx)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end pr-8">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Question</label>
                      <select
                        className="w-full h-9 rounded-md border border-slate-200 px-3 text-xs font-medium bg-white"
                        value={rule.questionId}
                        onChange={(e) => handleUpdateRule(idx, "questionId", e.target.value)}
                      >
                        <option value="">— Select question —</option>
                        {questions
                          .filter((q) => q.id !== currentQuestionId && q.order < (questions.find(x => x.id === currentQuestionId)?.order || 999))
                          .map((q) => (
                            <option key={q.id} value={q.id}>
                              Step {q.order}: {q.text.substring(0, 30)}...
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Operator</label>
                      <select
                        className="w-full h-9 rounded-md border border-slate-200 px-3 text-xs font-medium bg-white"
                        value={rule.operator}
                        onChange={(e) => handleUpdateRule(idx, "operator", e.target.value as "equals" | "not_equals")}
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Does not equal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Value</label>
                      {rule.questionId ? (
                        <select
                          className="w-full h-9 rounded-md border border-slate-200 px-3 text-xs font-medium bg-white"
                          value={rule.value}
                          onChange={(e) => handleUpdateRule(idx, "value", e.target.value)}
                        >
                          <option value="">— Select value —</option>
                          {(questions.find(q => q.id === rule.questionId)?.choices || ["Yes", "No"]).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full h-9 rounded-md border border-slate-200 px-3 text-xs text-slate-400 bg-white flex items-center">
                          Select a question first
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRule}
                className="h-8 text-xs font-semibold text-slate-600 border-slate-200 bg-white"
              >
                + Add condition
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold text-slate-600 border-slate-200 bg-white opacity-50 cursor-not-allowed"
              >
                + Add subgroup
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRule}
              className="h-8 text-xs font-semibold text-slate-600 border-slate-200 bg-white"
            >
              + Add condition
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold text-slate-600 border-slate-200 bg-white opacity-50 cursor-not-allowed"
            >
              + Add subgroup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
