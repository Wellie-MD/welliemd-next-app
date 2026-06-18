import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgramCheckoutProduct, ProgramCheckoutQuestion, VisibilityRuleGroup } from "@/features/treatments/types";

interface ProgramCheckoutQuestionsProps {
  questions: ProgramCheckoutQuestion[];
  onAdd: () => void;
  onEdit: (q: ProgramCheckoutQuestion) => void;
  onDelete: (id: string) => void;
}

const renderProductSummary = (products: ProgramCheckoutProduct[]) => {
  if (!products.length) {
    return <span className="text-slate-400 italic">No products configured</span>;
  }

  return (
    <div className="space-y-1.5">
      {products.map((product, index) => (
        <div key={product.id || `prod-${index}`}>
          <span className="font-bold text-slate-900">{product.category}</span>
          <span className="text-slate-400">
            {" · "}
            {product.regimen} · {product.doseLabel}
          </span>
        </div>
      ))}
    </div>
  );
};

const renderVisibilitySummary = (visibilityRules: VisibilityRuleGroup) => {
  const ruleCount = visibilityRules.rules.length;
  if (ruleCount === 0) {
    return "Always visible";
  }

  return `${visibilityRules.mode === "nested" ? "Nested" : "Simple"} visibility · ${ruleCount} rule${
    ruleCount === 1 ? "" : "s"
  }`;
};

export function ProgramCheckoutQuestions({
  questions,
  onAdd,
  onEdit,
  onDelete,
}: ProgramCheckoutQuestionsProps) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden mb-6">
      <div className="p-6 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-extrabold text-slate-900">Checkout Questions</h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed font-medium">
            Each Checkout question maps a Category/Regimen/Dose to a product, with nested visibility rules deciding when it's shown. Any plan that attaches this eligibility inherits these automatically.
          </p>
        </div>
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[12px] h-9 px-4 rounded-lg shadow-sm"
        >
          + Add Checkout Question
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 tracking-widest">
              <th className="px-6 py-4 font-bold">Question Text</th>
              <th className="px-6 py-4 font-bold">Category - Regimen - Dose</th>
              <th className="px-6 py-4 font-bold">Visibility Rules</th>
              <th className="px-6 py-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic text-[13px]">
                  No checkout questions defined.
                </td>
              </tr>
            ) : (
              questions.map((cq) => (
                <tr key={cq.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 text-[13px] font-bold text-slate-900 w-1/3">
                    {cq.text}
                  </td>
                  <td className="px-6 py-5 text-[13px]">
                    {renderProductSummary(cq.products)}
                  </td>
                  <td className="px-6 py-5 text-[13px] text-slate-400 font-medium">
                    {renderVisibilitySummary(cq.visibilityRules)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <button
                        onClick={() => onEdit(cq)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(cq.id)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
