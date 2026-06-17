import { ChevronDown, Plus, X } from "lucide-react";
import type { VisibilityRule } from "@/features/treatments/types";

interface CheckoutVisibilitySectionProps {
  visibilityMode: "simple" | "nested";
  rules: VisibilityRule[];
  screeningQuestions: Array<{ id: string; text: string }>;
  onVisibilityModeChange: (mode: "simple" | "nested") => void;
  onAddRule: () => void;
  onRemoveRule: (index: number) => void;
  onRuleFieldChange: (index: number, field: keyof VisibilityRule, value: string) => void;
}

export function CheckoutVisibilitySection({ visibilityMode, rules, screeningQuestions, onVisibilityModeChange, onAddRule, onRemoveRule, onRuleFieldChange }: CheckoutVisibilitySectionProps) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-bold text-slate-900">Visibility Rules</div>
          <div className="mt-0.5 text-[11.5px] text-slate-400">Show this Checkout question only when these conditions match.</div>
        </div>
        <div className="relative">
          <select value={visibilityMode} onChange={(event) => onVisibilityModeChange(event.target.value as "simple" | "nested")} className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-[11.5px] font-semibold text-slate-600 outline-none focus:border-blue-500" data-testid="checkout-visibility-mode">
            <option value="simple">Simple — single condition</option>
            <option value="nested">Advanced nested rules</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      <div className="text-[11px] italic leading-normal text-slate-400">Use advanced mode when you need branch convergence like (A AND B) OR (C AND D).</div>

      {rules.length > 0 && (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={rule.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <select value={rule.questionId} onChange={(event) => onRuleFieldChange(index, "questionId", event.target.value)} className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11.5px] outline-none" data-testid={`checkout-rule-question-${index}`}>
                <option value="">Select question...</option>
                {screeningQuestions.map((question) => <option key={question.id} value={question.id}>{question.text}</option>)}
                {screeningQuestions.length === 0 && <option value="sq-1">Are you currently pregnant, breastfeeding or planning to become pregnant?</option>}
              </select>
              <select value={rule.operator} onChange={(event) => onRuleFieldChange(index, "operator", event.target.value)} className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-[11.5px] outline-none" data-testid={`checkout-rule-operator-${index}`}>
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
              </select>
              <input type="text" value={rule.value} onChange={(event) => onRuleFieldChange(index, "value", event.target.value)} placeholder="Value" className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-[11.5px] outline-none" data-testid={`checkout-rule-value-${index}`} />
              <button type="button" onClick={() => onRemoveRule(index)} className="p-1 text-slate-400 hover:text-red-500" data-testid={`remove-checkout-rule-${index}`}>
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={onAddRule} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-3 text-[12px] font-bold text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50" data-testid="add-checkout-visibility-rule">
        <Plus className="h-4 w-4" />
        Add visibility rule
      </button>
    </div>
  );
}
