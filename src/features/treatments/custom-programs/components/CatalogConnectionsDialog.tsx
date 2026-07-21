import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CatalogTab } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import type { CustomProgram } from "@/features/treatments/types";

interface CatalogConnectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: CustomProgram | null;
  activeTab: CatalogTab;
  onTabChange: (tab: CatalogTab) => void;
}

const CATALOG_TABS: CatalogTab[] = ["medicine", "checkout", "labs", "supplies", "hub"];

function MedicineTab({ program }: { program: CustomProgram }) {
  const medicineCount = program.runtimeSummary?.medicineCount;
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Connected Products</span>
      <p className="text-xs text-slate-600">
        {medicineCount == null
          ? "Publish this Custom Program to calculate its immutable product catalog."
          : `${medicineCount} medicine product${medicineCount === 1 ? "" : "s"} are connected through the published included Programs.`}
      </p>
      {program.checkoutOptions.length > 0 ? (
        <div className="space-y-2">
          {program.checkoutOptions.map((option) => (
            <div key={option.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div>
                <div className="text-xs font-semibold text-slate-800">{option.productName}</div>
                <div className="mt-0.5 font-mono text-[10px] text-slate-400">{option.dose} · {option.regimen}</div>
              </div>
              <div className="text-xs font-bold text-blue-600">${option.price}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-slate-500">No Custom Program-level checkout overrides. Included Program products remain active.</p>
      )}
    </div>
  );
}

function CheckoutTab({ program, onClose }: { program: CustomProgram; onClose: () => void }) {
  const summary = program.runtimeSummary;
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Checkout Questionnaire Mapping</span>
      <div className="space-y-2 text-xs text-slate-600">
        <p>
          The published flow contains <strong className="text-slate-900">{summary?.checkoutQuestionCount ?? 0} checkout questions</strong> and <strong className="text-slate-900">{summary?.productCount ?? 0} unique products</strong> inherited from its included Programs.
        </p>
        <p><strong className="text-slate-900">{program.checkoutOptions.length}</strong> Custom Program-level checkout overrides are configured.</p>
        <p>Users completing eligibility screening are routed to these products automatically upon matching recommendation criteria.</p>
        <Link to={`/dashboard/treatments/custom-programs/${program.id}/builder`} onClick={onClose} className="mt-1 inline-flex font-semibold text-blue-600 hover:underline">
          Manage checkout mappings in builder &rarr;
        </Link>
      </div>
    </div>
  );
}

function LabsTab({ program }: { program: CustomProgram }) {
  const labCount = program.runtimeSummary?.labCount;
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinical Labs</span>
      <p className="text-xs text-slate-600">
        {labCount == null
          ? "Publish this Custom Program to calculate its immutable lab requirements."
          : `${labCount} lab requirement${labCount === 1 ? "" : "s"} are connected through the published included Programs.`}
      </p>
    </div>
  );
}

function SuppliesTab({ program }: { program: CustomProgram }) {
  const supplyCount = program.runtimeSummary?.supplyCount;
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Fulfillment Supplies</span>
      <p className="text-xs text-slate-600">
        {supplyCount == null
          ? "Publish this Custom Program to calculate its immutable supply catalog."
          : `${supplyCount} required companion suppl${supplyCount === 1 ? "y is" : "ies are"} connected through the published included Programs.`}
      </p>
    </div>
  );
}

function HubTab({ program }: { program: CustomProgram }) {
  const rows = [
    ["Onboarding Display Name:", program.onboardingName || program.name],
    ["Target Audience:", program.audience.toUpperCase()],
    ["Age Gate Restrictions:", `${program.minAge}+`],
    ["Routing Key:", `/${program.slug}`],
    ["Published Runtime:", program.runtimeSummary ? `Release v${program.runtimeSummary.releaseVersion}` : "Not published"],
    ["Effective Patient Steps:", String(program.runtimeSummary?.effectiveQuestionCount ?? 0)],
  ];
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Hub Settings</span>
      <div className="space-y-2 text-xs text-slate-600">
        {rows.map(([label, value], index) => (
          <div key={label} className={cn("flex justify-between py-1", index < rows.length - 1 && "border-b border-slate-100")}>
            <span>{label}</span>
            <strong className="font-mono text-slate-800">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CatalogConnectionsDialog({ open, onOpenChange, program, activeTab, onTabChange }: CatalogConnectionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[16px] font-bold text-slate-900">Catalog Connections: {program?.name}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Manage product, checkout, labs, and supply assignments for the {program?.visitType || "universal"} flow.
          </DialogDescription>
        </DialogHeader>

        {program && (
          <div className="mt-2 space-y-4">
            <div className="flex border-b border-slate-100 pb-px">
              {CATALOG_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={cn(
                    "-mb-px border-b-2 px-3 pb-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                    activeTab === tab ? "border-blue-600 font-bold text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                  data-testid={`catalog-tab-${tab}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="min-h-[180px] py-2">
              {activeTab === "medicine" && <MedicineTab program={program} />}
              {activeTab === "checkout" && <CheckoutTab program={program} onClose={() => onOpenChange(false)} />}
              {activeTab === "labs" && <LabsTab program={program} />}
              {activeTab === "supplies" && <SuppliesTab program={program} />}
              {activeTab === "hub" && <HubTab program={program} />}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
