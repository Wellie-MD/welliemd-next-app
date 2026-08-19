import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";

const INHERITED_MODULES = [
  { name: "GLP Weight Loss Intake", count: 3, programId: "program-glp-intake" },
  { name: "GLP Microdose Intake", count: 2, programId: "program-glp-microdose" },
  { name: "Branded GLP Intake", count: 3, programId: "program-branded-glp" },
  { name: "TRT Intake", count: 3, programId: "program-trt-intake" },
  { name: "HRT Intake", count: 2, programId: "program-hrt-intake" },
  { name: "Menopause Intake", count: 2, programId: "program-menopause-intake" },
  { name: "ED Intake", count: 3, programId: "program-glp-intake" },
  { name: "NAD Intake", count: 2, programId: "program-nad-intake" },
  { name: "Sermorelin Intake", count: 2, programId: "program-sermorelin" },
  { name: "Glutathione Intake", count: 1, programId: "program-glp-intake" },
];

/**
 * Checkout questions and products are inherited from attached Programs.
 * Custom Program-level product and price overrides are intentionally not
 * authorable here; this tab preserves the existing inherited-module links.
 */
export function CheckoutOptionTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-[12px] leading-relaxed text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div>
          <span className="mb-0.5 block font-semibold">Checkout questions are owned by Eligibility modules</span>
          Attached Programs provide their checkout questions and product mappings automatically. Manage those inherited questions from the Program detail page.
        </div>
      </div>

      <div className="space-y-2">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Inherited from attached Eligibility modules</div>
        {INHERITED_MODULES.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div>
              <div className="text-xs font-semibold leading-tight text-slate-700">{item.name}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">{item.count} Checkout {item.count === 1 ? "question" : "questions"}</div>
            </div>
            <Link
              to={ADMIN_TREATMENT_ROUTES.programQuestions(item.programId)}
              className="rounded-md border border-blue-200 px-3 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50"
            >
              Manage &rarr;
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
