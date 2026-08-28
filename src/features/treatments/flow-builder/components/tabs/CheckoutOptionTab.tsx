import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
import type { Program } from "@/features/treatments/types";

interface CheckoutOptionTabProps {
  programs: Program[];
  searchQuery?: string;
  flowItems?: Array<{ kind: string; title: string; sourceId?: string }>;
}

/**
 * Checkout questions and products are inherited from attached Programs.
 * Custom Program-level product and price overrides are intentionally not
 * authorable here; this tab preserves the existing inherited-module links.
 */
export function CheckoutOptionTab({
  programs,
  searchQuery = "",
  flowItems = [],
}: CheckoutOptionTabProps) {
  const attachedProgramIds = new Set(
    flowItems.filter((fi) => fi.kind === "program" && fi.sourceId).map((fi) => fi.sourceId),
  );
  const inheritedModules = programs.filter((program) => attachedProgramIds.has(program.id));
  const query = searchQuery.trim().toLowerCase();
  const filteredModules = inheritedModules.filter(
    (program) =>
      !query ||
      program.name.toLowerCase().includes(query) ||
      program.treatmentTypeKey.toLowerCase().includes(query) ||
      program.visitType.toLowerCase().includes(query) ||
      (program.description || "").toLowerCase().includes(query),
  );

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
        {filteredModules.map((program) => (
          <div key={program.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div>
              <div className="text-xs font-semibold leading-tight text-slate-700">{program.name}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">{program.checkoutQuestionCount} Checkout {program.checkoutQuestionCount === 1 ? "question" : "questions"}</div>
            </div>
            <Link
              to={ADMIN_TREATMENT_ROUTES.programQuestions(program.id)}
              className="rounded-md border border-blue-200 px-3 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50"
            >
              Manage &rarr;
            </Link>
          </div>
        ))}
        {!inheritedModules.length && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
            No Programs are attached to this flow yet. Attach one from the Programs tab to inherit its checkout questions.
          </p>
        )}
        {inheritedModules.length > 0 && query && !filteredModules.length && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
            No inherited checkout options matched your search.
          </p>
        )}
      </div>
    </div>
  );
}
